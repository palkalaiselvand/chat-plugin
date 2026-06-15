import { BaseComponent } from './BaseComponent.js';
import { StreamingService } from '../services/StreamingService.js';
import { ThemeService } from '../services/ThemeService.js';
import { createMessage, createConversationState } from '../types/message.js';
import { scrollToBottom } from '../utils/dom.js';
import type { AgentChatConfig } from '../types/config.js';
import type { Message, ConversationState } from '../types/message.js';
import type { AgentAction } from '../types/config.js';

// Import side-effects for sub-components
import './agent-chat-header.js';
import './agent-chat-message.js';
import './agent-chat-input.js';
import './agent-action-card.js';

const styles = /* css */ `
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--agent-chat-color-background, #f8fafc);
    font-family: var(--agent-chat-font-family, system-ui, sans-serif);
    overflow: hidden;
  }

  agent-chat-header {
    flex-shrink: 0;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    scroll-behavior: smooth;
  }

  .messages-container:focus {
    outline: none;
  }

  /* Live region for screen readers */
  .sr-live {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--agent-chat-color-text-muted, #94a3b8);
    font-size: 0.88rem;
    text-align: center;
    padding: 1rem;
  }

  .error-banner {
    margin: 0.5rem 1rem;
    padding: 0.6rem 0.9rem;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 0.5rem;
    color: #dc2626;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .actions-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem 0;
    background: var(--agent-chat-color-surface, #fff);
    border-top: 1px solid var(--agent-chat-color-border, #e2e8f0);
    flex-shrink: 0;
  }

  agent-chat-input {
    flex-shrink: 0;
  }
`;

/**
 * `<agent-chat-window>` — the stateful core of the chat UI.
 *
 * Owns the message list, calls the StreamingService, and
 * coordinates between header, messages, actions, and input.
 *
 * Configured programmatically via the `config` property.
 */
export class AgentChatWindow extends BaseComponent {
  private _config: AgentChatConfig | null = null;
  private _state: ConversationState = createConversationState();
  private _streamer = new StreamingService();
  private _messagesContainer: HTMLElement | null = null;
  private _inputEl: HTMLElement | null = null;
  private _headerEl: HTMLElement | null = null;
  private _liveRegion: HTMLElement | null = null;

  get config(): AgentChatConfig | null {
    return this._config;
  }

  set config(value: AgentChatConfig) {
    this._config = value;
    if (this.isConnected) {
      this.shadow.innerHTML = '';
      this._messagesContainer = null;
      this._inputEl = null;
      this._headerEl = null;
      this.render();
    }
  }

  disconnectedCallback(): void {
    this._streamer.abort();
  }

  protected render(): void {
    this.adoptStyles(styles);

    if (this._config?.theme) {
      ThemeService.applyTheme(this.shadow, this._config.theme);
    }

    // Screen-reader live region
    const liveRegion = document.createElement('div');
    liveRegion.className = 'sr-live';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'false');
    this._liveRegion = liveRegion;
    this.shadow.appendChild(liveRegion);

    // Header
    const header = document.createElement('agent-chat-header') as HTMLElement;
    const title = this._config?.labels?.title ?? 'AI Assistant';
    header.setAttribute('title', title);
    if (this._config?.mode !== 'widget') {
      header.setAttribute('hide-close', '');
    }
    if (this._config?.labels?.clearButton) {
      header.setAttribute('clear-label', this._config.labels.clearButton);
    }
    this._headerEl = header;
    this.shadow.appendChild(header);

    // Messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'messages-container';
    messagesContainer.setAttribute('role', 'log');
    messagesContainer.setAttribute('aria-label', 'Conversation');
    messagesContainer.setAttribute('aria-live', 'off'); // managed by sr-live region
    messagesContainer.tabIndex = 0;
    this._messagesContainer = messagesContainer;
    this.shadow.appendChild(messagesContainer);

    // Actions bar (rendered but hidden if no actions)
    if (this._config?.actions?.length) {
      this._renderActionsBar();
    }

    // Input
    const input = document.createElement('agent-chat-input') as HTMLElement;
    input.setAttribute('placeholder', this._config?.labels?.placeholder ?? 'Type a message…');
    if (this._config?.labels?.sendButton) {
      input.setAttribute('send-label', this._config.labels.sendButton);
    }
    this._inputEl = input;
    this.shadow.appendChild(input);

    // Seed initial messages
    if (this._config?.initialMessages?.length && this._state.messages.length === 0) {
      for (const m of this._config.initialMessages) {
        const msg = createMessage(m.role, m.content);
        this._state.messages.push(msg);
      }
    }

