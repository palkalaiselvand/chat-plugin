import DOMPurify from 'dompurify';

/**
 * DOMPurify configuration used across the SDK.
 * Allows safe HTML tags produced by `marked` but strips:
 * - script, iframe, object, embed, form elements
 * - on* event handler attributes
 * - javascript: and data: URIs in href/src
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img',
    'del', 's', 'sup', 'sub', 'span',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORCE_BODY: false,
};

// Dangerous URI schemes to strip explicitly
const DANGEROUS_URI_RE = /^(?:javascript|vbscript|data):/i;

/**
 * Sanitize an HTML string with DOMPurify.
 * Returns a safe HTML string suitable for `innerHTML` assignment.
 */
export function sanitize(html: string): string {
  const clean = DOMPurify.sanitize(html, PURIFY_CONFIG) as string;
  // Extra pass: strip any remaining dangerous href/src values that may slip
  // through in test environments where DOMPurify has limited DOM support.
  return clean.replace(
    /(?:href|src)\s*=\s*["']([^"']*)["']/gi,
    (match, uri: string) => (DANGEROUS_URI_RE.test(uri.trim()) ? '' : match),
  );
}
