import { BaseComponent } from './BaseComponent.js';
import { ThemeService } from '../services/ThemeService.js';
import type { AgentChatConfig, ChatMode } from '../types/config.js';
import type { AgentChatWindow } from './agent-chat-window.js';
import './agent-chat-window.js';

const styles = /* css */ `
  :host {
    display: flex;
    flex-direction: column;
    background: var(--agent-chat-color-background, #f8fafc);
    border: 1px solid var(--agent-chat-color-border, #e2e8f0);
    border-radius: var(--agent-chat-border-radius, 1rem);
    overflow: hidden;
    font-family: var(--agent-chat-font-family, system-ui, sans-serif);
  }

  /* Full-page mode: fill the viewport */
  :host([mode="fullpage"]) {
    position: fixed;
    inset: 0;
    border-radius: 0;
    border: none;
    z-index: var(--agent-chat-z-index, 9998);
  }

  /* Panel mode: use host element sizing (consumer controls width/height) */
  :host([mode="panel"]) {
    width: 100%;
    height: 100%;
  }

  agent-chat-window {
    flex: 1;
    min-height: 0;
  }
`;

/**
 * `<agent-chat-panel>` — embeds the chat UI inline or as a full-page overlay.
 *
 * Attributes:
 * - `mode` — 'panel' (default) or 'fullpage'
 *
 * Configured via the `config` property (AgentChatConfig).
 */
export class AgentChatPanel extends BaseComponent {
  static observedAttributes = ['mode'];

  private _config: AgentChatConfig | null = null;
  private _chatWindow: AgentChatWindow | null = null;

  get config(): AgentChatConfig | null {
    return this._config;
  }

  set config(value: AgentChatConfig) {
    const mode: ChatMode = (this.getAttribute('mode') as ChatMode) ?? value.mode ?? 'panel';
    this._config = { ...value, mode };
    if (this.isConnected) {
      if (this._chatWindow) {
        this._chatWindow.config = this._config;
      }
      if (this._config.theme) {
        ThemeService.applyTheme(this.shadow, this._config.theme);
      }
    }
  }

  attributeChangedCallback(name: string, _old: string | null, next: string | null): void {
    if (name === 'mode' && this._config) {
      this._config = { ...this._config, mode: (next as ChatMode) ?? 'panel' };
      if (this._chatWindow) this._chatWindow.config = this._config;
    }
  }

  protected render(): void {
    this.adoptStyles(styles);

    if (this._config?.theme) {
      ThemeService.applyTheme(this.shadow, this._config.theme);
    }

    const chatWindow = document.createElement('agent-chat-window') as AgentChatWindow;
    if (this._config) chatWindow.config = this._config;
    this._chatWindow = chatWindow;
    this.shadow.appendChild(chatWindow);
  }
}

customElements.define('agent-chat-panel', AgentChatPanel);
