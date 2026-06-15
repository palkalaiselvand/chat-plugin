import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamingService } from '../../src/services/StreamingService.js';

// Helper: build a ReadableStream that emits the given chunks then closes
function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
}

// Build SSE-formatted lines for a sequence of content tokens
function sseChunks(tokens: string[]): string[] {
  return tokens.map((t) => `data: {"choices":[{"delta":{"content":"${t}"}}]}\n\n`);
}

describe('StreamingService', () => {
  let service: StreamingService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new StreamingService();
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls onToken for each SSE data chunk', async () => {
    const tokens = ['Hello', ', ', 'world', '!'];
    fetchSpy.mockResolvedValue({
      ok: true,
      body: makeStream(sseChunks(tokens)),
    });

    const received: string[] = [];
    const onDone = vi.fn();
    const onError = vi.fn();

    await service.stream({
      endpoint: '/api/chat',
      messages: [],
      onToken: (t) => received.push(t),
      onDone,
      onError,
    });

    expect(received).toEqual(tokens);
    expect(onDone).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onDone after stream completes', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      body: makeStream(sseChunks(['Hi'])),
    });

    const onDone = vi.fn();
    await service.stream({ endpoint: '/api/chat', messages: [], onToken: vi.fn(), onDone, onError: vi.fn() });

    expect(onDone).toHaveBeenCalledOnce();
  });

  it('calls onError on non-OK HTTP response', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const onError = vi.fn();
    await service.stream({
      endpoint: '/api/chat',
      messages: [],
      onToken: vi.fn(),
      onDone: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalledOnce();
    expect((onError.mock.calls[0][0] as Error).message).toContain('500');
  });

  it('calls onError on network failure', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    const onError = vi.fn();
    await service.stream({
      endpoint: '/api/chat',
      messages: [],
      onToken: vi.fn(),
      onDone: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalledOnce();
    expect((onError.mock.calls[0][0] as Error).message).toContain('Network error');
  });

  it('skips [DONE] sentinel chunks', async () => {
    const encoder = new TextEncoder();
    const raw = 'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: [DONE]\n\n';
    fetchSpy.mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(raw));
          controller.close();
        },
      }),
    });

    const received: string[] = [];
    await service.stream({
      endpoint: '/api/chat',
      messages: [],
      onToken: (t) => received.push(t),
      onDone: vi.fn(),
      onError: vi.fn(),
    });

    expect(received).toEqual(['Hi']); // [DONE] not in received
  });

  it('uses a custom parseChunk when provided', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      body: makeStream(['data: TOKEN_A\n\n', 'data: TOKEN_B\n\n']),
    });

    const received: string[] = [];
    await service.stream({
      endpoint: '/api/chat',
      messages: [],
      onToken: (t) => received.push(t),
      onDone: vi.fn(),
      onError: vi.fn(),
      parseChunk: (raw) => raw, // raw = "TOKEN_A", "TOKEN_B"
    });

    expect(received).toEqual(['TOKEN_A', 'TOKEN_B']);
  });

  it('sets isStreaming to false after completion', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      body: makeStream(sseChunks(['Hi'])),
    });

    const streamPromise = service.stream({
      endpoint: '/api/chat',
      messages: [],
      onToken: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    });

    await streamPromise;
    expect(service.isStreaming).toBe(false);
  });

  it('abort() stops an in-progress stream without calling onError', async () => {
    let resolveRead!: () => void;
    const readPromise = new Promise<void>((r) => { resolveRead = r; });

    fetchSpy.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: () => readPromise.then(() => ({ done: true, value: undefined })),
          cancel: vi.fn(),
        }),
      },
    });

    const onDone = vi.fn();
    const onError = vi.fn();
    const streamPromise = service.stream({
      endpoint: '/api/chat',
      messages: [],
      onToken: vi.fn(),
      onDone,
      onError,
    });

    service.abort();
    resolveRead();
    await streamPromise;

    expect(onError).not.toHaveBeenCalled();
  });
});
