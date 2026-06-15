import React, { useEffect, useRef } from 'react';
import '@agent-ui/chat-sdk';
import type { AgentChatConfig, AgentChatWidget } from '@agent-ui/chat-sdk';

// Extend JSX intrinsic elements to include the custom elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'agent-chat-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'agent-chat-panel': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { mode?: string },
        HTMLElement
      >;
    }
  }
}

const CHAT_CONFIG: AgentChatConfig = {
  endpoint: 'https://your-backend.example.com/api/chat/stream',
  theme: {
    colorPrimary: '#7c3aed',
    borderRadius: '0.85rem',
  },
  labels: {
    title: 'AI Assistant (React)',
    placeholder: 'Ask me anything…',
    emptyState: 'Hi from React! How can I help?',
  },
  initialMessages: [
    { role: 'assistant', content: 'Hello from React! How can I help you today?' },
  ],
  actions: [
    { id: 'start', label: '🚀 Get started', message: 'How do I get started?' },
  ],
};

export default function App() {
  const widgetRef = useRef<AgentChatWidget>(null);

  // Set config on mount (imperative API for custom elements in React)
  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.config = CHAT_CONFIG;
    }
  }, []);

  // Listen for SDK events
  useEffect(() => {
    const handleSent = (e: Event) => {
      console.log('[React] Message sent:', (e as CustomEvent).detail);
    };
    const handleReceived = (e: Event) => {
      console.log('[React] Message received:', (e as CustomEvent).detail);
    };
    const handleError = (e: Event) => {
      console.error('[React] Chat error:', (e as CustomEvent).detail);
    };

    document.addEventListener('agent-chat:message-sent', handleSent);
    document.addEventListener('agent-chat:message-received', handleReceived);
    document.addEventListener('agent-chat:error', handleError);

    return () => {
      document.removeEventListener('agent-chat:message-sent', handleSent);
      document.removeEventListener('agent-chat:message-received', handleReceived);
      document.removeEventListener('agent-chat:error', handleError);
    };
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        Agent Chat SDK — React Example
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        The floating chat widget is in the bottom-right corner.
        The panel below is embedded inline.
      </p>

      {/* Inline panel — config set via ref in useEffect */}
      <div style={{ height: 500, borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <agent-chat-panel
          mode="panel"
          ref={(el: HTMLElement | null) => {
            if (el) {
              // Cast to access the config setter
              const panel = el as HTMLElement & { config: AgentChatConfig };
              panel.config = { ...CHAT_CONFIG, mode: 'panel' };
            }
          }}
          style={{ display: 'block', height: '100%' }}
        />
      </div>

      {/* Floating widget */}
      {/* @ts-expect-error — ref typed via AgentChatWidget */}
      <agent-chat-widget ref={widgetRef} />
    </div>
  );
}
