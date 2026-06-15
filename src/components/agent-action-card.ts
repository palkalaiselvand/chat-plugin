import { BaseComponent } from './BaseComponent.js';
import type { AgentAction } from '../types/config.js';

const styles = /* css */ `
  :host {
    display: inline-block;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.85rem;
    border: 1.5px solid var(--agent-chat-color-primary, #2563eb);
    border-radius: 9999px;
    background: transparent;
    color: var(--agent-chat-color-primary, #2563eb);
    font-family: var(--agent-chat-font-family, system-ui, sans-serif);
    font-size: 0.82rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }

  button:hover {
    background: var(--agent-chat-color-primary, #2563eb);
    color: #fff;
  }

  button:focus-visible {
    outline: 2px solid var(--agent-chat-color-primary, #2563eb);
    outline-offset: 2px;
  }

  .icon {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }
`;

/**
 * `<agent-action-card>` — quick-reply suggestion chip.
 *
 * Properties (set programmatically):
 * - `action` : AgentAction — the action data object
 */
export class AgentActionCard extends BaseComponent {
  private _action: AgentAction | null = null;

  get action(): AgentAction | null {
    return this._action;
  }

  set action(value: AgentAction) {
    this._action = value;
    if (this.isConnected) {
      this.shadow.innerHTML = '';
      this.render();
    }
  }

  protected render(): void {
    this.adoptStyles(styles);
    if (!this._action) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', this._action.label);

    if (this._action.icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'icon';
      iconEl.setAttribute('aria-hidden', 'true');
      // Supports inline SVG or image URL
      if (this._action.icon.trimStart().startsWith('<')) {
        iconEl.innerHTML = this._action.icon;
      } else {
        const img = document.createElement('img');
        img.src = this._action.icon;
        img.alt = '';
        iconEl.appendChild(img);
      }
      btn.appendChild(iconEl);
    }

    btn.appendChild(document.createTextNode(this._action.label));

    btn.addEventListener('click', () => {
      if (!this._action) return;
      if (typeof this._action.callback === 'function') {
        this._action.callback(this._action);
      }
      this.emit('agent-chat:action-clicked', { action: this._action });
    });

    this.shadow.appendChild(btn);
  }
}

customElements.define('agent-action-card', AgentActionCard);
