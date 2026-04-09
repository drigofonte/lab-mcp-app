---
title: "feat: MCP-Native Task Manager"
type: feat
status: active
date: 2026-04-09
origin: docs/brainstorms/2026-04-09-mcp-native-task-manager-requirements.md
---

# feat: MCP-Native Task Manager

## Overview

Build a task manager as an MCP App to demo MCP Apps architecture to fellow developers. Minimal task domain (title, description, status, priority). Five MCP tools covering CRUD + summary, each demonstrating a different tool visibility mode. Three `ui://` resources rendered as sandboxed iframes. A React frontend hosts the chat (assistant-ui) and renders MCP App views (@mcp-ui/client). NestJS backend serves as both the MCP server and a chat/LLM proxy.

## Problem Frame

Developers evaluating MCP Apps need a concrete, working demo — not a counter, but a coherent app showing how MCP Apps differ from traditional web apps. This project makes every MCP primitive visible and explainable. (see origin: `docs/brainstorms/2026-04-09-mcp-native-task-manager-requirements.md`)

## Requirements Trace

- R1. 5 MCP tools: full CRUD + read-only summary
- R2. All three visibility modes represented (model-only, app-only, both)
- R3. Model-only tool for AI reasoning without UI rendering
- R4. App-only tool for UI-triggered actions invisible to the AI
- R5. Both-visible tools triggerable by AI or user
- R6. 3 distinct `ui://` resources (list, detail, create)
- R7. Fixed `_meta.ui.resourceUri` per tool; AI navigates by calling different tools
- R8. UI fallback navigation via clickable links
- R9. `updateModelContext()` on discrete user actions
- R10. AI-filled creation form, user confirms or cancels (happy path only)
- R11. Stateless UI, server-side state, rehydration on mount
- R12. In-memory storage, seeds on start
- R13-R14. Minimal task domain with seed data
- R15. assistant-ui host with sandbox proxy and updateModelContext capability
- R16. NestJS + @rekog/mcp-nest
- R17. pnpm monorepo

## Scope Boundaries

- No database — in-memory only
- No auth, no multi-user
- No cross-host distribution (assistant-ui only)
- No real-time push — context syncs on user actions
- No production deployment — local only
- Mid-review task editing is a stretch goal
- No delete tool (4 CRUD ops + summary = 5 tools within cap)

## Context & Research

### Relevant Code and Patterns

Greenfield repo — no existing code. Reference implementations:

- **ext-apps basic-host example** (`github.com/modelcontextprotocol/ext-apps/examples/basic-host/`) — reference for sandbox proxy, AppBridge setup, tool call proxying, and ui:// resource rendering. The `implementation.ts`, `sandbox.ts`, and `serve.ts` files are the key references.
- **MCP-UI Chat** (`github.com/idosal/scira-mcp-ui-chat`) — reference for wiring @mcp-ui/client with a chat UI and LLM provider (uses Vercel AI SDK + Next.js).
- **@rekog/mcp-nest** (`github.com/rekog-labs/MCP-Nest`) — decorator-based MCP tool/resource registration with `_meta` passthrough.

### External References

- MCP Apps spec: `modelcontextprotocol.io/extensions/apps/overview`
- ext-apps SDK API: `modelcontextprotocol.github.io/ext-apps/api/`
- `@modelcontextprotocol/ext-apps` v1.5.0 — `registerAppTool`, `registerAppResource`, `App` class, `useApp` hook
- `@mcp-ui/client` v7.0.0 — `AppRenderer`, `AppFrame`, `UI_EXTENSION_CAPABILITIES`
- `@rekog/mcp-nest` v1.9.9 — `@Tool`, `@Resource` decorators with `_meta` support

## Key Technical Decisions

- **@rekog/mcp-nest for NestJS-MCP integration:** Only wrapper library that passes `_meta` through on tools AND resources. 67K weekly downloads, actively maintained. Supports custom MIME types for resources. No adapter layer needed — use `_meta: { ui: { resourceUri, visibility } }` directly in `@Tool` decorator.

