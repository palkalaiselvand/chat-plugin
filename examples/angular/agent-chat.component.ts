// Angular 17+ standalone component example
// To use: add this file to your Angular project and register the module.
//
// In main.ts / app.config.ts:
//   import { defineCustomElements } from './agent-chat.component';
//   defineCustomElements();

import '@agent-ui/chat-sdk';
import type { AgentChatConfig } from '@agent-ui/chat-sdk';
import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
} from '@angular/core';

const CHAT_CONFIG: AgentChatConfig = {
  endpoint: 'https://your-backend.example.com/api/chat/stream',
  theme: {
    colorPrimary: '#dc2626',
    borderRadius: '0.85rem',
  },
  labels: {
    title: 'AI Assistant (Angular)',
    placeholder: 'Ask me anything…',
    emptyState: 'Hi from Angular! How can I help?',
  },
  initialMessages: [
    { role: 'assistant', content: 'Hello from Angular! How can I help you today?' },
  ],
};

@Component({
  selector: 'app-chat-demo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wrapper">
      <h1>Agent Chat SDK — Angular Example</h1>

      <div class="panel-wrap">
        <!-- Config must be set imperatively in ngOnInit -->
        <agent-chat-panel mode="panel" #panel></agent-chat-panel>
      </div>

      <agent-chat-widget #widget></agent-chat-widget>
    </div>
  `,
  styles: [`
    .wrapper {
      font-family: system-ui, sans-serif;
      padding: 2rem;
    }
    h1 {
      font-size: 1.3rem;
      margin-bottom: 1.5rem;
    }
    .panel-wrap {
      height: 500px;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      overflow: hidden;
    }
    agent-chat-panel {
      display: block;
      height: 100%;
    }
  `],
})
export class ChatDemoComponent implements OnInit {
  @ViewChild('panel') panelRef!: ElementRef<HTMLElement & { config: AgentChatConfig }>;
  @ViewChild('widget') widgetRef!: ElementRef<HTMLElement & { config: AgentChatConfig }>;

  ngOnInit(): void {
    // ViewChild refs are available after ngAfterViewInit, not ngOnInit.
    // Move to ngAfterViewInit in a real app.
  }

  ngAfterViewInit(): void {
    if (this.panelRef?.nativeElement) {
      this.panelRef.nativeElement.config = { ...CHAT_CONFIG, mode: 'panel' };
    }
    if (this.widgetRef?.nativeElement) {
      this.widgetRef.nativeElement.config = { ...CHAT_CONFIG, mode: 'widget' };
    }

    // Subscribe to SDK events
    document.addEventListener('agent-chat:message-sent', (e: Event) => {
      console.log('[Angular] Sent:', (e as CustomEvent).detail);
    });
  }
}
