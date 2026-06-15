import type { Message } from './message.js';
import type { AgentAction } from './config.js';

/** Fired when the chat widget/panel opens */
export interface AgentChatOpenEvent extends CustomEvent<Record<string, never>> {
  type: 'agent-chat:open';
}

/** Fired when the chat widget/panel closes */
export interface AgentChatCloseEvent extends CustomEvent<Record<string, never>> {
  type: 'agent-chat:close';
}

/** Fired when the user submits a message */
export interface AgentChatMessageSentEvent extends CustomEvent<{ message: Message }> {
  type: 'agent-chat:message-sent';
}

/** Fired when the assistant response is fully received */
export interface AgentChatMessageReceivedEvent extends CustomEvent<{ message: Message }> {
  type: 'agent-chat:message-received';
}

/** Fired when a streaming or network error occurs */
export interface AgentChatErrorEvent extends CustomEvent<{ error: string }> {
  type: 'agent-chat:error';
}

/** Fired when the user clicks a quick-reply action chip */
export interface AgentChatActionClickedEvent extends CustomEvent<{ action: AgentAction }> {
  type: 'agent-chat:action-clicked';
}

/** Fired when the conversation is cleared */
export interface AgentChatClearedEvent extends CustomEvent<Record<string, never>> {
  type: 'agent-chat:cleared';
}

/** Union of all SDK event types */
export type AgentChatEvent =
  | AgentChatOpenEvent
  | AgentChatCloseEvent
  | AgentChatMessageSentEvent
  | AgentChatMessageReceivedEvent
  | AgentChatErrorEvent
  | AgentChatActionClickedEvent
  | AgentChatClearedEvent;

/** All event type string literals */
export type AgentChatEventType =
  | 'agent-chat:open'
  | 'agent-chat:close'
  | 'agent-chat:message-sent'
  | 'agent-chat:message-received'
  | 'agent-chat:error'
  | 'agent-chat:action-clicked'
  | 'agent-chat:cleared';

/** Helper: create a typed CustomEvent and dispatch it from a target element */
export function dispatchAgentEvent<T>(
  target: EventTarget,
  type: AgentChatEventType,
  detail: T,
): void {
  target.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true, // crosses Shadow DOM boundaries
    }),
  );
}
