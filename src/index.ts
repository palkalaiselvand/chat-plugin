/**
 * @agent-ui/chat-sdk
 *
 * Framework-independent AI agent chat UI SDK.
 * Import this module to auto-register all custom elements:
 *
 *   import '@agent-ui/chat-sdk';
 *
 * Then use the elements in HTML or any framework:
 *
 *   <agent-chat-widget></agent-chat-widget>
 *   <agent-chat-panel></agent-chat-panel>
 *
 * Configure programmatically:
 *
 *   import { defineAgentChat } from '@agent-ui/chat-sdk';
 *   defineAgentChat({ endpoint: '/api/chat', mode: 'widget' });
 */

// ─── Custom Element registrations (side-effect imports) ──────────────────────
import './components/agent-chat-message.js';
import './components/agent-action-card.js';
import './components/agent-chat-input.js';
import './components/agent-chat-header.js';
import './components/agent-chat-window.js';
import './components/agent-chat-widget.js';
import './components/agent-chat-panel.js';

// ─── Public type exports ──────────────────────────────────────────────────────
export type { ChatMode, AgentChatTheme, AgentAction, AgentChatConfig } from './types/config.js';
export type { Role, Message, ConversationState } from './types/message.js';
export { createConversationState, createMessage } from './types/message.js';
export type {
  AgentChatOpenEvent,
  AgentChatCloseEvent,
  AgentChatMessageSentEvent,
  AgentChatMessageReceivedEvent,
  AgentChatErrorEvent,
  AgentChatActionClickedEvent,
  AgentChatClearedEvent,
  AgentChatEvent,
  AgentChatEventType,
} from './types/events.js';
export { dispatchAgentEvent } from './types/events.js';

// ─── Component class exports (for typed access via querySelector) ─────────────
export { AgentChatWidget } from './components/agent-chat-widget.js';
export { AgentChatPanel } from './components/agent-chat-panel.js';
export { AgentChatWindow } from './components/agent-chat-window.js';
export { AgentChatMessage } from './components/agent-chat-message.js';
export { AgentChatInput } from './components/agent-chat-input.js';
export { AgentChatHeader } from './components/agent-chat-header.js';
export { AgentActionCard } from './components/agent-action-card.js';

// ─── Service exports ──────────────────────────────────────────────────────────
export { MarkdownService } from './services/MarkdownService.js';
export { StreamingService } from './services/StreamingService.js';
export { ThemeService } from './services/ThemeService.js';

// ─── Programmatic initialisation helper ───────────────────────────────────────
import type { AgentChatConfig } from './types/config.js';
import type { AgentChatWidget as WidgetType } from './components/agent-chat-widget.js';
import type { AgentChatPanel as PanelType } from './components/agent-chat-panel.js';

/**
 * Programmatically initialises all `<agent-chat-widget>` and `<agent-chat-panel>`
 * elements in the document with the given config.
 *
 * @example
 * defineAgentChat({
 *   endpoint: 'https://api.example.com/chat/stream',
 *   headers: { Authorization: 'Bearer sk-...' },
 *   mode: 'widget',
 *   theme: { colorPrimary: '#7c3aed' },
 *   labels: { title: 'Support Chat' },
 * });
 */
export function defineAgentChat(config: AgentChatConfig): void {
  const apply = () => {
    for (const el of document.querySelectorAll<WidgetType>('agent-chat-widget')) {
      el.config = config;
    }
    for (const el of document.querySelectorAll<PanelType>('agent-chat-panel')) {
      el.config = config;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
}
