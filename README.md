# @agent-ui/chat-sdk

A framework-independent, configurable chat interface for integrating AI agents and assistants into web applications. Built with **Web Components** and **TypeScript** — works in React, Angular, Vue, Blazor, ASP.NET, and plain HTML with zero framework adapters.

## Features

- **SSE streaming** — real-time token-by-token responses via `fetch` POST (supports request headers/body unlike `EventSource`)
- **Markdown rendering** — full GFM support via `marked` + XSS-safe output via `DOMPurify`
- **Three UI modes** — floating bubble widget, inline panel, full-page overlay
- **Theming** — 14 CSS custom properties (`--agent-chat-*`) applied through Shadow DOM; swap themes at runtime
- **Agent actions** — configurable quick-reply chips with custom callbacks
- **Accessible** — ARIA live regions, keyboard navigation, `aria-expanded`, screen-reader announcements
- **Tiny footprint** — ~34 kB gzipped (ESM), only two runtime dependencies (`marked`, `dompurify`)

## Installation

```bash
npm install @agent-ui/chat-sdk
```

Or load directly from a CDN:

```html
<script src="https://unpkg.com/@agent-ui/chat-sdk/dist/index.umd.js"></script>
```

## Quick Start

### Plain HTML (UMD)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script src="https://unpkg.com/@agent-ui/chat-sdk/dist/index.umd.js"></script>
</head>
<body>
  <agent-chat-widget id="chat"></agent-chat-widget>

  <script>
    document.getElementById('chat').config = {
      endpoint: 'https://your-backend.example.com/api/chat/stream',
      labels: { title: 'AI Assistant' },
      theme: { colorPrimary: '#2563eb' },
    };
  </script>
</body>
</html>
```

### ESM / bundler

```ts
import '@agent-ui/chat-sdk';
import type { AgentChatConfig } from '@agent-ui/chat-sdk';

const config: AgentChatConfig = {
  endpoint: 'https://your-backend.example.com/api/chat/stream',
  headers: { Authorization: 'Bearer sk-...' },
  mode: 'widget',
  theme: { colorPrimary: '#7c3aed' },
  labels: { title: 'Support Chat' },
  initialMessages: [
    { role: 'assistant', content: 'Hi! How can I help you today?' },
  ],
  actions: [
    { id: 'start', label: '🚀 Get started', message: 'How do I get started?' },
  ],
};

document.querySelector('agent-chat-widget').config = config;
```

### Programmatic initialisation (all elements at once)

```ts
import { defineAgentChat } from '@agent-ui/chat-sdk';

defineAgentChat({
  endpoint: '/api/chat/stream',
  mode: 'widget',
});
```

## Custom Elements

| Element | Description |
|---|---|
| `<agent-chat-widget>` | Floating action button (FAB) that toggles a popup chat window |
| `<agent-chat-panel>` | Inline panel or full-page overlay (set `mode="panel"` or `mode="fullpage"`) |
| `<agent-chat-window>` | Core stateful orchestrator — shared by widget and panel |
| `<agent-chat-header>` | Title bar with status dot, clear, and close buttons |
| `<agent-chat-message>` | Individual message bubble (user / assistant / system) |
| `<agent-chat-input>` | Auto-growing textarea with send button |
| `<agent-action-card>` | Quick-reply suggestion chip |

## Configuration (`AgentChatConfig`)

| Property | Type | Description |
|---|---|---|
| `endpoint` | `string` | **Required.** SSE streaming URL. SDK sends `POST { messages }`. |
| `headers` | `Record<string, string>` | Extra HTTP headers (e.g. `Authorization`) |
| `mode` | `'widget' \| 'panel' \| 'fullpage'` | UI display mode. Default: `'widget'` |
| `theme` | `AgentChatTheme` | CSS custom property overrides (see Theming) |
| `labels` | `object` | Localisation overrides for all text |
| `initialMessages` | `Array<{role, content}>` | Messages shown before user types |
| `actions` | `AgentAction[]` | Quick-reply chips above the input |
| `parseChunk` | `(raw: string) => string \| null` | Custom SSE line parser (default: OpenAI-compatible) |

## Theming

All colours, sizes, and fonts are controlled via CSS custom properties on `:host`. Pass any subset through `AgentChatConfig.theme`:

```ts
theme: {
  colorPrimary:           '#7c3aed',   // send button, focus rings, chips
  colorBackground:        '#faf5ff',   // window background
  colorSurface:           '#ffffff',   // input area, header
  colorText:              '#1e1b4b',
  colorTextMuted:         '#7c3aed',
  colorUserBubble:        '#7c3aed',
  colorUserBubbleText:    '#ffffff',
  colorAssistantBubble:   '#ede9fe',
  colorAssistantBubbleText: '#1e1b4b',
  colorBorder:            '#ddd6fe',
  borderRadius:           '1rem',
  fontFamily:             'system-ui, sans-serif',
  fontSize:               '0.9rem',
  zIndex:                 '9999',      // widget only
}
```

You can also override properties directly in CSS:

```css
agent-chat-widget {
  --agent-chat-color-primary: #059669;
  --agent-chat-border-radius: 0.5rem;
}
```

## Events

All events bubble and compose (cross Shadow DOM). Listen on `document` or any ancestor:

```ts
document.addEventListener('agent-chat:message-sent', (e) => {
  console.log(e.detail.message); // Message object
});
```

| Event | Detail |
|---|---|
| `agent-chat:open` | `{}` |
| `agent-chat:close` | `{}` |
| `agent-chat:message-sent` | `{ message: Message }` |
| `agent-chat:message-received` | `{ message: Message }` |
| `agent-chat:error` | `{ error: string }` |
| `agent-chat:action-clicked` | `{ action: AgentAction }` |
| `agent-chat:cleared` | `{}` |

## Framework Integration

### React

```tsx
import '@agent-ui/chat-sdk';
import { useEffect, useRef } from 'react';
import type { AgentChatWidget } from '@agent-ui/chat-sdk';

