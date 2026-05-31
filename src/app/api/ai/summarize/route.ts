import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT =
  'You are a CRM assistant summarizing a WhatsApp conversation for a support agent. ' +
  'Write a concise summary (3-5 sentences max) covering: what the customer wants or asked about, ' +
  'any key details mentioned (order numbers, dates, issues), and where things stand. ' +
  'Write in plain prose — no bullet points, no headings, no markdown. ' +
  'Address the summary to the agent, e.g. "The customer asked about..."';

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

    const limit = checkRateLimit(`summarize:${user.id}`, RATE_LIMITS.summarize);
    if (!limit.success) {
      return rateLimitResponse(limit);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[ai/summarize] GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'AI summarize feature is not configured' },
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
      .limit(40);

    if (msgError) {
      console.error('[ai/summarize] Failed to fetch messages:', msgError);
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
          maxOutputTokens: 200,
          temperature: 0.3,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      console.error('[ai/summarize] Gemini API error:', geminiRes.status, errBody);
      return NextResponse.json(
        { error: 'AI service returned an error. Please try again.' },
        { status: 502 },
      );
    }

    const geminiData = await geminiRes.json();
    const summary: string | undefined =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary || !summary.trim()) {
      console.error('[ai/summarize] Gemini returned empty response:', geminiData);
      return NextResponse.json(
        { error: 'AI returned an empty summary. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error('[ai/summarize] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to summarize conversation' }, { status: 500 });
  }
}
