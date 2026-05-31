import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimitForTests } from "@/lib/rate-limit";

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "user-1" } },
  error: null,
});

const mockConvSingle = vi.fn().mockResolvedValue({
  data: { id: "conv-1", contact: { name: "Bob", phone: "+1234" } },
  error: null,
});

const mockMessages = vi.fn().mockResolvedValue({
  data: [
    { sender_type: "customer", content_type: "text", content_text: "I want to buy your product" },
    { sender_type: "agent", content_type: "text", content_text: "Great, let me help you." },
  ],
  error: null,
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === "conversations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: mockConvSingle,
        };
      }
      if (table === "messages") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: mockMessages,
        };
      }
      return {};
    }),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function geminiOk(text: string) {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
  });
}

function geminiError(status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: { message: "API error" } }),
  });
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/ai/score-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/score-lead", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockConvSingle.mockResolvedValue({
      data: { id: "conv-1", contact: { name: "Bob", phone: "+1234" } },
      error: null,
    });
    mockMessages.mockResolvedValue({
      data: [
        { sender_type: "customer", content_type: "text", content_text: "I want to buy" },
        { sender_type: "agent", content_type: "text", content_text: "Sure!" },
      ],
      error: null,
    });
  });

  it("returns score and reason on success", async () => {
    mockFetch.mockImplementationOnce(() =>
      geminiOk('{"score":"hot","reason":"Strong purchase intent expressed"}')
    );
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBe("hot");
    expect(body.reason).toBe("Strong purchase intent expressed");
  });

  it("handles Gemini wrapping JSON in markdown code fences", async () => {
    mockFetch.mockImplementationOnce(() =>
      geminiOk('```json\n{"score":"warm","reason":"Interested but undecided"}\n```')
    );
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBe("warm");
  });

  it("returns 400 when conversation_id is missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("no session") });
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 when GEMINI_API_KEY is not set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(503);
  });

  it("returns 404 when conversation not found", async () => {
    mockConvSingle.mockResolvedValueOnce({ data: null, error: new Error("not found") });
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(404);
  });

  it("returns 422 when there are no messages", async () => {
    mockMessages.mockResolvedValueOnce({ data: [], error: null });
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(422);
  });

  it("returns 502 when Gemini returns a non-2xx response", async () => {
    mockFetch.mockImplementationOnce(() => geminiError(500));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(502);
  });

  it("returns 502 when Gemini returns invalid JSON", async () => {
    mockFetch.mockImplementationOnce(() => geminiOk("not json at all"));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(502);
  });

  it("returns 502 when score is not a valid value", async () => {
    mockFetch.mockImplementationOnce(() =>
      geminiOk('{"score":"unknown","reason":"test"}')
    );
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(502);
  });

  it("truncates reason to 120 chars", async () => {
    const longReason = "A".repeat(200);
    mockFetch.mockImplementationOnce(() =>
      geminiOk(`{"score":"cold","reason":"${longReason}"}`)
    );
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    const body = await res.json();
    expect(body.reason.length).toBe(120);
  });
});
