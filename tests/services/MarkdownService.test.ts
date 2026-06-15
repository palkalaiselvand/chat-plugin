import { describe, it, expect } from 'vitest';
import { MarkdownService } from '../../src/services/MarkdownService.js';

describe('MarkdownService', () => {
  describe('render()', () => {
    it('converts bold markdown to <strong>', () => {
      const result = MarkdownService.render('**bold**');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('converts italic markdown to <em>', () => {
      const result = MarkdownService.render('_italic_');
      expect(result).toContain('<em>italic</em>');
    });

    it('renders inline code', () => {
      const result = MarkdownService.render('use `console.log()`');
      expect(result).toContain('<code>console.log()</code>');
    });

    it('renders a fenced code block as <pre><code>', () => {
      const md = '```js\nconst x = 1;\n```';
      const result = MarkdownService.render(md);
      expect(result).toContain('<pre>');
      expect(result).toContain('<code');
      expect(result).toContain('const x = 1;');
    });

    it('renders an unordered list', () => {
      const md = '- Item A\n- Item B';
      const result = MarkdownService.render(md);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('Item A');
      expect(result).toContain('Item B');
    });

    it('renders an ordered list', () => {
      const md = '1. First\n2. Second';
      const result = MarkdownService.render(md);
      expect(result).toContain('<ol>');
      expect(result).toContain('First');
    });

    it('strips <script> tags (XSS protection)', () => {
      const md = 'Hello <script>alert("xss")</script> World';
      const result = MarkdownService.render(md);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert(');
    });

    it('strips onerror attributes (XSS protection)', () => {
      const md = '<img src="x" onerror="alert(1)">';
      const result = MarkdownService.render(md);
      expect(result).not.toContain('onerror');
    });

    it('strips javascript: hrefs (XSS protection)', () => {
      const md = '[click me](javascript:alert(1))';
      const result = MarkdownService.render(md);
      expect(result).not.toContain('javascript:');
    });

    it('allows safe anchor links', () => {
      const md = '[OpenAI](https://openai.com)';
      const result = MarkdownService.render(md);
      expect(result).toContain('<a');
      expect(result).toContain('href="https://openai.com"');
    });

    it('returns non-empty string for empty input', () => {
      const result = MarkdownService.render('');
      expect(typeof result).toBe('string');
    });
  });

  describe('renderPlain()', () => {
    it('escapes HTML entities', () => {
      const result = MarkdownService.renderPlain('<b>Hello & World</b>');
      expect(result).toContain('&lt;b&gt;');
      expect(result).toContain('&amp;');
      expect(result).not.toContain('<b>');
    });

    it('wraps content in a <p> tag', () => {
      const result = MarkdownService.renderPlain('Hello');
      expect(result).toMatch(/^<p>.*<\/p>$/);
    });
  });
});