- **Single SDK: @rekog/mcp-nest decorators exclusively.** Research confirmed that `@rekog/mcp-nest`'s `@Tool` and `@Resource` decorators pass `_meta` through cleanly to the MCP protocol wire format. No need for ext-apps `registerAppTool`/`registerAppResource` — using both would risk dual-server-instance conflicts. The `@rekog/mcp-nest` decorators handle visibility metadata via `_meta: { ui: { visibility, resourceUri } }` and resources via `@Resource` with custom `mimeType`.

- **Separate MCP App views package:** The 3 `ui://` resource views are React apps bundled into single HTML files via Vite + `vite-plugin-singlefile`. They live in `apps/mcp-views/` as a separate workspace. Built HTML files are read by the backend and served as MCP resources.

- **Chat proxy on NestJS backend:** The NestJS server exposes `POST /api/chat` that receives messages, calls the Anthropic API with MCP tool definitions, executes tool calls locally, and returns the result. This keeps the API key server-side and avoids CORS issues. The frontend is a pure SPA.

- **Browser MCP client for AppRenderer:** The frontend maintains a Streamable HTTP MCP client connection to the NestJS server. This is used exclusively by AppRenderer for: (a) fetching `ui://` resource HTML, and (b) proxying `callServerTool` from iframes. The main chat flow uses the REST `/api/chat` endpoint instead.

- **assistant-ui + @mcp-ui/client composition:** These are separate libraries. assistant-ui provides the chat UI (`@assistant-ui/react`). @mcp-ui/client provides `AppRenderer` for iframe rendering. The frontend wires them together: when a chat message includes a tool call with a `resourceUri`, the app renders an AppRenderer alongside the chat response.

- **3 ui:// resources, not 2:** Task list, task detail, and task creation review are separate resources. This maximizes the routing demo (Act 2 + Act 3 of the demo script each trigger a different resource switch).

- **Tool design:**

  | Tool | Visibility | Resource URI | CRUD |
  |------|-----------|-------------|------|
  | `list_tasks` | both | `ui://tasks/list` | Read (list) |
  | `get_task` | both | `ui://tasks/detail` | Read (single) |
  | `create_task` | both | `ui://tasks/create` | Create |
  | `update_task` | app-only | `ui://tasks/detail` | Update |
  | `summarize_tasks` | model-only | — | — |

  - `update_task` is app-only: only the detail view UI can change status/priority. The AI can suggest changes conversationally but can't mutate directly. This demonstrates a practical authority boundary.
  - `summarize_tasks` has no resourceUri: the AI reasons about workload without rendering anything.
  - Navigation: clicking a task title calls `get_task` via `app.callServerTool()`. "Back to list" calls `list_tasks`. Both are both-visible, so either AI or UI can trigger them.

- **Sandbox proxy as standalone script:** Served on port 8082 (backend on 3001, frontend on 5173). Follows the ext-apps reference implementation pattern. ~100 lines.

- **updateModelContext via AppRenderer's `onFallbackRequest` callback:** AppRenderer v7 doesn't declare `updateModelContext` capability natively. The `onFallbackRequest` prop catches any unhandled JSON-RPC method from the iframe — including `ui/update-model-context`. The host intercepts this, extracts the context payload, and stores it for inclusion in the next chat message to the backend. This avoids needing AppBridge directly and stays within the @mcp-ui/client component model.

- **assistant-ui runtime: `useLocalRuntime` + `ChatModelAdapter`.** The frontend uses assistant-ui's `useLocalRuntime` with a custom `ChatModelAdapter` that calls `POST /api/chat` on the backend. This ensures the chat state lives inside assistant-ui's context so `Thread`, `Message`, and `Composer` components work correctly. A hand-rolled `useChat` hook would bypass assistant-ui's internal state and break the component tree.

- **ChatService discovers model-visible tools via injected metadata.** The `ChatService` imports `McpModule`'s tool metadata directly (via a shared `ToolRegistryService` or by reading `@Tool` decorator metadata from the DI container). This avoids a loopback HTTP call to `/mcp` for `tools/list`. The service filters to tools where `_meta.ui.visibility` includes `'model'` (or has no visibility field, defaulting to both).

