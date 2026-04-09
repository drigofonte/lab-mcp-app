---
title: "refactor: Adopt shadcn/assistant-ui styled components"
type: refactor
status: active
date: 2026-04-10
---

# refactor: Adopt shadcn/assistant-ui styled components

## Overview

Replace the hand-written CSS primitives in the chat frontend with `@assistant-ui/react-ui`'s pre-styled components. These ship with a dark zinc theme matching shadcn aesthetics out of the box — rounded corners, clean typography, proper spacing, muted borders, and polished composer/message styling. No Tailwind required for the initial migration.

## Problem Frame

The current chat UI uses assistant-ui's headless primitives (`ThreadPrimitive`, `MessagePrimitive`, `ComposerPrimitive`) with custom CSS classes in `styles.css`. While the color palette is already close to shadcn's zinc dark theme, the components lack the polish of the assistant-ui homepage: no markdown rendering, no scroll-to-bottom button, no loading indicators, no action bars, and rough typography/spacing.

## Requirements Trace

- R1. Chat UI should match shadcn dark aesthetic (zinc palette, rounded corners, clean spacing)
- R2. Use `@assistant-ui/react-ui` pre-styled components instead of hand-written primitives
- R3. Support markdown rendering in assistant messages
- R4. Preserve all existing functionality: tool-call Fallback rendering, MCP App embeds inline, model context updates
- R5. Dark mode by default

## Scope Boundaries

- No Tailwind CSS setup — use `@assistant-ui/react-ui/styles/index.css` standalone approach
- No shadcn/ui CLI or component library — just the assistant-ui styled layer
- No new features — purely visual refactor
- MCP App iframe views keep their existing styling (they're self-contained HTML)
- Backend unchanged

## Key Technical Decisions

- **`@assistant-ui/react-ui` without Tailwind:** The standalone CSS import (`styles/index.css`) provides the full dark theme with `--aui-*` CSS variables matching shadcn's zinc palette. This avoids adding Tailwind to the project while getting the same visual result. Tailwind can be added later if needed.
- **Override `--aui-*` variables for dark mode:** The default theme includes a `.dark` class variant. We set `class="dark"` on the HTML element and override any variables that need adjusting.
- **Keep `tools.Fallback` on `MessagePrimitive.Content`:** The styled `Thread` component from `@assistant-ui/react-ui` uses its own `AssistantMessage` component internally. To keep our custom tool Fallback rendering, we need to either: (a) use the styled Thread but override the `AssistantMessage` component, or (b) continue using primitives for the message content but use styled components for everything else. Option (a) is cleaner.

## Open Questions

### Deferred to Implementation

- Whether `@assistant-ui/react-ui`'s `Thread` component accepts a custom `AssistantMessage` override that supports `tools.Fallback` on `MessagePrimitive.Content`. If not, we'll compose styled subcomponents manually while keeping the Fallback config.

## Implementation Units

- [ ] **Unit 1: Install dependencies and CSS setup**

  **Goal:** Add `@assistant-ui/react-ui` and `@assistant-ui/react-markdown`, import the default theme CSS, and configure dark mode.

  **Requirements:** R1, R5

  **Dependencies:** None

  **Files:**
  - Modify: `apps/frontend/package.json`
  - Modify: `apps/frontend/src/main.tsx` (import CSS)
  - Modify: `apps/frontend/index.html` (add `class="dark"` to html element)

  **Approach:**
  - Install `@assistant-ui/react-ui` and `@assistant-ui/react-markdown`
  - Import `@assistant-ui/react-ui/styles/index.css` in `main.tsx` before `styles.css`
  - Add `class="dark"` to the `<html>` element in `index.html`
  - Keep `styles.css` for now (will be trimmed in Unit 3)

  **Test expectation:** None — dependency and config setup

  **Verification:**
  - Frontend builds without errors
  - The default theme CSS loads (inspect the page for `--aui-*` CSS variables)

---

- [ ] **Unit 2: Replace ChatThread with styled components**

  **Goal:** Swap hand-written primitive components for `@assistant-ui/react-ui` styled equivalents while preserving the tool Fallback for inline MCP Apps.

  **Requirements:** R2, R3, R4

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `apps/frontend/src/components/ChatThread.tsx`
  - Modify: `apps/frontend/src/components/InlineMcpApp.tsx` (adjust class names if needed)

  **Approach:**
  - Import `Thread` from `@assistant-ui/react-ui` — this is the main styled component wrapping viewport, messages, and composer
  - Check if `Thread` accepts `assistantMessage` component override or `components` prop for customizing tool rendering
  - If it does: pass a custom `AssistantMessage` that uses the styled message bubble from `@assistant-ui/react-ui` but adds `tools.Fallback` on `MessagePrimitive.Content` for MCP App rendering
  - If it doesn't: use the styled subcomponents individually (`ThreadViewport`, `ThreadMessages`, `Composer`, `AssistantMessage`, `UserMessage`) and wire the Fallback manually
  - Import `MarkdownText` from `@assistant-ui/react-markdown` for rendering assistant message text as markdown instead of plain `<span>` tags
  - Remove all inline styles from `ThreadPrimitive.Root`

  **Patterns to follow:**
  - assistant-ui docs/examples for `Thread` component customization
  - Current `ChatThread.tsx` for the tool Fallback wiring pattern

  **Test expectation:** None — pure styling change. Visual verification.

  **Verification:**
  - Chat thread renders with styled message bubbles, rounded composer input, proper dark theme
  - User messages right-aligned with primary color, assistant messages left-aligned with surface color
  - Markdown in assistant responses renders correctly (bold, lists, code blocks)
  - Tool Fallback still triggers — MCP App iframes render inline within assistant messages
  - Scroll-to-bottom and auto-scroll work

---

- [ ] **Unit 3: Clean up styles.css**

  **Goal:** Remove CSS rules now handled by `@assistant-ui/react-ui`'s theme. Keep only app-specific overrides.

  **Requirements:** R1

  **Dependencies:** Unit 2

  **Files:**
  - Modify: `apps/frontend/src/styles.css`

  **Approach:**
  - Remove message styling (`.message-user`, `.message-assistant`, `.message-user-bubble`, `.message-assistant-bubble`)
  - Remove composer styling (`.composer`, `.composer-input`, `.composer-send`)
  - Remove viewport styling (`.messages-viewport`, `.empty-state`)
  - Keep: `.chat-container`, `.chat-header`, `.app-embed`, `.app-embed-label`, `.app-embed-content` (these are app-specific, not covered by assistant-ui)
  - Override `--aui-*` variables if the default theme doesn't match the desired dark zinc exactly (current colors `#09090b`, `#18181b`, `#27272a` should match the default dark theme closely)
  - Keep the base reset (`*`, `body`, `#root`, `:root`) but remove redundant properties now set by the theme CSS

  **Test expectation:** None — pure CSS cleanup

  **Verification:**
  - No visual regressions after removing the old CSS rules
  - MCP App embed cards still styled correctly (border, label, content area)

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `@assistant-ui/react-ui` Thread component may not support tool Fallback customization | Fall back to using styled subcomponents individually with manual Fallback wiring |
| Default dark theme may not exactly match desired zinc palette | Override `--aui-*` CSS variables in styles.css |
| `@assistant-ui/react-markdown` may add significant bundle size | Acceptable for a demo project; can tree-shake if needed later |
