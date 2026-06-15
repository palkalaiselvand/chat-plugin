import { BaseComponent } from './BaseComponent.js';

const styles = /* css */ `
  :host {
    display: block;
  }

  form {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    padding: 0.65rem;
    background: var(--agent-chat-color-surface, #fff);
    border-top: 1px solid var(--agent-chat-color-border, #e2e8f0);
  }

  textarea {
    flex: 1;
    min-height: 2.4rem;
    max-height: 9rem;
    padding: 0.55rem 0.75rem;
    border: 1.5px solid var(--agent-chat-color-border, #cbd5e1);
    border-radius: var(--agent-chat-border-radius, 0.75rem);
    background: var(--agent-chat-color-background, #f8fafc);
    color: var(--agent-chat-color-text, #1e293b);
    font-family: var(--agent-chat-font-family, system-ui, sans-serif);
    font-size: var(--agent-chat-font-size, 0.9rem);
    line-height: 1.5;
    resize: none;
    outline: none;
    transition: border-color 0.15s;
    overflow-y: auto;
    box-sizing: border-box;
  }

  textarea::placeholder {
    color: var(--agent-chat-color-text-muted, #94a3b8);
  }

  textarea:focus {
    border-color: var(--agent-chat-color-primary, #2563eb);
  }

  button[type="submit"] {
    flex-shrink: 0;
    width: 2.4rem;
    height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--agent-chat-border-radius, 0.75rem);
    background: var(--agent-chat-color-primary, #2563eb);
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }

  button[type="submit"]:hover:not(:disabled) {
    opacity: 0.88;
  }

  button[type="submit"]:active:not(:disabled) {
    transform: scale(0.93);
  }

  button[type="submit"]:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  button[type="submit"]:focus-visible {
    outline: 2px solid var(--agent-chat-color-primary, #2563eb);
    outline-offset: 2px;
  }
`;

const SEND_ICON = /* html */ `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2.5"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
`;

/**
 * `<agent-chat-input>` — auto-growing textarea with send button.
 *
 * Attributes:
 * - `placeholder` — textarea placeholder text
 * - `disabled`    — disables input and button (during streaming)
 * - `send-label`  — accessible label for the send button
 *
 * Events dispatched (bubbles + composed):
 * - `agent-chat:message-sent` → detail: { message: string }
 */
export class AgentChatInput extends BaseComponent {
  static observedAttributes = ['placeholder', 'disabled', 'send-label'];

  private _textarea: HTMLTextAreaElement | null = null;
  private _submitBtn: HTMLButtonElement | null = null;

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  attributeChangedCallback(name: string, _old: string | null, next: string | null): void {
    if (!this._textarea || !this._submitBtn) return;
    if (name === 'placeholder') {
      this._textarea.placeholder = next ?? '';
    } else if (name === 'disabled') {
      const isDisabled = next !== null;
      this._textarea.disabled = isDisabled;
      this._submitBtn.disabled = isDisabled;
    } else if (name === 'send-label') {
      this._submitBtn.setAttribute('aria-label', next ?? 'Send');
    }
  }

  protected render(): void {
    this.adoptStyles(styles);

    const placeholder = this.getAttribute('placeholder') ?? 'Type a message…';
    const sendLabel = this.getAttribute('send-label') ?? 'Send message';
    const isDisabled = this.hasAttribute('disabled');

    const form = document.createElement('form');
    form.setAttribute('aria-label', 'Chat input');
    form.noValidate = true;

    const textarea = document.createElement('textarea');
    textarea.placeholder = placeholder;
    textarea.disabled = isDisabled;
    textarea.rows = 1;
    textarea.setAttribute('aria-label', 'Message');
    textarea.setAttribute('aria-multiline', 'true');
    this._textarea = textarea;

    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.disabled = isDisabled;
    btn.setAttribute('aria-label', sendLabel);
    btn.innerHTML = SEND_ICON;
    this._submitBtn = btn;

    form.appendChild(textarea);
    form.appendChild(btn);
    this.shadow.appendChild(form);

    // Auto-grow textarea
    textarea.addEventListener('input', () => this._autoGrow());

    // Enter submits; Shift+Enter inserts newline
    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._submit();
      }
    });

    form.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      this._submit();
    });
  }

  private _autoGrow(): void {
    if (!this._textarea) return;
    this._textarea.style.height = 'auto';
    this._textarea.style.height = `${this._textarea.scrollHeight}px`;
  }

  private _submit(): void {
    if (!this._textarea || this.disabled) return;
    const text = this._textarea.value.trim();
    if (!text) return;

    this.emit('agent-chat:message-sent', { message: text });

    this._textarea.value = '';
    this._textarea.style.height = 'auto';
  }

  /** Programmatically focus the input */
  focusInput(): void {
    this._textarea?.focus();
  }
}

customElements.define('agent-chat-input', AgentChatInput);