export function Chat() {
  const ref = useRef<AgentChatWidget>(null);

  useEffect(() => {
    if (ref.current) ref.current.config = { endpoint: '/api/chat/stream' };
  }, []);

  return <agent-chat-widget ref={ref} />;
}
```

### Vue 3

```ts
// vite.config.ts — tell Vue to skip agent-* tags
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('agent-') } } })
```

```vue
<template>
  <agent-chat-panel ref="panel" mode="panel" />
</template>

<script setup lang="ts">
import '@agent-ui/chat-sdk';
import { onMounted, ref } from 'vue';

const panel = ref<HTMLElement & { config: unknown }>();
onMounted(() => { panel.value!.config = { endpoint: '/api/chat/stream' }; });
</script>
```

### Angular

```ts
@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<agent-chat-widget #widget></agent-chat-widget>`,
})
export class ChatComponent implements AfterViewInit {
  @ViewChild('widget') widgetRef!: ElementRef;
  ngAfterViewInit() {
    this.widgetRef.nativeElement.config = { endpoint: '/api/chat/stream' };
  }
}
```

### Blazor / ASP.NET

Add the UMD bundle to `wwwroot/` and call via JS Interop:

```csharp
await JS.InvokeVoidAsync("agentChatInit", new {
    endpoint = "/api/chat/stream",
    theme    = new { colorPrimary = "#7c3aed" }
});
```

See [examples/blazor/](examples/blazor/) for the complete interop bridge.

## Backend SSE Format

The SDK sends a `POST` request with `Content-Type: application/json`:

```json
{ "messages": [{ "id": "…", "role": "user", "content": "Hello", "timestamp": "…" }] }
```

It expects an **OpenAI-compatible SSE stream** by default:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" World"}}]}

data: [DONE]
```

Use `parseChunk` to adapt any other format:

```ts
parseChunk: (raw) => {
  if (raw === '[DONE]') return null;
  const json = JSON.parse(raw);
  return json.token ?? null; // your custom field
}
```

## Development

```bash
# Install dependencies
npm install

# Start dev server with mock SSE backend at http://localhost:5173
npm run dev

# Type-check
npx tsc --noEmit

# Production build → dist/
npm run build

# Run tests (40 tests across 4 suites)
npm test
```

### Project Structure

```
src/
  types/        config.ts · message.ts · events.ts · index.ts
  utils/        dom.ts · sanitize.ts · id.ts
  services/     MarkdownService.ts · StreamingService.ts · ThemeService.ts
  components/   BaseComponent.ts · agent-chat-*.ts · agent-action-card.ts
  index.ts      — element registration + public API

examples/
  html/         Plain HTML, CDN-style UMD integration
  react/        React 18 + Vite
  vue/          Vue 3 + Vite
  angular/      Angular 17 standalone component
  blazor/       Blazor Server/WASM JS interop

tests/
  services/     StreamingService · MarkdownService
  components/   agent-chat-input · agent-chat-message
```

## License

MIT

