<script setup lang="ts">
import { onMounted, ref } from 'vue';
import '@agent-ui/chat-sdk';
import type { AgentChatConfig, AgentChatWidget } from '@agent-ui/chat-sdk';

const widgetRef = ref<AgentChatWidget | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const config: AgentChatConfig = {
  endpoint: 'https://your-backend.example.com/api/chat/stream',
  theme: {
    colorPrimary: '#059669',
    borderRadius: '0.85rem',
  },
  labels: {
    title: 'AI Assistant (Vue)',
    placeholder: 'Type a message…',
    emptyState: 'Hi from Vue! How can I help?',
  },
  initialMessages: [
    { role: 'assistant', content: 'Hello from Vue 3! How can I help you today?' },
  ],
  actions: [
    { id: 'help', label: '💬 Ask anything', message: 'What can you help me with?' },
  ],
};

onMounted(() => {
  // Set config via imperative property (custom elements don't accept complex objects as attributes)
  if (widgetRef.value) {
    widgetRef.value.config = config;
  }
  if (panelRef.value) {
    (panelRef.value as HTMLElement & { config: AgentChatConfig }).config = {
      ...config,
      mode: 'panel',
    };
  }

  // Listen for SDK events
  document.addEventListener('agent-chat:message-sent', (e: Event) => {
    console.log('[Vue] Sent:', (e as CustomEvent).detail);
  });
});
</script>

<template>
  <div class="app">
    <header>
      <h1>Agent Chat SDK — Vue 3 Example</h1>
    </header>

    <main>
      <div class="panel-container" ref="panelRef">
        <!-- Config set imperatively in onMounted -->
        <agent-chat-panel mode="panel" ref="panelRef" />
      </div>
    </main>

    <!-- Floating widget (config set imperatively in onMounted) -->
    <agent-chat-widget ref="widgetRef" />
  </div>
</template>

<style scoped>
.app {
  font-family: system-ui, sans-serif;
  min-height: 100vh;
  background: #f8fafc;
}

header {
  background: #1e293b;
  color: #fff;
  padding: 1rem 2rem;
}

header h1 {
  font-size: 1.2rem;
  font-weight: 600;
}

main {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.panel-container {
  height: 500px;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
}

agent-chat-panel {
  display: block;
  height: 100%;
}
</style>