- **`create_task` persists immediately.** When the AI calls `create_task`, the tool creates and persists the task in the in-memory store. The `ui://tasks/create` view receives the created task data via `ontoolinput`/`ontoolresult` and renders a read-only confirmation card. "Confirm" navigates to list (`app.callServerTool({ name: 'list_tasks' })`). "Cancel" also navigates to list — the task remains created. This is acceptable for a demo: the Cancel button demonstrates the UI interaction pattern without requiring a delete tool (which is out of scope). An implementer note in the view should clarify this trade-off.

## Open Questions

### Resolved During Planning

- **NestJS-MCP library:** `@rekog/mcp-nest` — only one with `_meta` support. No adapter needed.
- **assistant-ui vs @mcp-ui/client:** Separate projects. Both needed. Wired together in frontend.
- **Sandbox proxy:** Not bundled. Must create and serve on separate origin. Reference impl in ext-apps repo.
- **resourceUri mechanism:** Fixed per-tool-definition, not per-response. AI navigates by calling different tools.
- **Monorepo tooling:** pnpm workspaces, no Turborepo.
- **Number of ui:// resources:** 3 (list, detail, create).

### Deferred to Implementation

- **LLM tool response format:** Exact mapping from Anthropic API `tool_use` blocks to assistant-ui's `ChatModelAdapter` response format. Resolve when building Unit 7.
- **`ontoolinput` race condition:** The create view registers `ontoolinput` before `connect()`, but if the iframe loads slowly, `ontoolresult` may arrive before `ontoolinput`. Views should handle receiving `ontoolresult` directly without a prior `ontoolinput` — render from whatever data is available.
- **`callServerTool` error handling in views:** For demo reliability, views should catch `callServerTool` errors and display a brief inline error message rather than crashing. Not a priority but noted for implementer awareness.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
┌─────────────────── Frontend (React + Vite, port 5173) ───────────────────┐
│                                                                           │
│  ┌──────────────────┐    POST /api/chat    ┌──────────────────────────┐  │
│  │ assistant-ui      │ ──────────────────── │                          │  │
│  │ Chat Thread       │ ◄────────────────── │                          │  │
│  └──────────────────┘                      │                          │  │
│                                            │  NestJS Backend           │  │
│  ┌──────────────────┐  Streamable HTTP     │  (port 3001)             │  │
│  │ MCP Client        │ ──── /mcp ────────── │                          │  │
│  └────────┬─────────┘                      │  ┌────────────────────┐  │  │
│           │                                │  │ MCP Server          │  │  │
│  ┌────────▼─────────┐                      │  │ (@rekog/mcp-nest)  │  │  │
│  │ AppRenderer       │ ◄── html via MCP ── │  │                    │  │  │
│  │ (@mcp-ui/client)  │                     │  │ 5 Tools            │  │  │
│  └────────┬─────────┘                      │  │ 3 ui:// Resources  │  │  │
│           │                                │  └────────┬───────────┘  │  │
│  ┌────────▼─────────┐                      │           │              │  │
│  │ Sandbox Proxy     │                     │  ┌────────▼───────────┐  │  │
│  │ (port 8082)       │                     │  │ Task Service        │  │  │
│  │                   │                     │  │ (in-memory + seeds) │  │  │
│  │ ┌───────────────┐ │                     │  └────────────────────┘  │  │
│  │ │ MCP App View  │ │                     │                          │  │
│  │ │ (iframe)      │ │                     │  ┌────────────────────┐  │  │
│  │ │ updateModel   │─┼── via postMessage ──│  │ Chat Proxy          │  │  │
│  │ │ Context()     │ │   to host           │  │ POST /api/chat      │  │  │
│  │ │ callServer    │─┼── via AppRenderer ──│  │ → Anthropic API     │  │  │
│  │ │ Tool()        │ │   → MCP Client      │  └────────────────────┘  │  │
│  │ └───────────────┘ │                     │                          │  │
│  └───────────────────┘                     └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

MCP App Views (apps/mcp-views/, built separately)
  task-list.html    → served as ui://tasks/list
  task-detail.html  → served as ui://tasks/detail
  task-create.html  → served as ui://tasks/create
  Each: React + @modelcontextprotocol/ext-apps, bundled via vite-plugin-singlefile
