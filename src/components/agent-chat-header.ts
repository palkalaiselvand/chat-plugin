import { BaseComponent } from './BaseComponent.js';

const styles = /* css */ `
  :host {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--agent-chat-color-surface, #fff);
    border-bottom: 1px solid var(--agent-chat-color-border, #e2e8f0);
    user-select: none;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .status-dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    transition: background 0.3s;
  }

  .status-dot.streaming {
    background: var(--agent-chat-color-primary, #2563eb);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.8); }
  }

  .title {
    font-family: var(--agent-chat-font-family, system-ui, sans-serif);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--agent-chat-color-text, #1e293b);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    color: var(--agent-chat-color-text-muted, #64748b);
    border-radius: 0.4rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  button:hover {
    background: var(--agent-chat-color-border, #e2e8f0);
    color: var(--agent-chat-color-text, #1e293b);
  }

  button:focus-visible {
    outline: 2px solid var(--agent-chat-color-primary, #2563eb);
    outline-offset: 1px;
  }
`;

const CLEAR_ICON = /* html */ `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
    <path d="M10 11v6M14 11v6"></path>
  </svg>
`;

const CLOSE_ICON = /* html */ `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
       stroke-linejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
`;

/**
 * `<agent-chat-header>` — title bar with status indicator, clear, and close buttons.
 *
 * Attributes:
 * - `title`         — chat window title
 * - `streaming`     — present while assistant is streaming (animates dot)
 * - `hide-close`    — omits the close button (for panel / full-page modes)
 * - `clear-label`   — accessible label for the clear button
 * - `close-label`   — accessible label for the close button
 *
 * Events dispatched (bubbles + composed):
 * - `agent-chat:cleared`
 * - `agent-chat:close`
 */
export class AgentChatHeader extends BaseComponent {
  static observedAttributes = ['title', 'streaming', 'hide-close'];

  private _dot: HTMLElement | null = null;

  attributeChangedCallback(name: string, _old: string | null, next: string | null): void {
    if (name === 'streaming' && this._dot) {
      if (next !== null) {
        this._dot.classList.add('streaming');
      } else {
        this._dot.classList.remove('streaming');
      }
    } else if (name === 'title') {
      const titleEl = this.shadow.querySelector('.title');
      if (titleEl) titleEl.textContent = next ?? 'AI Assistant';
    }
  }

  protected render(): void {
    this.adoptStyles(styles);

    const title = this.getAttribute('title') ?? 'AI Assistant';
    const hideClose = this.hasAttribute('hide-close');
    const clearLabel = this.getAttribute('clear-label') ?? 'Clear conversation';
    const closeLabel = this.getAttribute('close-label') ?? 'Close chat';
    const isStreaming = this.hasAttribute('streaming');

    const dot = document.createElement('div');
    dot.className = `status-dot${isStreaming ? ' streaming' : ''}`;
    dot.setAttribute('aria-hidden', 'true');
    this._dot = dot;

    const titleEl = document.createElement('span');
    titleEl.className = 'title';
    titleEl.textContent = title;

    const titleGroup = document.createElement('div');
    titleGroup.className = 'title-group';
    titleGroup.appendChild(dot);
    titleGroup.appendChild(titleEl);

    const actions = document.createElement('div');
    actions.className = 'actions';

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.setAttribute('aria-label', clearLabel);
    clearBtn.innerHTML = CLEAR_ICON;
    clearBtn.addEventListener('click', () => this.emit('agent-chat:cleared', {}));
    actions.appendChild(clearBtn);

    // Close button (optional)
    if (!hideClose) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', closeLabel);
      closeBtn.innerHTML = CLOSE_ICON;
      closeBtn.addEventListener('click', () => this.emit('agent-chat:close', {}));
      actions.appendChild(closeBtn);
    }

    this.shadow.appendChild(titleGroup);
    this.shadow.appendChild(actions);
  }
}

customElements.define('agent-chat-header', AgentChatHeader);
