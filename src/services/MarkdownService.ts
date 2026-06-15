import { marked } from 'marked';
import { sanitize } from '../utils/sanitize.js';

// Configure marked globally once
marked.setOptions({
  gfm: true,     // GitHub-flavoured markdown (tables, strikethrough, etc.)
  breaks: true,  // Treat single newlines as <br>
});

/**
 * Singleton service that converts markdown strings to safe HTML.
 */
class MarkdownServiceClass {
  /**
   * Renders a full markdown string to sanitized HTML.
   * Returns a synchronous string (uses marked's non-async API).
   */
  render(markdown: string): string {
    // marked.parse returns string | Promise<string> depending on options;
    // with no async hooks set it always returns string.
    const html = marked.parse(markdown) as string;
    return sanitize(html);
  }

  /**
   * Renders plain text without markdown processing (used for system messages).
   * Still sanitizes the output.
   */
  renderPlain(text: string): string {
    // Escape then wrap in a paragraph
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<p>${escaped}</p>`;
  }
}

export const MarkdownService = new MarkdownServiceClass();
