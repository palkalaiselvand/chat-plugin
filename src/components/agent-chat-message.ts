import { BaseComponent } from './BaseComponent.js';
import { MarkdownService } from '../services/MarkdownService.js';
import type { Message } from '../types/message.js';

const styles = /* css */ `
  :host {
    display: block;
    margin: 0.5rem 0;
  }

  .message {
    display: flex;
    flex-direction: column;
    max-width: 80%;
    padding: 0.65rem 0.9rem;
    border-radius: var(--agent-chat-border-radius, 1rem);
    font-family: var(--agent-chat-font-family, system-ui, sans-serif);
    font-size: var(--agent-chat-font-size, 0.9rem);
    line-height: 1.55;
    word-break: break-word;
  }

  .message.user {
    align-self: flex-end;
    background: var(--agent-chat-color-user-bubble, #2563eb);
    color: var(--agent-chat-color-user-bubble-text, #fff);
    border-bottom-right-radius: 0.2rem;
  }

  .message.assistant {
    align-self: flex-start;
    background: var(--agent-chat-color-assistant-bubble, #f1f5f9);
    color: var(--agent-chat-color-assistant-bubble-text, #1e293b);
    border-bottom-left-radius: 0.2rem;
  }

  .message.system {
    align-self: center;
    background: transparent;
    color: var(--agent-chat-color-text-muted, #64748b);
    font-size: 0.8rem;
    font-style: italic;
    max-width: 100%;
    text-align: center;
    padding: 0.25rem 0;
  }

  .message .content {
    display: block;
  }

  /* Markdown element resets inside bubbles */
  .message p { margin: 0 0 0.4rem; }
  .message p:last-child { margin-bottom: 0; }
  .message pre {
    background: rgba(0,0,0,0.08);
    border-radius: 0.4rem;
    padding: 0.5rem;
    overflow-x: auto;
    font-size: 0.82em;
    margin: 0.4rem 0;
  }
  .message code {
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.85em;
  }
  .message a {
    color: inherit;
    text-decoration: underline;
  }
  .message ul, .message ol {
    margin: 0.25rem 0;
    padding-left: 1.4rem;
  }

  /* Streaming cursor */
  .cursor {
    display: inline-block;
    width: 0.5em;
    height: 1em;
    background: currentColor;
    opacity: 0.7;
    margin-left: 1px;
    vertical-align: text-bottom;
    animation: blink 0.8s step-start infinite;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }

  .meta {
    font-size: 0.7rem;
    opacity: 0.55;
    margin-top: 0.3rem;
  }
`;

/**
 * `<agent-chat-message>` — renders a single conversation message.
 *
 * Properties (set programmatically):
 * - `message` : Message — the message data object
 */
export class AgentChatMessage extends BaseComponent {
  private _message: Message | null = null;

  get message(): Message | null {
    return this._message;
  }

  set message(value: Message) {
    this._message = value;
    if (this.isConnected) this.updateContent();
  }

  protected render(): void {
    this.adoptStyles(styles);

    if (!this._message) {
      this.shadow.innerHTML += '';
      return;
    }

    const { role, content, timestamp, isStreaming } = this._message;
    const formattedTime = new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const renderedContent =
      role === 'user'
        ? MarkdownService.renderPlain(content)
        : role === 'assistant'
          ? MarkdownService.render(content)
          : MarkdownService.renderPlain(content);

    const cursorHtml = isStreaming ? '<span class="cursor" aria-hidden="true"></span>' : '';

    const wrapper = document.createElement('div');
    wrapper.className = `message ${role}`;
    wrapper.setAttribute('role', role === 'user' ? 'log' : 'status');
    wrapper.setAttribute('aria-label', `${role} message`);
    wrapper.innerHTML = `
      <span class="content">${renderedContent}${cursorHtml}</span>
      <span class="meta" aria-label="sent at ${formattedTime}">${formattedTime}</span>
    `;

    this.shadow.appendChild(wrapper);
  }

  /** Efficiently updates only the content span during streaming */
  updateContent(): void {
    if (!this._message) return;
    const contentEl = this.shadow.querySelector('.content');
    if (!contentEl) {
      // Full re-render if DOM not ready
      this.shadow.innerHTML = '';
      this.render();
      return;
    }

    const { role, content, isStreaming } = this._message;
    const renderedContent =
      role === 'assistant' ? MarkdownService.render(content) : MarkdownService.renderPlain(content);
    const cursorHtml = isStreaming ? '<span class="cursor" aria-hidden="true"></span>' : '';
    contentEl.innerHTML = `${renderedContent}${cursorHtml}`;
  }
}

customElements.define('agent-chat-message', AgentChatMessage);
