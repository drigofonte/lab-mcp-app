---
date: 2026-04-09
topic: mcp-native-task-manager
---

# MCP-Native Task Manager

## Problem Frame

Developers evaluating MCP Apps need a concrete, working example that demonstrates the key architectural primitives — not a toy counter, but a coherent app that shows how MCP Apps differ from traditional web apps in practice.

This project is a task manager built as an MCP App, designed to be demoed to fellow developers. The task domain is deliberately minimal so the MCP mechanics stay front and center. The app runs inside a custom assistant-ui host, with a NestJS backend serving as the MCP server.

The project doubles as a hands-on learning exercise for the builder: every architectural choice should make an MCP concept visible and explainable.

## User Flow

```
User opens assistant-ui web app
        |
        v
AI greets user, describes available actions
        |
        v
   .-----------.
   | User acts  |<-------------------------------------------.
   '-----------'                                              |
        |                                                     |
   .----+----.                                                |
   |         |                                                |
   v         v                                                |
[Chat]    [Click UI]                                          |
   |         |                                                |
   v         v                                                |
AI calls a     App calls                                      |
tool bound     server tool                                    |
to a ui://     via postMessage                                |
resource       (app-only tools)                               |
   |              |                                           |
   '------+-------'                                           |
          |                                                   |
          v                                                   |
   Server executes tool,                                      |
   returns result                                             |
          |                                                   |
          v                                                   |
   Host renders the ui://                                     |
   resource bound to the                                      |
   tool that was called                                       |
          |                                                   |
          v                                                   |
   updateModelContext()                                        |
   fires on view switch                                       |
   or user action                                             |
          |                                                   |
          '---------------------------------------------------'
```

## Requirements

**MCP Tool Definitions**

- R1. The server exposes exactly 5 MCP tools covering full CRUD on tasks plus a read-only summary tool. The summary tool exists to demonstrate model-only visibility, not to provide meaningful analytics.
- R2. Each of the three tool visibility modes is represented: at least one tool is model-only, at least one is app-only, and at least one is both model+app visible
- R3. Model-only tools (e.g., task summary) let the AI reason about workload without exposing raw data in the UI
- R4. App-only tools (e.g., UI-triggered view navigation) let the UI switch between resources without the AI initiating the switch
- R5. Both-visible tools (e.g., create, update, delete task) can be triggered by either the AI (via conversation) or the user (via UI controls)

**UI Resources and Routing**

- R6. The server serves 2-3 distinct `ui://` resources, each rendering a different view (task list, task detail/edit, task creation review)
- R7. Each tool's definition includes a fixed `_meta.ui.resourceUri` binding. The AI navigates by calling different tools — each tool is bound to the `ui://` resource that should render its result. The host renders the resource associated with the tool that was called.
- R8. The UI provides minimal fallback navigation (e.g., clickable task titles, a "back to list" link) via app-only tools so the app remains usable without typing

**Bidirectional Context**

- R9. The UI calls `updateModelContext()` on discrete user actions — view switches, form submissions, and explicit interactions (e.g., clicking a task, applying a filter). Not on every keystroke or render. This keeps the AI's context current without implying real-time push. The AI can then reference the current view state in its responses (e.g., "I see you're looking at 3 high-priority tasks").
- R10. When the user creates a task via conversation, the AI fills a structured form and the UI renders it for review. Happy path only: the user confirms or cancels. Mid-review editing (e.g., "change the priority") is a stretch goal.

**Server-Side State and Stateless UI**

- R11. All task state lives server-side in the NestJS backend. The React UI holds no persistent state — it rehydrates from the server on every mount. If the UI is unmounted and remounted, it fetches fresh state, visibly showing a loading-then-data transition. No localStorage, no session storage.
- R12. The server uses in-memory storage (no database) to keep the project simple. Seed tasks are re-created on server start so the demo always begins with data.

**Task Domain (Minimal)**

- R13. A task has: title (string), description (string), status (todo/in-progress/done), and priority (low/medium/high)
- R14. The app ships with a small set of seed tasks so the demo starts with data, not a blank screen

**Host and Runtime**

- R15. The frontend is a custom web app built with React and assistant-ui's `@mcp-ui/client` components, acting as the MCP App host. The host must advertise `updateModelContext` capability support and serve or include a sandbox proxy for iframe communication.
- R16. The backend is a NestJS app acting as the MCP server. The chosen NestJS-MCP library will likely need a thin adapter layer for MCP Apps extension primitives (`_meta.ui`, tool visibility, `ui://` resource MIME types) since no library natively supports them yet.
- R17. Both apps live in a monorepo with shared tooling

## Demo Script (~5 minutes)

**Act 1 — First Impression (30s):** Open the app. AI greets you. Task list renders with seed data. "This task list is an MCP App rendered inside the AI conversation."