```

## Implementation Units

- [ ] **Unit 1: Monorepo Scaffolding**

  **Goal:** Set up the pnpm workspace with three packages: backend, frontend, mcp-views.

  **Requirements:** R17

  **Dependencies:** None

  **Files:**
  - Create: `pnpm-workspace.yaml`
  - Create: `package.json` (root)
  - Create: `apps/backend/package.json`
  - Create: `apps/backend/tsconfig.json`
  - Create: `apps/frontend/package.json`
  - Create: `apps/frontend/tsconfig.json`
  - Create: `apps/frontend/vite.config.ts`
  - Create: `apps/mcp-views/package.json`
  - Create: `apps/mcp-views/tsconfig.json`
  - Create: `apps/mcp-views/vite.config.ts`

  **Approach:**
  - Root `pnpm-workspace.yaml` with `packages: ['apps/*']`
  - Root scripts: `dev` (starts all 3), `build` (builds all)
  - Backend: NestJS with `@nestjs/cli`, TypeScript strict
  - Frontend: Vite + React 19 + TypeScript
  - MCP Views: Vite + React 19 + `vite-plugin-singlefile`, multi-entry config outputting 3 HTML files
  - All packages use TypeScript strict mode

  **Patterns to follow:**
  - ext-apps repo examples for Vite singlefile config

  **Test expectation:** None — pure scaffolding. Verification is that `pnpm install` succeeds and each package builds without errors.

  **Verification:**
  - `pnpm install` completes without errors
  - `pnpm --filter backend build` produces NestJS output
  - `pnpm --filter mcp-views build` produces 3 HTML files

---

- [ ] **Unit 2: NestJS MCP Server + Task Service**

  **Goal:** Stand up the NestJS backend with @rekog/mcp-nest providing a Streamable HTTP MCP endpoint, plus an in-memory task service with seed data.

  **Requirements:** R11, R12, R13, R14, R16

  **Dependencies:** Unit 1

  **Files:**
  - Create: `apps/backend/src/main.ts`
  - Create: `apps/backend/src/app.module.ts`
  - Create: `apps/backend/src/tasks/task.interface.ts`
  - Create: `apps/backend/src/tasks/tasks.service.ts`
  - Create: `apps/backend/src/tasks/tasks.module.ts`
  - Test: `apps/backend/src/tasks/tasks.service.spec.ts`

  **Approach:**
  - `McpModule.forRoot()` from `@rekog/mcp-nest` in `app.module.ts`
  - Streamable HTTP transport on `/mcp` endpoint
  - `TasksService` with `Map<string, Task>` in-memory store
  - `Task` interface: `{ id: string, title: string, description: string, status: 'todo' | 'in-progress' | 'done', priority: 'low' | 'medium' | 'high', createdAt: string }`
  - Seed 4-5 tasks on service initialization (in constructor)
  - CORS enabled for frontend origin

  **Patterns to follow:**
  - @rekog/mcp-nest README for module setup and transport configuration

  **Test scenarios:**
  - Happy path: `create()` returns a task with generated ID and all fields set
  - Happy path: `findAll()` returns seed tasks after initialization
  - Happy path: `findOne(id)` returns the correct task
  - Happy path: `update(id, partial)` merges fields and returns updated task
  - Edge case: `findOne(nonexistent)` returns undefined or throws
  - Edge case: `update(nonexistent, data)` returns error indicator

  **Verification:**
  - NestJS starts on port 3001
  - MCP endpoint responds at `http://localhost:3001/mcp`
  - Task service tests pass

---

