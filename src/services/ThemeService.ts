import type { AgentChatTheme } from '../types/config.js';

/** Maps AgentChatTheme keys to CSS custom property names */
const THEME_PROP_MAP: Record<keyof AgentChatTheme, string> = {
  colorPrimary: '--agent-chat-color-primary',
  colorBackground: '--agent-chat-color-background',
  colorSurface: '--agent-chat-color-surface',
  colorText: '--agent-chat-color-text',
  colorTextMuted: '--agent-chat-color-text-muted',
  colorUserBubble: '--agent-chat-color-user-bubble',
  colorUserBubbleText: '--agent-chat-color-user-bubble-text',
  colorAssistantBubble: '--agent-chat-color-assistant-bubble',
  colorAssistantBubbleText: '--agent-chat-color-assistant-bubble-text',
  colorBorder: '--agent-chat-color-border',
  borderRadius: '--agent-chat-border-radius',
  fontFamily: '--agent-chat-font-family',
  fontSize: '--agent-chat-font-size',
  zIndex: '--agent-chat-z-index',
};

/**
 * Service that converts an `AgentChatTheme` object into a CSS custom-property
 * block and injects it into a Shadow Root.
 *
 * CSS custom properties defined on `:host` inherit into all children,
 * so components only need to inject one `<style>` block.
 */
class ThemeServiceClass {
  /**
   * Generates a `:host { ... }` CSS block from the given theme object.
   */
  buildThemeCSS(theme: AgentChatTheme): string {
    const vars = Object.entries(theme)
      .map(([key, value]) => {
        const prop = THEME_PROP_MAP[key as keyof AgentChatTheme];
        return prop ? `  ${prop}: ${value};` : '';
      })
      .filter(Boolean)
      .join('\n');

    return vars ? `:host {\n${vars}\n}` : '';
  }

  /**
   * Injects (or updates) a theme `<style>` element in the given Shadow Root.
   */
  applyTheme(shadow: ShadowRoot, theme: AgentChatTheme | undefined): void {
    if (!theme) return;

    const css = this.buildThemeCSS(theme);
    if (!css) return;

    let style = shadow.getElementById('agent-theme') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'agent-theme';
      shadow.prepend(style);
    }
    style.textContent = css;
  }
}

export const ThemeService = new ThemeServiceClass();
