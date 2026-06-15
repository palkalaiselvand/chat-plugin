/**
 * Chat UI display mode.
 * - 'widget'   : Floating bubble (FAB) with popup window
 * - 'panel'    : Inline element embedded in the page
 * - 'fullpage' : Occupies full viewport
 */
export type ChatMode = 'widget' | 'panel' | 'fullpage';

/**
 * Theme tokens mapped to CSS custom properties (--agent-chat-*).
 * All values are CSS value strings (e.g. '#fff', '1rem', 'sans-serif').
 */
export interface AgentChatTheme {
  /** Primary brand colour (send button, active states) */
  colorPrimary?: string;
  /** Background of the chat window */
  colorBackground?: string;
  /** Surface colour (message bubbles, input area) */
  colorSurface?: string;
  /** Primary text colour */
  colorText?: string;
  /** Muted / secondary text colour */
  colorTextMuted?: string;
  /** User message bubble background */
  colorUserBubble?: string;
  /** User message bubble text */
  colorUserBubbleText?: string;
  /** Assistant message bubble background */
  colorAssistantBubble?: string;
  /** Assistant message bubble text */
  colorAssistantBubbleText?: string;
  /** Border / divider colour */
  colorBorder?: string;
  /** Global border radius */
  borderRadius?: string;
  /** Base font family */
  fontFamily?: string;
  /** Base font size */
  fontSize?: string;
  /** z-index for the floating widget */
  zIndex?: string;
}

/**
 * A predefined action the user can click (suggestion chip / quick reply).
 */
export interface AgentAction {
  /** Unique identifier for this action */
  id: string;
  /** Display label on the chip */
  label: string;
  /** Optional icon URL or inline SVG string */
  icon?: string;
  /**
   * The message text to inject into the conversation when clicked.
   * Mutually exclusive with `callback`.
   */
  message?: string;
  /**
   * Custom callback invoked when clicked.
   * Mutually exclusive with `message`.
   */
  callback?: (action: AgentAction) => void;
}

/**
 * Master configuration object passed to the SDK.
 */
export interface AgentChatConfig {
  /**
   * Streaming SSE endpoint URL.
   * The SDK sends a POST with { messages: Message[] } and reads SSE chunks.
   */
  endpoint: string;

  /**
   * Additional HTTP headers forwarded with every streaming request
   * (e.g. Authorization: Bearer <token>).
   */
  headers?: Record<string, string>;

  /** Display mode. Defaults to 'widget'. */
  mode?: ChatMode;

  /** Theme overrides applied as CSS custom properties. */
  theme?: AgentChatTheme;

  /** Localisation / label overrides. */
  labels?: {
    title?: string;
    placeholder?: string;
    sendButton?: string;
    clearButton?: string;
    closeButton?: string;
    openButton?: string;
    errorMessage?: string;
    emptyState?: string;
  };

  /** Messages displayed before the user types anything. */
  initialMessages?: Array<{ role: 'assistant' | 'system'; content: string }>;

  /** Quick-reply / action chips shown above the input. */
  actions?: AgentAction[];

  /**
   * Optional function to parse a raw SSE data line into a content token string.
   * Defaults to OpenAI-compatible `data.choices[0].delta.content` extraction.
   * Return `null` to skip the chunk (e.g. `[DONE]` sentinel).
   */
  parseChunk?: (raw: string) => string | null;
}
