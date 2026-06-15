/**
 * Attaches an open Shadow DOM to `host` and returns it.
 * @param host - The custom element receiving the shadow root
 * @param mode - 'open' (default) exposes shadowRoot on the element
 */
export function createShadow(host: HTMLElement, mode: ShadowRootMode = 'open'): ShadowRoot {
  return host.attachShadow({ mode });
}

/**
 * Injects a `<style>` element with `css` into `shadow`.
 * If a style with the same `id` already exists it is replaced (hot-reload safe).
 */
export function adoptStyles(shadow: ShadowRoot, css: string, id = 'component-styles'): void {
  let style = shadow.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    shadow.prepend(style);
  }
  style.textContent = css;
}

/**
 * Returns the first element matching `selector` within `root`.
 * Throws if not found — use only for elements known to be present after render.
 */
export function query<T extends Element>(root: ShadowRoot | Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

/**
 * Scrolls `el` to the bottom (newest messages visible).
 */
export function scrollToBottom(el: Element): void {
  el.scrollTop = el.scrollHeight;
}

/**
 * Sets multiple attributes on an element from a plain object.
 */
export function setAttrs(el: Element, attrs: Record<string, string>): void {
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
}
