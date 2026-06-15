/**
 * Returns a URL-safe unique identifier.
 * Uses `crypto.randomUUID()` when available (all modern browsers).
 * Falls back to a hand-rolled hex string for environments that lack it.
 */
export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback — cryptographically weak but sufficient for UI element IDs
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
