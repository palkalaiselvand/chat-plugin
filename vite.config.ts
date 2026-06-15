import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import type { Plugin, Connect } from 'vite';
import type { ServerResponse } from 'http';

// ── Mock SSE responses for the dev playground ─────────────────────────────────
const MOCK_RESPONSES: Record<string, string> = {
  default:
    "That's a great question! Here's a thoughtful response from the **mock AI assistant**.\n\n" +
    "In a real integration, this text would stream token-by-token from your backend over SSE.\n\n" +
    "You can point the `endpoint` config option at any OpenAI-compatible streaming API.",

  hello:
    "Hello there! 👋 Great to meet you!\n\nI'm a **simulated AI assistant** running inside the `@agent-ui/chat-sdk` dev playground.\n\nFeel free to try the action chips above or type any message!",

  code:
    "Here's a TypeScript debounce function:\n\n```typescript\nfunction debounce<T extends (...args: unknown[]) => void>(\n  fn: T,\n  delay: number,\n): (...args: Parameters<T>) => void {\n  let timer: ReturnType<typeof setTimeout>;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\n```\n\nUsage:\n```typescript\nconst onResize = debounce(() => console.log('resized'), 200);\nwindow.addEventListener('resize', onResize);\n```",

  webcomponents:
    "**Web Components** are a set of browser-native APIs that let you create reusable custom HTML elements:\n\n" +
    "1. **Custom Elements** — define new HTML tags with `customElements.define()`\n" +
    "2. **Shadow DOM** — encapsulated DOM + scoped CSS that can't leak out\n" +
    "3. **HTML Templates** — `<template>` elements for reusable markup\n\n" +
    "This SDK is built entirely with Web Components, which is why it works in React, Vue, Angular, and plain HTML without any adapters.",

  haiku:
    "*Semicolons fall*\n*like rain on a Saturday—*\n*the bug hides no more* 🌧️",
};

function pickResponse(messages: Array<{ role: string; content: string }>): string {
  const last = messages.at(-1)?.content?.toLowerCase() ?? '';
  if (last.includes('hello') || last.includes('hi')) return MOCK_RESPONSES.hello;
  if (last.includes('debounce') || last.includes('code') || last.includes('typescript'))
    return MOCK_RESPONSES.code;
  if (last.includes('web component')) return MOCK_RESPONSES.webcomponents;
  if (last.includes('haiku') || last.includes('poem')) return MOCK_RESPONSES.haiku;
  return MOCK_RESPONSES.default;
}

/** Vite plugin that injects a mock /api/chat/stream SSE endpoint */
function mockChatPlugin(): Plugin {
  return {
    name: 'mock-chat-sse',
    configureServer(server) {
      server.middlewares.use(
        '/api/chat/stream',
        async (req: Connect.IncomingMessage, res: ServerResponse) => {
          // Collect POST body
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as {
            messages: Array<{ role: string; content: string }>;
          };

          const responseText = pickResponse(body.messages);
          // Split into word-level tokens to simulate streaming
          const tokens = responseText.match(/\S+\s*/g) ?? [responseText];

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            Connection: 'keep-alive',
          });

          let i = 0;
          const interval = setInterval(() => {
            if (i >= tokens.length) {
              res.write('data: [DONE]\n\n');
              clearInterval(interval);
              res.end();
              return;
            }
            const token = tokens[i++];
            const chunk = JSON.stringify({
              choices: [{ delta: { content: token } }],
            });
            res.write(`data: ${chunk}\n\n`);
          }, 35); // ~28 tokens/sec — realistic feel

          req.on('close', () => clearInterval(interval));
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [
    mockChatPlugin(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AgentChatSDK',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      // No external deps — marked and dompurify are bundled
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
