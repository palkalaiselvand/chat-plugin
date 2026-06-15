import { createShadow, adoptStyles } from '../utils/dom.js';
import { dispatchAgentEvent } from '../types/events.js';
import type { AgentChatEventType } from '../types/events.js';

/**
 * Abstract base for all agent-chat custom elements.
 *
 * Provides:
 * - Automatic Shadow DOM creation (`this.shadow`)
 * - `adoptStyles(css)` to inject component CSS
 * - `emit(type, detail)` for typed CustomEvent dispatch
 * - `$(selector)` shorthand for shadow querySelector
 * - `render()` lifecycle hook (called in `connectedCallback`)
 */
export abstract class BaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = createShadow(this);
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    // Override in subclasses to remove event listeners / timers
  }

  /** Replace shadow styles with new CSS */
  protected adoptStyles(css: string, id?: string): void {
    adoptStyles(this.shadow, css, id);
  }

  /** Dispatch a typed agent-chat CustomEvent that bubbles & composes */
  protected emit<T>(type: AgentChatEventType, detail: T): void {
    dispatchAgentEvent(this, type, detail);
  }

  /** Typed shadow querySelector — throws if element not found */
  protected $<T extends Element>(selector: string): T {
    const el = this.shadow.querySelector<T>(selector);
    if (!el) throw new Error(`[agent-ui] Element not found in shadow: ${selector}`);
    return el;
  }

  /** Typed shadow querySelectorAll */
  protected $$<T extends Element>(selector: string): NodeListOf<T> {
    return this.shadow.querySelectorAll<T>(selector);
  }

  /**
   * Subclasses must implement `render()` to build the shadow DOM.
   * Called once in `connectedCallback`; call manually for re-renders.
   */
  protected abstract render(): void;
}
