import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimitForTests } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Supabase mock — returns auth + conversation + messages by default.
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "user-1" } },
  error: null,
});

const mockConvSingle = vi.fn().mockResolvedValue({
  data: { id: "conv-1", contact: { name: "Alice", phone: "+1234" } },
  error: null,
});

const mockMessages = vi.fn().mockResolvedValue({
  data: [
    { sender_type: "customer", content_type: "text", content_text: "Hello" },
    { sender_type: "agent", content_type: "text", content_text: "Hi there!" },
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

// ---------------------------------------------------------------------------
// Gemini fetch mock
// ---------------------------------------------------------------------------
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
  return new Request("http://localhost/api/ai/draft-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/draft-reply", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockConvSingle.mockResolvedValue({
      data: { id: "conv-1", contact: { name: "Alice", phone: "+1234" } },
      error: null,
    });
    mockMessages.mockResolvedValue({
      data: [
        { sender_type: "customer", content_type: "text", content_text: "Hello" },
        { sender_type: "agent", content_type: "text", content_text: "Hi!" },
      ],
      error: null,
    });
  });

  it("returns a draft on success", async () => {
    mockFetch.mockImplementationOnce(() => geminiOk("Thanks for reaching out!"));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.draft).toBe("Thanks for reaching out!");
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

  it("returns 502 when Gemini returns an error", async () => {
    mockFetch.mockImplementationOnce(() => geminiError(500));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(502);
  });

  it("returns 502 when Gemini returns an empty draft", async () => {
    mockFetch.mockImplementationOnce(() => geminiOk("   "));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(502);
  });

  it("trims whitespace from the draft", async () => {
    mockFetch.mockImplementationOnce(() => geminiOk("  Hello world!  "));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    const body = await res.json();
    expect(body.draft).toBe("Hello world!");
  });
});
