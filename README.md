# MCP App Lab — Task Manager

A hands-on learning project that demonstrates the [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) standard (SEP-1865) through a working task manager. Built for developers evaluating what MCP Apps can do and how they differ from traditional web apps.

## What This Demonstrates

### MCP App Concepts

| Concept | How it's demonstrated |
|---------|----------------------|
| **Tool visibility modes** | 5 tools with all three modes: `list_tasks` and `get_task` (model + app), `update_task` (app-only — AI can't call it), `summarize_tasks` (model-only — no UI renders) |
| **`ui://` resource routing** | 3 distinct views (`ui://tasks/list`, `ui://tasks/detail`, `ui://tasks/create`) served as bundled HTML from a single MCP server. The AI navigates between them by calling different tools. |
| **Bidirectional context (`updateModelContext`)** | The task list sends a detailed summary to the AI (task names, statuses, counts). Ask "what am I looking at?" and the AI knows without you telling it. |
| **App-to-conversation messaging (`sendMessage`)** | Clicking a task title in the list posts a message to the chat ("Show me details for 'Fix login bug'"). The AI responds naturally with the detail view. |
| **Stage-then-confirm workflow** | Creating a task shows an editable review form before persisting. The AI proposes, the user reviews and modifies, then confirms — demonstrating bidirectional tool orchestration. |
| **Stateless UI / server-side state** | All state lives in the NestJS backend. MCP App views rehydrate from scratch on every mount — no localStorage, no session storage. |
| **Sandboxed iframe isolation** | Views run in a double-iframe sandbox (sandbox proxy on a separate origin) with CSP restrictions — the standard MCP Apps security model. |
| **Inline rendering in conversation** | MCP Apps appear inline within assistant messages using assistant-ui's `tools.Fallback` system, not in a side panel. |

### What the AI Can and Can't Do

| Action | Who can do it |
|--------|--------------|
| List tasks | AI and UI |
| View task details | AI and UI |
| Create a task | AI proposes, user confirms in UI |
| Update task status/priority | UI only (app-only tool — AI is blind to it) |
| Summarize workload | AI only (model-only tool — no UI renders) |

## Architecture

```
Frontend (React + Vite, port 5173)
├── assistant-ui chat with shadcn dark zinc theme
├── @mcp-ui/client AppRenderer for inline MCP Apps
└── MCP Client (Streamable HTTP → backend)

Backend (NestJS, port 3001)
├── MCP Server (@rekog/mcp-nest)
│   ├── 5 MCP tools with visibility metadata
│   └── 3 ui:// resources (bundled HTML views)
├── Task Service (in-memory store + seed data)
└── Chat Proxy (POST /api/chat → Ollama)

MCP App Views (React, bundled as single HTML files)
├── task-list.html  → ui://tasks/list
├── task-detail.html → ui://tasks/detail
└── task-create.html → ui://tasks/create

Sandbox Proxy (Express, port 8082)
└── Iframe origin isolation for MCP App security
```

## Tech Stack

- **Frontend:** React 19, [assistant-ui](https://www.assistant-ui.com) (chat + styled components), [@mcp-ui/client](https://github.com/idosal/mcp-ui) (MCP App rendering)
- **Backend:** NestJS 11, [@rekog/mcp-nest](https://github.com/rekog-labs/MCP-Nest) (MCP server), OpenAI SDK (Ollama-compatible)
- **MCP App Views:** React 19, [@modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps) (App class, useApp hook)
- **LLM:** Local Ollama (qwen3 by default, configurable)
- **Monorepo:** pnpm workspaces

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v9+
- [Ollama](https://ollama.com/) running locally with a model that supports tool calling

Pull a model if you haven't:

```bash
ollama pull qwen3:30b
# or: ollama pull qwen3.5:35b, llama3.3:70b
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Build the MCP App views (required before first run)
pnpm --filter mcp-views build

# Start all services (backend, frontend, sandbox proxy)
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

### Configuration

The backend reads from environment variables (create `apps/backend/.env` if needed):

```env
OLLAMA_BASE_URL=http://localhost:11434/v1   # default
OLLAMA_MODEL=qwen3:30b                      # default
```

## Demo Script (~5 minutes)

1. **First impression** — Open the app. Ask "show me my tasks". The task list renders inline in the chat with seed data.

2. **AI sees the UI** — Ask "what am I looking at?". The AI references specific task names and counts from the current view (via `updateModelContext`).

3. **App drives conversation** — Click a task title in the list. A message appears in the chat and the AI responds with the detail view.

4. **Create from conversation** — Ask "create a task to write unit tests, high priority". An editable review form appears. Modify fields if needed, then click "Create Task".

5. **Model-only tool** — Ask "what's my workload looking like?". The AI calls `summarize_tasks` (model-only) and reasons about it — no UI renders.

6. **App-only tool** — In the detail view, change a task's status and click "Save Changes". The `update_task` tool is app-only — the AI never sees it.

7. **Stateless UI** — Refresh the page. The UI rehydrates from server state — no localStorage, no session.

## Project Structure

```
lab-mcp-app/
├── apps/
│   ├── backend/          # NestJS MCP server + chat proxy
│   │   └── src/
│   │       ├── tasks/    # In-memory CRUD service + seed data
│   │       ├── mcp/      # Tool + resource registration
│   │       └── chat/     # POST /api/chat → Ollama
│   ├── frontend/         # React chat UI + MCP App host
│   │   └── src/
│   │       ├── components/  # ChatThread, InlineMcpApp
│   │       ├── hooks/       # useMcpClient
│   │       └── lib/         # ChatModelAdapter
│   └── mcp-views/        # MCP App views (iframe content)
│       └── src/
│           ├── shared/      # Theme + App setup
│           ├─��� task-list/   # List with refresh, click-to-chat
│           ├── task-detail/ # Edit status/priority + save
│           └── task-create/ # Review form + confirm
├── sandbox/              # Iframe sandbox proxy (port 8082)
├── docs/
│   ├── brainstorms/      # Requirements documents
│   ├── diagrams/         # Flow diagrams (Mermaid)
│   ├── ideation/         # Initial ideation
│   └── plans/            # Implementation plans
└── pnpm-workspace.yaml
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/backend/src/mcp/tools/*.tool.ts` | MCP tool definitions with `_meta.ui.visibility` and `resourceUri` |
| `apps/backend/src/mcp/resources/task-views.resource.ts` | `ui://` resource registration serving bundled HTML |
| `apps/backend/src/chat/chat.service.ts` | Agentic loop: Ollama → tool execution → response |
| `apps/frontend/src/components/ChatThread.tsx` | assistant-ui Thread with tool Fallback for MCP Apps |
| `apps/frontend/src/components/InlineMcpApp.tsx` | AppRenderer wrapper handling context updates + messages |
| `apps/mcp-views/src/task-list/App.tsx` | Task list with `updateModelContext` + `sendMessage` |
| `apps/mcp-views/src/shared/theme.ts` | Shared shadcn light zinc design tokens |
| `sandbox/sandbox.html` | Double-iframe sandbox proxy for MCP App isolation |
| `docs/diagrams/create-task-flow.md` | Sequence diagram of the full create task lifecycle |

## References

- [MCP Apps Specification (SEP-1865)](https://modelcontextprotocol.io/extensions/apps/overview)
- [ext-apps SDK](https://github.com/modelcontextprotocol/ext-apps)
- [@mcp-ui/client](https://github.com/idosal/mcp-ui)
- [@rekog/mcp-nest](https://github.com/rekog-labs/MCP-Nest)
- [assistant-ui](https://www.assistant-ui.com)
