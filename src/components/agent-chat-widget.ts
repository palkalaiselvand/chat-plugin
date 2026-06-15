import { BaseComponent } from './BaseComponent.js';
import { ThemeService } from '../services/ThemeService.js';
import type { AgentChatConfig } from '../types/config.js';
import type { AgentChatWindow } from './agent-chat-window.js';
import './agent-chat-window.js';

const styles = /* css */ `
  :host {
    display: block;
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: var(--agent-chat-z-index, 9999);
    font-family: var(--agent-chat-font-family, system-ui, sans-serif);
  }

  /* FAB trigger button */
  .fab {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    border: none;
    background: var(--agent-chat-color-primary, #2563eb);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
  }

  .fab:hover {
    transform: scale(1.07);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  .fab:focus-visible {
    outline: 3px solid var(--agent-chat-color-primary, #2563eb);
    outline-offset: 3px;
  }

  /* Popup window */
  .popup {
    position: absolute;
    bottom: calc(100% + 0.75rem);
    right: 0;
    width: 380px;
    height: 560px;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 6rem);
    border-radius: var(--agent-chat-border-radius, 1rem);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    background: var(--agent-chat-color-background, #f8fafc);
    display: flex;
    flex-direction: column;
    transform-origin: bottom right;
    animation: pop-in 0.2s ease;
  }

  .popup[hidden] {
    display: none;
  }

  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.9) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  agent-chat-window {
    flex: 1;
    min-height: 0;
  }
`;

const CHAT_ICON = /* html */ `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
`;

const CLOSE_ICON = /* html */ `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
       stroke-linejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
`;

/**
 * `<agent-chat-widget>` — floating action button (FAB) that toggles a chat popup.
 *
 * Configured via the `config` property (AgentChatConfig).
 *
 * Events forwarded (bubbles + composed):
 * - `agent-chat:open`
 * - `agent-chat:close`
 * - (all child events also bubble through)
 */
export class AgentChatWidget extends BaseComponent {
  private _config: AgentChatConfig | null = null;
  private _isOpen = false;
  private _fab: HTMLButtonElement | null = null;
  private _popup: HTMLElement | null = null;
  private _chatWindow: AgentChatWindow | null = null;

  get config(): AgentChatConfig | null {
    return this._config;
  }

  set config(value: AgentChatConfig) {
    this._config = { ...value, mode: 'widget' };
    if (this.isConnected) {
      if (this._chatWindow) {
        this._chatWindow.config = this._config;
      }
      if (this._config?.theme) {
        ThemeService.applyTheme(this.shadow, this._config.theme);
      }
    }
  }

  protected render(): void {
    this.adoptStyles(styles);

    if (this._config?.theme) {
      ThemeService.applyTheme(this.shadow, this._config.theme);
    }

    const openLabel = this._config?.labels?.openButton ?? 'Open chat';

    // FAB button
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'fab';
    fab.setAttribute('aria-label', openLabel);
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.innerHTML = CHAT_ICON;
    this._fab = fab;
    this.shadow.appendChild(fab);

    // Popup
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.hidden = true;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', this._config?.labels?.title ?? 'AI Assistant');
    popup.setAttribute('aria-modal', 'true');
    this._popup = popup;

    // Chat window inside popup
    const chatWindow = document.createElement('agent-chat-window') as AgentChatWindow;
    if (this._config) chatWindow.config = this._config;
    this._chatWindow = chatWindow;
    popup.appendChild(chatWindow);

    this.shadow.appendChild(popup);

    // FAB click
    fab.addEventListener('click', () => this._toggle());

    // Listen for close events from within the window
    popup.addEventListener('agent-chat:close', () => this._close());

    // Close on Escape
    document.addEventListener('keydown', this._handleKeydown);

    // Close on outside click
    document.addEventListener('click', this._handleOutsideClick);
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this._handleKeydown);
    document.removeEventListener('click', this._handleOutsideClick);
  }

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._isOpen) this._close();
  };

  private _handleOutsideClick = (e: MouseEvent): void => {
    if (this._isOpen && !this.contains(e.target as Node)) this._close();
  };

  private _toggle(): void {
    this._isOpen ? this._close() : this._open();
  }

  private _open(): void {
    if (!this._popup || !this._fab) return;
    this._isOpen = true;
    this._popup.hidden = false;
    this._fab.setAttribute('aria-expanded', 'true');
    this._fab.setAttribute('aria-label', this._config?.labels?.closeButton ?? 'Close chat');
    this._fab.innerHTML = CLOSE_ICON;
    this.emit('agent-chat:open', {});
  }

  private _close(): void {
    if (!this._popup || !this._fab) return;
    this._isOpen = false;
    this._popup.hidden = true;
    this._fab.setAttribute('aria-expanded', 'false');
    this._fab.setAttribute('aria-label', this._config?.labels?.openButton ?? 'Open chat');
    this._fab.innerHTML = CHAT_ICON;
    this.emit('agent-chat:close', {});
  }

  /** Programmatically open the widget */
  open(): void {
    this._open();
  }

  /** Programmatically close the widget */
  close(): void {
    this._close();
  }
}

customElements.define('agent-chat-widget', AgentChatWidget);