- [ ] **Unit 3: MCP Tool Registration**

  **Goal:** Register 5 MCP tools with correct visibility modes and resourceUri bindings.

  **Requirements:** R1, R2, R3, R4, R5, R7

  **Dependencies:** Unit 2

  **Files:**
  - Create: `apps/backend/src/mcp/tools/list-tasks.tool.ts`
  - Create: `apps/backend/src/mcp/tools/get-task.tool.ts`
  - Create: `apps/backend/src/mcp/tools/create-task.tool.ts`
  - Create: `apps/backend/src/mcp/tools/update-task.tool.ts`
  - Create: `apps/backend/src/mcp/tools/summarize-tasks.tool.ts`
  - Create: `apps/backend/src/mcp/mcp.module.ts`
  - Test: `apps/backend/src/mcp/tools/tools.integration.spec.ts`

  **Approach:**
  - Each tool is a NestJS provider class using `@Tool` decorator from `@rekog/mcp-nest`
  - Tool metadata structure:
    ```
    @Tool({
      name: 'list_tasks',
      description: '...',
      _meta: { ui: { resourceUri: 'ui://tasks/list', visibility: ['model', 'app'] } }
    })
    ```
  - `list_tasks` (both): returns all tasks as JSON
  - `get_task` (both): takes `taskId` param, returns single task
  - `create_task` (both): takes `title`, `description`, `status`, `priority`, creates and returns task
  - `update_task` (app-only, visibility: `['app']`): takes `taskId` + partial fields, updates and returns
  - `summarize_tasks` (model-only, visibility: `['model']`, no resourceUri): returns text summary of task counts by status/priority
  - All tools inject `TasksService` via NestJS DI

  **Patterns to follow:**
  - @rekog/mcp-nest `@Tool` decorator examples for `_meta` usage

  **Test scenarios:**
  - Happy path: `list_tasks` returns all seed tasks
  - Happy path: `get_task` with valid ID returns correct task
  - Happy path: `create_task` with full fields creates and returns new task
  - Happy path: `update_task` with valid ID and partial data updates correctly
  - Happy path: `summarize_tasks` returns human-readable summary with counts
  - Edge case: `get_task` with invalid ID returns error content
  - Integration: tools listed via MCP protocol include correct `_meta.ui` on each

  **Verification:**
  - `tools/list` MCP request returns 5 tools with correct visibility and resourceUri metadata
  - Each tool executes correctly when called via MCP protocol

---

- [ ] **Unit 4: MCP App Views (Iframe Content)**

  **Goal:** Build 3 React views that run inside sandboxed iframes, using the ext-apps SDK for bidirectional communication.

  **Requirements:** R6, R8, R9, R10, R11

  **Dependencies:** Unit 1 (build tooling), Unit 3 (tool names to call — hardcoded strings; keep in sync manually)

  **Files:**
  - Create: `apps/mcp-views/src/shared/app-setup.ts` (App init, useApp hook wiring)
  - Create: `apps/mcp-views/src/task-list/index.html`
  - Create: `apps/mcp-views/src/task-list/App.tsx`
  - Create: `apps/mcp-views/src/task-detail/index.html`
  - Create: `apps/mcp-views/src/task-detail/App.tsx`
  - Create: `apps/mcp-views/src/task-create/index.html`
  - Create: `apps/mcp-views/src/task-create/App.tsx`

  **Approach:**
  - Each view is an independent React app entry point, built into a single HTML file
  - Shared `app-setup.ts` creates `App` instance, calls `app.connect()`, handles `useApp()` lifecycle
  - **task-list view:**
    - Receives task list via `app.ontoolresult` (data from `list_tasks` tool)
    - Renders tasks as cards/rows with clickable titles
    - Clicking a title calls `app.callServerTool({ name: 'get_task', arguments: { taskId } })`
    - Calls `app.updateModelContext({ content: [{ type: 'text', text: 'Viewing task list: N tasks, M high priority' }] })` on mount and after data refresh
  - **task-detail view:**
    - Receives single task via `app.ontoolresult`
    - Renders task fields with editable status/priority dropdowns
    - Changing status/priority calls `app.callServerTool({ name: 'update_task', arguments: { taskId, status, priority } })`
    - "Back to list" link calls `app.callServerTool({ name: 'list_tasks' })`
    - Calls `updateModelContext` with current task details
  - **task-create view:**
    - Receives created task data via `app.ontoolinput` or `app.ontoolresult` (from `create_task` tool — task is already persisted server-side)
    - Renders a read-only confirmation card showing the created task fields
    - "View List" button navigates to list via `app.callServerTool({ name: 'list_tasks' })`
    - No Cancel/delete — task is already created. This is a deliberate demo trade-off (delete is out of scope)
    - Calls `updateModelContext` with "Created new task: {title}"
    - Handle the `ontoolinput`/`ontoolresult` race: render from whichever arrives first
  - Minimal styling: clean, readable, no framework. CSS-in-JS or inline styles. Consume host theme CSS variables for dark/light mode.

  **Technical design:**

  > *Directional guidance, not implementation specification.*

  Each view follows this lifecycle:
  ```
  mount → app.connect() → receive toolInput/toolResult → render data
       → user interacts → app.callServerTool() → receive result → re-render
       → app.updateModelContext() on meaningful state changes
  ```

  **Patterns to follow:**
  - ext-apps example apps (counter, threejs) for App class usage and lifecycle
  - `@modelcontextprotocol/ext-apps/react` for `useApp` and `useHostStyles` hooks

  **Test expectation:** None for the HTML views themselves — they run inside iframes and are tested via integration with the host. Manual verification via the demo flow.

  **Verification:**
  - `pnpm --filter mcp-views build` produces 3 HTML files (task-list.html, task-detail.html, task-create.html)
  - Each file is self-contained (all JS/CSS inlined)