**Act 2 — AI-Driven Navigation (60s):** Ask the AI to show a task's details. View switches via tool bound to `ui://tasks/detail`. Click "Back to list" (app-only tool). "Two navigation paths — AI called a tool bound to a different resource, UI used an app-only tool the AI can't see."

**Act 3 — Create from Conversation (90s):** Ask the AI to create a task from natural language. AI calls `create_task`, UI renders pre-filled form for review. Confirm. List updates. "The AI filled the form, I reviewed it. The tool is both-visible — I could also click New Task in the UI."

**Act 4 — Model-Only Tool (45s):** Ask "What's my workload looking like?" AI calls model-only summary tool and reasons about it — no UI widget renders. "That tool is invisible to the UI. The AI used it to reason, but the app never saw it."

**Act 5 — Stateless UI (45s):** Refresh the page. UI shows loading state, then rehydrates from server. "No localStorage, no session. The UI fetched everything fresh from the server."

**Act 6 — Context Loop (30s):** Click a task in the UI. Ask "What am I looking at?" AI responds with details about the clicked task. "I didn't tell the AI which task. The UI synced context automatically via updateModelContext()."

## Success Criteria

- A developer watching a 5-minute demo can identify and explain all three tool visibility modes
- The "create task from conversation" flow clearly shows bidirectional messaging (AI proposes, UI renders form, user confirms, server persists)
- Switching between views via conversation is visibly different from clicking a link — both work, but the AI-driven path demonstrates resource routing via different tools bound to different `ui://` resources
- Remounting the UI visibly rehydrates from server state, making the stateless UI / server-side state pattern concrete

## Scope Boundaries

- No database — in-memory storage only
- No authentication or multi-user support
- No cross-host distribution (assistant-ui only; Claude Desktop registration is a future exercise)
- No persistent sessions across page reloads beyond what the server's in-memory store provides
- No real-time updates or WebSocket push — context syncs on user actions, not continuously
- Theming and CSP constraints are acknowledged but not the primary teaching focus
- No production deployment — runs locally only
- Mid-review task editing during the create flow is a stretch goal, not required

## Key Decisions

- **Minimal task domain:** Title, description, status, priority. Richer domains risk the demo becoming about project management instead of MCP. This keeps every line of code attributable to an MCP concept.
- **AI-primary, UI-fallback navigation:** The AI routes between views by calling tools bound to different `ui://` resources. The UI has clickable links (via app-only tools) as fallback. This showcases MCP-native navigation while keeping the app usable.
- **assistant-ui as host:** Self-contained demo with full control over the experience. No dependency on Claude Desktop or other external hosts.
- **In-memory storage:** Eliminates database setup complexity. The trade-off (data lost on server restart) actually reinforces the "MCP Apps don't guarantee persistence" lesson. Seeds re-created on start ensure a clean demo.
- **5 tools, 2-3 UI resources:** Hard scope cap to prevent feature creep. Every tool must demonstrate a specific MCP concept.
- **resourceUri is per-tool, not per-response:** Each tool definition has a fixed `_meta.ui.resourceUri`. The AI navigates by choosing which tool to call, not by dynamically setting a URI in the response. This matches the MCP Apps spec.
- **Monorepo simplicity:** Bias toward pnpm workspaces with no build orchestrator (no Turborepo). Two packages don't need orchestration.

## Outstanding Questions

### Deferred to Planning
- [Affects R16][Needs research] Which NestJS-MCP integration library (`@rekog/mcp-nest` vs `@bamada/nestjs-mcp` vs `@nestjs-mcp/server`) passes `_meta` through most cleanly? Initial research suggests `@rekog/mcp-nest` supports `_meta` passthrough but needs a typed adapter for ext-apps primitives.
- [Affects R15][Needs research] What is the minimum assistant-ui setup needed to act as an MCP App host? Specifically: how to create an MCP Client, configure the `AppRenderer` with a sandbox proxy, and wire up tool call proxying from iframe to server.
- [Affects R15][Needs research] The `@mcp-ui/server` package pins `@modelcontextprotocol/ext-apps@^0.3.1` while `@mcp-ui/client` pins `^1.2.0`. Planning should determine whether to use `@mcp-ui/server`, `@modelcontextprotocol/ext-apps/server` directly, or hand-craft UI resource responses to avoid version conflicts.
- [Affects R6][Technical] Whether to use 2 or 3 distinct `ui://` resources — depends on whether task creation review warrants its own resource vs. being a mode of the detail view
- [Affects R5][Technical] Error handling for stale task IDs (e.g., AI references a task that no longer exists after server restart). Minimum: return a clear error message. Not a blocking question but should be addressed during implementation.

## Next Steps

-> `/ce:plan` for structured implementation planning
