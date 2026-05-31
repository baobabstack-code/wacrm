import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT =
  'You are a sales analyst for a WhatsApp CRM. Analyze this conversation and score the lead. ' +
  'Reply with ONLY valid JSON in this exact format, no markdown, no extra text: ' +
  '{"score":"hot","reason":"one sentence max 80 chars"} ' +
  'Use "hot" for strong buying signals or urgency, "warm" for interested but not yet committed, ' +
  '"cold" for no engagement or negative signals.';

type LeadScore = 'hot' | 'warm' | 'cold';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = checkRateLimit(`score-lead:${user.id}`, RATE_LIMITS.scoreLead);
    if (!limit.success) {
      return rateLimitResponse(limit);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[ai/score-lead] GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'AI scoring feature is not configured' },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    const { conversation_id } = (body ?? {}) as { conversation_id?: string };

    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, contact:contacts(name, phone)')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('sender_type, content_type, content_text')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (msgError) {
      console.error('[ai/score-lead] Failed to fetch messages:', msgError);
      return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages in conversation' }, { status: 422 });
    }

    const transcript = [...messages]
      .reverse()
      .map((m) => {
        const role = m.sender_type === 'customer' ? '[Customer]' : '[Agent]';
        const text =
          m.content_type === 'text' && m.content_text ? m.content_text : '[Media]';
        return `${role}: ${text}`;
      })
      .join('\n');

    const contact = Array.isArray(conversation.contact)
      ? conversation.contact[0]
      : conversation.contact;
    const contactName = (contact as { name?: string } | null)?.name?.trim();
    const userPrompt = contactName
      ? `Contact name: ${contactName}\n\nConversation:\n${transcript}`
      : `Conversation:\n${transcript}`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.2,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      console.error('[ai/score-lead] Gemini API error:', geminiRes.status, errBody);
      return NextResponse.json(
        { error: 'AI service returned an error. Please try again.' },
        { status: 502 },
      );
    }

    const geminiData = await geminiRes.json();
    const raw: string | undefined = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw || !raw.trim()) {
      console.error('[ai/score-lead] Gemini returned empty response:', geminiData);
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 },
      );
    }

    let parsed: { score: LeadScore; reason: string };
    try {
      // Strip markdown code fences if Gemini wraps the JSON
      const cleaned = raw.trim().replace(/^```json?\s*/i, '').replace(/```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[ai/score-lead] Failed to parse Gemini JSON:', raw);
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.' },
        { status: 502 },
      );
    }

    const validScores: LeadScore[] = ['hot', 'warm', 'cold'];
    if (!validScores.includes(parsed.score) || typeof parsed.reason !== 'string') {
      console.error('[ai/score-lead] Invalid score shape:', parsed);
      return NextResponse.json(
        { error: 'AI returned an invalid score. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      score: parsed.score,
      reason: parsed.reason.slice(0, 120),
    });
  } catch (error) {
    console.error('[ai/score-lead] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to score lead' }, { status: 500 });
  }
}
