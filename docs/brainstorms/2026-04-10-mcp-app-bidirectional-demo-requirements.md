---
date: 2026-04-10
topic: mcp-app-bidirectional-demo
---

# MCP App Bidirectional Communication Demo

## Problem Frame

The current MCP App demo shows tool calls rendering UI, but doesn't clearly demonstrate two key MCP App capabilities: (1) the AI being aware of what the user sees in the UI, and (2) UI actions driving the conversation. These are the most compelling differentiators of MCP Apps vs. plain iframes.

## Requirements

**AI Awareness of UI State**

- R1. When the task list view renders, `updateModelContext` sends a structured summary of visible tasks (count, status breakdown, names) so the AI can reference the current view without the user describing it
- R2. When the user asks "what am I looking at?" or similar, the AI responds with specifics from the current view state (e.g., "You're looking at 5 tasks, 2 are high priority")

**App-to-Conversation Actions**

- R3. When the user clicks a task title in the list view, it sends a message to the conversation (via `app.sendMessage()`) like "Tell me about the task 'Fix login bug'" — this appears as a user message in the chat and the AI responds to it
- R4. The AI's response to the app-triggered message should call `get_task` to show the detail view, creating a seamless flow: click in list → message in chat → AI fetches details → detail view renders inline

## Success Criteria

- A demo viewer can see the AI reference specific task names and counts without the user typing them
- Clicking a task in the list view produces a visible chat message and an AI response with the detail view

## Scope Boundaries

- Only the task list view gets the enhanced `updateModelContext` (detail and create views keep their existing simple context)
- Only task title clicks trigger conversation messages (not status changes or other actions)
- No changes to the backend

## Key Decisions

- **`app.sendMessage()` for app→chat**: The ext-apps SDK provides `sendMessage` which sends a user-role message from the app to the host. The host (assistant-ui) should receive this and inject it as a user message in the conversation thread, triggering an AI response.

## Outstanding Questions

### Deferred to Planning

- [Affects R3][Needs research] How does `app.sendMessage()` work on the host side? Does AppRenderer surface it via a callback? Does assistant-ui's runtime support injecting external user messages?
- [Affects R1][Technical] The current `updateModelContext` may not be reaching the AI due to the `onFallbackRequest` issue. Planning should verify the full pipeline works: iframe → AppRenderer → modelContext ref → chat adapter → backend system prompt.

## Next Steps

-> `/ce:plan` for structured implementation planning
