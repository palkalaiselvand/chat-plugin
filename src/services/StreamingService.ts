import type { Message } from '../types/message.js';

/**
 * Default OpenAI-compatible SSE chunk parser.
 * Returns the delta content string or null for non-content chunks.
 */
function defaultParseChunk(raw: string): string | null {
  if (raw === '[DONE]') return null;
  try {
    const json = JSON.parse(raw) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

export interface StreamOptions {
  endpoint: string;
  headers?: Record<string, string> | undefined;
  messages: Message[];
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  /** Override the default SSE line parser */
  parseChunk?: ((raw: string) => string | null) | undefined;
}

/**
 * Streaming service that opens a POST request to an SSE endpoint
 * and calls `onToken` for each streamed content fragment.
 *
 * Uses `fetch` + `ReadableStream` so it supports request headers and body
 * (unlike the native `EventSource` API which only supports GET).
 */
export class StreamingService {
  private controller: AbortController | null = null;

  /** Returns true if a stream is currently active */
  get isStreaming(): boolean {
    return this.controller !== null;
  }

  /** Abort any in-flight stream */
  abort(): void {
    this.controller?.abort();
    this.controller = null;
  }

  async stream(options: StreamOptions): Promise<void> {
    // Abort any previous stream
    this.abort();

    const { endpoint, headers, messages, onToken, onDone, onError, parseChunk } = options;
    const parse = parseChunk ?? defaultParseChunk;

    this.controller = new AbortController();
    const { signal } = this.controller;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...headers,
        },
        body: JSON.stringify({ messages }),
        signal,
      });
    } catch (err) {
      this.controller = null;
      if ((err as Error).name === 'AbortError') return;
      onError(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    if (!response.ok) {
      this.controller = null;
      onError(new Error(`HTTP ${response.status}: ${response.statusText}`));
      return;
    }

    if (!response.body) {
      this.controller = null;
      onError(new Error('Response body is null'));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by '\n'; events are separated by '\n\n'
        const lines = buffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const raw = trimmed.slice(5).trim();
            const token = parse(raw);
            if (token !== null) {
              onToken(token);
            }
          }
          // Ignore `event:`, `id:`, `retry:` SSE fields for now
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      this.controller = null;
      onDone();
    }
  }
}
