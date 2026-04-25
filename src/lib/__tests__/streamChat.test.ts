import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { streamChat } from "../streamChat";

/**
 * Unit tests for the Server-Sent-Events stream parser used by the AI tutor.
 *
 * These tests cover the edge cases described in §6.1 of the dissertation:
 *   - chunk boundaries in the stream (a JSON object split across two reads),
 *   - the [DONE] sentinel that terminates the stream,
 *   - empty lines between events,
 *   - non-OK HTTP responses surfaced through onError.
 *
 * The upstream fetch() call is mocked so the tests run offline and deterministically.
 */

// Helper: build a fake Response with a given list of string chunks as its body.
function mockResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("streamChat SSE parser", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("emits deltas for well-formed SSE chunks and terminates on [DONE]", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse([
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        "data: [DONE]\n\n",
      ])
    ) as unknown as typeof fetch;

    const received: string[] = [];
    let doneCalled = false;

    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: (d) => received.push(d),
      onDone: () => {
        doneCalled = true;
      },
      onError: () => {
        throw new Error("should not error");
      },
    });

    expect(received.join("")).toBe("Hello world");
    expect(doneCalled).toBe(true);
  });

  it("handles a JSON object split across two network reads (chunk boundary)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse([
        'data: {"choices":[{"delta":{"content":"Split',
        ' test"}}]}\n\ndata: [DONE]\n\n',
      ])
    ) as unknown as typeof fetch;

    const received: string[] = [];
    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: (d) => received.push(d),
      onDone: () => {},
      onError: () => {
        throw new Error("should not error");
      },
    });

    expect(received.join("")).toBe("Split test");
  });

  it("stops emitting deltas once [DONE] sentinel is reached", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse([
        'data: {"choices":[{"delta":{"content":"abc"}}]}\n\n',
        "data: [DONE]\n\n",
        'data: {"choices":[{"delta":{"content":"ignored"}}]}\n\n',
      ])
    ) as unknown as typeof fetch;

    const received: string[] = [];
    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: (d) => received.push(d),
      onDone: () => {},
      onError: () => {
        throw new Error("should not error");
      },
    });

    expect(received.join("")).toBe("abc");
    expect(received.join("")).not.toContain("ignored");
  });

  it("tolerates empty blank lines between SSE events", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse([
        'data: {"choices":[{"delta":{"content":"a"}}]}\n\n\n\n',
        'data: {"choices":[{"delta":{"content":"b"}}]}\n\n',
        "data: [DONE]\n\n",
      ])
    ) as unknown as typeof fetch;

    const received: string[] = [];
    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: (d) => received.push(d),
      onDone: () => {},
      onError: () => {
        throw new Error("should not error");
      },
    });

    expect(received.join("")).toBe("ab");
  });

  it("routes non-OK HTTP responses through onError", async () => {
    // Response that is not streaming; JSON error body
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })
    ) as unknown as typeof fetch;

    let errMsg = "";
    let deltaCalled = false;
    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: () => {
        deltaCalled = true;
      },
      onDone: () => {
        throw new Error("should not reach done");
      },
      onError: (e) => {
        errMsg = e;
      },
    });

    expect(deltaCalled).toBe(false);
    expect(errMsg).toContain("Rate limit");
  });
});
