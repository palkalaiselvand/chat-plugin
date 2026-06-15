import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/agent-chat-message.js';
import type { AgentChatMessage } from '../../src/components/agent-chat-message.js';
import { createMessage } from '../../src/types/message.js';

function createElement(): AgentChatMessage {
  const el = document.createElement('agent-chat-message') as AgentChatMessage;
  document.body.appendChild(el);
  return el;
}

describe('AgentChatMessage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders with the "user" class for a user message', () => {
    const el = createElement();
    el.message = createMessage('user', 'Hello');
    const bubble = el.shadowRoot!.querySelector('.message');
    expect(bubble?.classList.contains('user')).toBe(true);
  });

  it('renders with the "assistant" class for an assistant message', () => {
    const el = createElement();
    el.message = createMessage('assistant', 'Hi there!');
    const bubble = el.shadowRoot!.querySelector('.message');
    expect(bubble?.classList.contains('assistant')).toBe(true);
  });

  it('renders with the "system" class for a system message', () => {
    const el = createElement();
    el.message = createMessage('system', 'Conversation started.');
    const bubble = el.shadowRoot!.querySelector('.message');
    expect(bubble?.classList.contains('system')).toBe(true);
  });

  it('renders markdown for assistant messages', () => {
    const el = createElement();
    el.message = createMessage('assistant', '**bold text**');
    const content = el.shadowRoot!.querySelector('.content');
    expect(content?.innerHTML).toContain('<strong>');
  });

  it('escapes HTML for user messages (no script element injected)', () => {
    const el = createElement();
    el.message = createMessage('user', '<script>alert(1)</script>');
    // Verify no actual <script> element is created in the shadow DOM
    const scriptEl = el.shadowRoot!.querySelector('script');
    expect(scriptEl).toBeNull();
  });

  it('shows a blinking cursor when isStreaming is true', () => {
    const el = createElement();
    const msg = createMessage('assistant', 'Typing');
    msg.isStreaming = true;
    el.message = msg;
    const cursor = el.shadowRoot!.querySelector('.cursor');
    expect(cursor).toBeTruthy();
  });

  it('hides the cursor when isStreaming is false', () => {
    const el = createElement();
    const msg = createMessage('assistant', 'Done');
    msg.isStreaming = false;
    el.message = msg;
    const cursor = el.shadowRoot!.querySelector('.cursor');
    expect(cursor).toBeNull();
  });

  it('renders nothing when message is null', () => {
    const el = createElement();
    // No message set — shadow should be mostly empty
    const bubble = el.shadowRoot!.querySelector('.message');
    expect(bubble).toBeNull();
  });

  it('updateContent() updates content without full re-render', () => {
    const el = createElement();
    const msg = createMessage('assistant', 'Hello');
    msg.isStreaming = true;
    el.message = msg;

    // Simulate streaming token arrival
    msg.content += ' World';
    el.updateContent();

    const content = el.shadowRoot!.querySelector('.content');
    expect(content?.textContent).toContain('Hello World');
  });

  it('displays a formatted timestamp', () => {
    const el = createElement();
    el.message = createMessage('user', 'Hey');
    const meta = el.shadowRoot!.querySelector('.meta');
    expect(meta?.textContent?.trim().length).toBeGreaterThan(0);
  });
});