    this._renderMessages();
    this._bindEvents();
  }

  private _renderActionsBar(): void {
    const actions = this._config?.actions ?? [];
    if (!actions.length) return;

    const bar = document.createElement('div');
    bar.className = 'actions-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Quick replies');

    for (const action of actions) {
      const chip = document.createElement('agent-action-card') as HTMLElement & {
        action: AgentAction;
      };
      chip.action = action;
      bar.appendChild(chip);
    }

    // Insert before input
    this.shadow.insertBefore(bar, this._inputEl);
  }

  private _renderMessages(): void {
    if (!this._messagesContainer) return;
    this._messagesContainer.innerHTML = '';

    if (!this._state.messages.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = this._config?.labels?.emptyState ?? 'Start a conversation…';
      this._messagesContainer.appendChild(empty);
      return;
    }

    for (const msg of this._state.messages) {
      this._appendMessageElement(msg);
    }

    scrollToBottom(this._messagesContainer);
  }

  private _appendMessageElement(msg: Message): HTMLElement & { message: Message } {
    const el = document.createElement('agent-chat-message') as HTMLElement & {
      message: Message;
      updateContent: () => void;
    };
    el.id = `msg-${msg.id}`;
    el.message = msg;

    // Remove empty-state if present
    const empty = this._messagesContainer?.querySelector('.empty-state');
    empty?.remove();

    this._messagesContainer?.appendChild(el);
    return el;
  }

  private _bindEvents(): void {
    // Message sent by user
    this.shadow.addEventListener('agent-chat:message-sent', (e: Event) => {
      const text = (e as CustomEvent<{ message: string }>).detail.message;
      this._handleUserMessage(text);
    });

    // Clear conversation
    this.shadow.addEventListener('agent-chat:cleared', () => {
      this._clearConversation();
    });

    // Close (widget mode — re-emit so widget can catch it)
    this.shadow.addEventListener('agent-chat:close', (e: Event) => {
      // Re-dispatch from the host element so the widget catches it
      this.dispatchEvent(new CustomEvent('agent-chat:close', { bubbles: true, composed: true }));
      e.stopPropagation();
    });

    // Action clicked — inject message if configured
    this.shadow.addEventListener('agent-chat:action-clicked', (e: Event) => {
      const action = (e as CustomEvent<{ action: AgentAction }>).detail.action;
      if (action.message) {
        this._handleUserMessage(action.message);
      }
    });
  }

  private _handleUserMessage(text: string): void {
    if (!this._config || this._streamer.isStreaming) return;

    // Add user message
    const userMsg = createMessage('user', text);
    this._state.messages.push(userMsg);
    const userEl = this._appendMessageElement(userMsg);
    userEl.message = userMsg;
    if (this._messagesContainer) scrollToBottom(this._messagesContainer);

    // Emit sent event
    this.emit('agent-chat:message-sent', { message: userMsg });

    // Create placeholder assistant message
    const assistantMsg = createMessage('assistant', '');
    assistantMsg.isStreaming = true;
    this._state.messages.push(assistantMsg);
    const assistantEl = this._appendMessageElement(assistantMsg) as HTMLElement & {
      message: Message;
      updateContent: () => void;
    };

    // Set input + header to loading state
    this._setLoading(true);

    this._streamer.stream({
      endpoint: this._config.endpoint,
      headers: this._config.headers,
      messages: this._state.messages.filter((m) => m.id !== assistantMsg.id),
      parseChunk: this._config.parseChunk,
      onToken: (token) => {
        assistantMsg.content += token;
        assistantEl.message = assistantMsg;
        assistantEl.updateContent();
        if (this._messagesContainer) scrollToBottom(this._messagesContainer);
        // Announce to screen readers
        if (this._liveRegion) this._liveRegion.textContent = assistantMsg.content.slice(-200);
      },
      onDone: () => {
        assistantMsg.isStreaming = false;
        assistantEl.message = assistantMsg;
        assistantEl.updateContent();
        this._setLoading(false);
        this.emit('agent-chat:message-received', { message: assistantMsg });
      },
      onError: (err) => {
        assistantMsg.isStreaming = false;
        assistantMsg.content =
          this._config?.labels?.errorMessage ?? 'Something went wrong. Please try again.';
        assistantEl.message = assistantMsg;
        assistantEl.updateContent();
        this._setLoading(false);
        this._showError(err.message);
        this.emit('agent-chat:error', { error: err.message });
      },
    });
  }

  private _setLoading(isLoading: boolean): void {
    this._state.isLoading = isLoading;

    // Disable/enable input
    if (this._inputEl) {
      if (isLoading) {
        this._inputEl.setAttribute('disabled', '');
      } else {
        this._inputEl.removeAttribute('disabled');
        (this._inputEl as HTMLElement & { focusInput?: () => void }).focusInput?.();
      }
    }

    // Toggle streaming indicator on header
    if (this._headerEl) {
      if (isLoading) {
        this._headerEl.setAttribute('streaming', '');
      } else {
        this._headerEl.removeAttribute('streaming');
      }
    }
  }

  private _showError(message: string): void {
    // Remove any previous error banner
    this.shadow.querySelector('.error-banner')?.remove();

    const banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.setAttribute('role', 'alert');
    banner.textContent = message;

    // Insert before input
    this.shadow.insertBefore(banner, this._inputEl);

    // Auto-dismiss after 6s
    setTimeout(() => banner.remove(), 6000);
  }

  private _clearConversation(): void {
    this._streamer.abort();
    this._state = createConversationState();
    this._renderMessages();
    this._setLoading(false);
    this.emit('agent-chat:cleared', {});
  }
}

customElements.define('agent-chat-window', AgentChatWindow);
