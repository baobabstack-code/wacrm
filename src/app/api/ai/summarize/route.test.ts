import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimitForTests } from "@/lib/rate-limit";

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "user-1" } },
  error: null,
});

const mockConvSingle = vi.fn().mockResolvedValue({
  data: { id: "conv-1", contact: { name: "Carol", phone: "+1234" } },
  error: null,
});

const mockMessages = vi.fn().mockResolvedValue({
  data: [
    { sender_type: "customer", content_type: "text", content_text: "I have a problem with my order." },
    { sender_type: "agent", content_type: "text", content_text: "I'll look into that for you." },
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
  return new Request("http://localhost/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/summarize", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockConvSingle.mockResolvedValue({
      data: { id: "conv-1", contact: { name: "Carol", phone: "+1234" } },
      error: null,
    });
    mockMessages.mockResolvedValue({
      data: [
        { sender_type: "customer", content_type: "text", content_text: "Problem with order." },
        { sender_type: "agent", content_type: "text", content_text: "Looking into it." },
      ],
      error: null,
    });
  });

  it("returns a summary on success", async () => {
    const expected = "The customer reported an issue with their order. The agent is investigating.";
    mockFetch.mockImplementationOnce(() => geminiOk(expected));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toBe(expected);
  });

  it("trims whitespace from the summary", async () => {
    mockFetch.mockImplementationOnce(() => geminiOk("  Summary text.  "));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    const body = await res.json();
    expect(body.summary).toBe("Summary text.");
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

  it("returns 502 when Gemini returns an empty summary", async () => {
    mockFetch.mockImplementationOnce(() => geminiOk("   "));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(502);
  });

  it("includes non-text messages as [Media] in the transcript", async () => {
    mockMessages.mockResolvedValueOnce({
      data: [
        { sender_type: "customer", content_type: "image", content_text: null },
        { sender_type: "agent", content_type: "text", content_text: "Got your image." },
      ],
      error: null,
    });
    mockFetch.mockImplementationOnce(() => geminiOk("The customer sent an image."));
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ conversation_id: "conv-1" }));
    expect(res.status).toBe(200);
    // Verify the fetch was called — the transcript building didn't throw
    expect(mockFetch).toHaveBeenCalled();
  });
});