---

- [ ] **Unit 5: ui:// Resource Registration**

  **Goal:** Register the 3 built HTML files as `ui://` resources on the MCP server.

  **Requirements:** R6, R7

  **Dependencies:** Unit 2 (MCP server), Unit 4 (built HTML files)

  **Files:**
  - Create: `apps/backend/src/mcp/resources/task-views.resource.ts`
  - Modify: `apps/backend/src/mcp/mcp.module.ts`

  **Approach:**
  - Use `@Resource` decorator from `@rekog/mcp-nest` with `mimeType: 'text/html;profile=mcp-app'`
  - Three resources: `ui://tasks/list`, `ui://tasks/detail`, `ui://tasks/create`
  - Each resource handler reads the built HTML file from disk (or from a bundled location)
  - Backend reads built HTML from `apps/mcp-views/dist/` at startup (or lazily on first request)
  - Use `@rekog/mcp-nest` `@Resource` decorator exclusively (consistent with single-SDK decision)

  **Patterns to follow:**
  - ext-apps `registerAppResource` API for resource registration with MIME type and CSP metadata

  **Test scenarios:**
  - Happy path: `resources/list` MCP request returns 3 resources with correct URIs and MIME types
  - Happy path: `resources/read` for `ui://tasks/list` returns valid HTML content
  - Edge case: `resources/read` for unknown URI returns appropriate error

  **Verification:**
  - MCP `resources/list` returns all 3 `ui://` resources with `text/html;profile=mcp-app` MIME type
  - MCP `resources/read` for each URI returns the corresponding HTML content

---

