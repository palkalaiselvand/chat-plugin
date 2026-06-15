import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/agent-chat-input.js';
import type { AgentChatInput } from '../../src/components/agent-chat-input.js';

function getInput(): AgentChatInput {
  const el = document.createElement('agent-chat-input') as AgentChatInput;
  document.body.appendChild(el);
  return el;
}

function getShadowTextarea(el: AgentChatInput): HTMLTextAreaElement {
  return el.shadowRoot!.querySelector('textarea')!;
}

function getShadowButton(el: AgentChatInput): HTMLButtonElement {
  return el.shadowRoot!.querySelector('button[type="submit"]')!;
}

describe('AgentChatInput', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a textarea and a submit button', () => {
    const el = getInput();
    expect(getShadowTextarea(el)).toBeTruthy();
    expect(getShadowButton(el)).toBeTruthy();
  });

  it('dispatches agent-chat:message-sent on Enter key with text', async () => {
    const el = getInput();
    const textarea = getShadowTextarea(el);

    let received: string | null = null;
    el.addEventListener('agent-chat:message-sent', (e) => {
      received = (e as CustomEvent<{ message: string }>).detail.message;
    });

    textarea.value = 'Hello World';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(received).toBe('Hello World');
  });

  it('does NOT dispatch on Shift+Enter', () => {
    const el = getInput();
    const textarea = getShadowTextarea(el);

    let fired = false;
    el.addEventListener('agent-chat:message-sent', () => { fired = true; });

    textarea.value = 'text';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }));

    expect(fired).toBe(false);
  });

  it('does NOT dispatch when textarea is empty', () => {
    const el = getInput();
    const textarea = getShadowTextarea(el);

    let fired = false;
    el.addEventListener('agent-chat:message-sent', () => { fired = true; });

    textarea.value = '   '; // whitespace only
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(fired).toBe(false);
  });

  it('clears textarea after sending', () => {
    const el = getInput();
    const textarea = getShadowTextarea(el);

    textarea.value = 'test message';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(textarea.value).toBe('');
  });

  it('dispatches on form submit', () => {
    const el = getInput();
    const textarea = getShadowTextarea(el);
    const form = el.shadowRoot!.querySelector('form')!;

    let received: string | null = null;
    el.addEventListener('agent-chat:message-sent', (e) => {
      received = (e as CustomEvent<{ message: string }>).detail.message;
    });

    textarea.value = 'Form submit';
    form.dispatchEvent(new Event('submit', { bubbles: true }));

    expect(received).toBe('Form submit');
  });

  it('disables textarea and button when disabled attribute is set', () => {
    const el = getInput();
    el.setAttribute('disabled', '');

    expect(getShadowTextarea(el).disabled).toBe(true);
    expect(getShadowButton(el).disabled).toBe(true);
  });

  it('does NOT dispatch when disabled', () => {
    const el = getInput();
    el.setAttribute('disabled', '');
    const textarea = getShadowTextarea(el);

    let fired = false;
    el.addEventListener('agent-chat:message-sent', () => { fired = true; });

    textarea.value = 'ignored';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(fired).toBe(false);
  });

  it('uses the placeholder attribute', () => {
    const el = document.createElement('agent-chat-input') as AgentChatInput;
    el.setAttribute('placeholder', 'Ask me…');
    document.body.appendChild(el);

    expect(getShadowTextarea(el).placeholder).toBe('Ask me…');
  });
});
