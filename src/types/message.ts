/** Sender role for a message */
export type Role = 'user' | 'assistant' | 'system';

/** A single chat message */
export interface Message {
  /** Unique message ID */
  id: string;
  /** Sender role */
  role: Role;
  /** Message content — may grow incrementally while `isStreaming` is true */
  content: string;
  /** ISO-8601 timestamp (set when the message is first created) */
  timestamp: string;
  /** True while the assistant is still streaming tokens into this message */
  isStreaming?: boolean;
}

/** The state of the entire conversation */
export interface ConversationState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

/** Factory to create a new empty ConversationState */
export function createConversationState(): ConversationState {
  return { messages: [], isLoading: false, error: null };
}

/** Factory to create a new Message */
export function createMessage(role: Role, content: string): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}