- [ ] **Unit 6: Sandbox Proxy**

  **Goal:** Create and serve the sandbox proxy HTML on a separate origin for iframe isolation.

  **Requirements:** R15

  **Dependencies:** Unit 1

  **Files:**
  - Create: `sandbox/sandbox.html`
  - Create: `sandbox/serve.ts`
  - Modify: `package.json` (root — add sandbox dev script)

  **Approach:**
  - Follow the ext-apps `examples/basic-host/` reference implementation
  - `sandbox.html`: minimal HTML page that receives messages from parent, creates inner iframe, relays postMessage bidirectionally
  - `serve.ts`: tiny Express (or http) server on port 8082 that serves `sandbox.html` with appropriate CSP headers parsed from `?csp=` query parameter
  - The sandbox validates referrer origin (frontend's origin) before relaying messages
  - Root `dev` script starts the sandbox proxy alongside backend and frontend

  **Patterns to follow:**
  - ext-apps `examples/basic-host/src/sandbox.ts` and `examples/basic-host/sandbox.html`

  **Test expectation:** None — static file serving. Verification is manual.

  **Verification:**
  - `http://localhost:8082/sandbox.html` loads successfully
  - Origin differs from frontend (port 5173) and backend (port 3001)

---

- [ ] **Unit 7: React Frontend — Chat + MCP App Host**

  **Goal:** Build the React frontend with assistant-ui chat, MCP client, and AppRenderer integration.

  **Requirements:** R9, R15

  **Dependencies:** Unit 2 (backend running), Unit 5 (resources registered), Unit 6 (sandbox proxy)

  **Files:**
  - Create: `apps/frontend/src/main.tsx`
  - Create: `apps/frontend/src/App.tsx`
  - Create: `apps/frontend/src/components/ChatThread.tsx`
  - Create: `apps/frontend/src/components/McpAppPanel.tsx`
  - Create: `apps/frontend/src/hooks/useMcpClient.ts`
  - Create: `apps/frontend/src/lib/chat-adapter.ts`
  - Create: `apps/frontend/src/types.ts`
  - Create: `apps/frontend/index.html`

  **Approach:**
  - **Layout:** Two-panel layout. Left: assistant-ui chat thread. Right: MCP App panel (AppRenderer).
  - **assistant-ui runtime:** Use `useLocalRuntime` from `@assistant-ui/react` with a custom `ChatModelAdapter` defined in `chat-adapter.ts`. The adapter calls `POST /api/chat` on the backend, maps Anthropic response format to assistant-ui's expected format, and returns the result. This keeps chat state inside assistant-ui's context so `Thread`, `Message`, and `Composer` components work correctly.
  - **MCP Client** (`useMcpClient` hook): Creates `Client` from `@modelcontextprotocol/sdk`, connects via `StreamableHTTPClientTransport` to `http://localhost:3001/mcp`. Advertises UI extension capabilities via `UI_EXTENSION_CAPABILITIES` from `@mcp-ui/client`.
  - **AppRenderer integration** (`McpAppPanel`): Renders `AppRenderer` from `@mcp-ui/client` when a tool with `resourceUri` has been called. Props: `sandbox: { url: new URL('http://localhost:8082/sandbox.html') }`, `client` from the MCP client hook, `toolName`, `toolInput`, `toolResult`.
  - **updateModelContext handling:** Use AppRenderer's `onFallbackRequest` prop to intercept `ui/update-model-context` JSON-RPC messages from the iframe. Extract the context payload and store it in React state. The `ChatModelAdapter` includes this stored context in the next `POST /api/chat` request body as the `modelContext` field.
  - **Tool call detection:** After each assistant response, check if any tool_use blocks reference tools that have `_meta.ui.resourceUri` (fetched once from MCP client's `tools/list`). If so, display the AppRenderer for that tool.
  - **View switching on `callServerTool`:** When the iframe calls `callServerTool` for a tool with a different `resourceUri` than the current view (e.g., clicking a task title calls `get_task` bound to `ui://tasks/detail`), the host detects the URI change and swaps to a new AppRenderer instance for the new resource. Use the `onCallTool` callback to intercept, check resourceUri, and re-render.

  **Patterns to follow:**
  - ext-apps basic-host `implementation.ts` for AppBridge/AppRenderer wiring
  - MCP-UI Chat for chat + AppRenderer composition
  - assistant-ui docs for Thread/Message component usage

  **Test scenarios:**
  - Happy path: MCP client connects to backend and lists 5 tools
  - Happy path: AppRenderer renders when a tool with resourceUri is detected in chat response
  - Happy path: updateModelContext from iframe is captured and included in next chat message
  - Integration: clicking a task in the list view iframe triggers tool call → host switches to detail view AppRenderer

  **Verification:**
  - Frontend loads at localhost:5173
  - Chat thread renders and accepts input
  - When AI calls a tool with resourceUri, the MCP App panel renders the corresponding iframe
  - Interactions within the iframe (clicking tasks, changing status) trigger tool calls that update the view

---

- [ ] **Unit 8: Chat Proxy + LLM Integration**

  **Goal:** Add the `/api/chat` endpoint to NestJS that proxies messages to the Anthropic API with MCP tool definitions.

  **Requirements:** R5, R7, R9, R10

  **Dependencies:** Unit 3 (tools registered)

  **Files:**
  - Create: `apps/backend/src/chat/chat.controller.ts`
  - Create: `apps/backend/src/chat/chat.service.ts`
  - Create: `apps/backend/src/chat/chat.module.ts`
  - Modify: `apps/backend/src/app.module.ts`
  - Create: `apps/backend/.env.example`
  - Test: `apps/backend/src/chat/chat.service.spec.ts`

  **Approach:**
  - `POST /api/chat` accepts `{ messages: Message[], modelContext?: string }` where `messages` follows the Anthropic conversation format
  - `ChatService` uses `@anthropic-ai/sdk` to call Claude
  - Tool definitions: `ChatService` reads tool metadata from the NestJS DI container (via `@rekog/mcp-nest`'s metadata or a shared registry injected into `ChatModule`). Reads `_meta.ui.visibility` from each tool's decorator metadata. Filters to tools where visibility includes `'model'` or has no visibility (defaults to both). Excludes app-only tools from the LLM tool list. This avoids a loopback HTTP call to `/mcp`.
  - When Claude returns a `tool_use` block, execute the tool call locally via the MCP server and return the full conversation turn (assistant message + tool results) to the frontend
  - The response includes metadata about which tools were called and their `resourceUri` so the frontend knows when to render AppRenderer
  - API key configured via `ANTHROPIC_API_KEY` env var
  - `modelContext` from the request body (fed by `updateModelContext` from the iframe → frontend → chat request, completing R9's full loop) is injected as a system message suffix or user message prefix to give Claude awareness of what the user is currently viewing. Handle `modelContext: undefined` gracefully when no iframe has sent context yet.

  **Patterns to follow:**
  - Anthropic SDK tool use documentation for request/response format

  **Test scenarios:**
  - Happy path: Chat endpoint returns assistant message for a simple greeting
  - Happy path: When Claude calls `list_tasks`, the endpoint executes it and returns tool result with resourceUri metadata
  - Happy path: When Claude calls `summarize_tasks` (model-only), the result is included in the response but has no resourceUri
  - Edge case: Missing ANTHROPIC_API_KEY returns 500 with clear error
  - Integration: `modelContext` parameter influences Claude's response (e.g., "You are viewing task X" leads to contextual replies)

  **Verification:**
  - `POST /api/chat` with `{"messages": [{"role": "user", "content": "hello"}]}` returns an assistant response
  - Tool calls are executed and results returned in the response
  - App-only tools (`update_task`) are NOT included in the tool definitions sent to Claude

## System-Wide Impact

- **Interaction graph:** Chat endpoint → Anthropic API → tool execution → MCP server → task service. AppRenderer → MCP client → MCP server → task service. Both paths mutate the same in-memory store.
- **Error propagation:** Backend tool errors return MCP error content blocks. Chat proxy errors return HTTP 500. Frontend displays errors in the chat thread.
- **State lifecycle risks:** In-memory store is lost on server restart. No concurrent access concerns (single-user). Seed tasks re-created on each start.
- **API surface parity:** Chat endpoint and MCP protocol are two interfaces to the same tools. Model-only tools appear in chat but not in MCP `tools/list` for app-visibility-filtered clients. App-only tools appear in MCP but not in the chat proxy's Claude tool list.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `@rekog/mcp-nest` `_meta` passthrough may not work exactly as documented for ext-apps visibility schema | Test early in Unit 3. Fallback: access underlying `McpServer` instance and call `registerAppTool` from ext-apps SDK directly |
| AppRenderer `onFallbackRequest` may not intercept `ui/update-model-context` cleanly | Test early in Unit 7. Fallback: use `onMessage` for raw postMessage interception, or switch to AppBridge from ext-apps |
| Vite `singlefile` plugin may not bundle all React deps cleanly | Test early in Unit 4. Fallback: use a simpler bundler or hand-craft the HTML with inline scripts |
| Anthropic API rate limits during demo | Use caching or pre-seed conversation history for demo reliability |
| Cross-origin issues between frontend (5173), sandbox (8082), and backend (3001) | Configure CORS on backend, set appropriate sandbox referrer validation |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-09-mcp-native-task-manager-requirements.md](docs/brainstorms/2026-04-09-mcp-native-task-manager-requirements.md)
- ext-apps spec: https://modelcontextprotocol.io/extensions/apps/overview
- ext-apps SDK: https://github.com/modelcontextprotocol/ext-apps
- ext-apps API docs: https://modelcontextprotocol.github.io/ext-apps/api/
- @mcp-ui/client: https://github.com/idosal/mcp-ui
- @rekog/mcp-nest: https://github.com/rekog-labs/MCP-Nest
- MCP-UI Chat reference: https://github.com/idosal/scira-mcp-ui-chat
- assistant-ui: https://www.assistant-ui.com
