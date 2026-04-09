---
date: 2026-04-09
topic: mcp-app-learning-project
focus: MCP App standard learning project with React assistant-ui frontend and NestJS backend in a monorepo
---

# Ideation: MCP App Learning Project

## Codebase Context

- **Project shape:** Empty git repository — greenfield project
- **Intended stack:** React (assistant-ui) frontend + NestJS backend in a monorepo
- **Goal:** Understand MCP App standard in practice — how apps reach users, CRUD capabilities, and limitations
- **MCP Apps:** Extension to MCP Servers (SEP-1865, stable 2026-01-26) adding interactive HTML UI in sandboxed iframes inside AI conversations. Key primitives: `ui://` resources, bidirectional JSON-RPC over postMessage, tool visibility (model/app/both), CSP sandbox, `updateModelContext`, server-side state
- **Available SDKs:** `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/sdk`, `@rekog/mcp-nest` or `@bamada/nestjs-mcp` for NestJS, `@mcp-ui/client` for assistant-ui
- **Past learnings:** None — new repository

## Ranked Ideas

### 1. The MCP-Native Task Manager (SYNTHESIS)
**Description:** A task/project manager with zero navigation chrome. AI routes between views by switching `ui://` resources. Tasks are created from natural language (AI fills a structured form, user reviews). The current view auto-injects into model context via `updateModelContext`. Tools have deliberate visibility splits: `create_task` is model+app, `get_analytics` is model-only, `render_detail_view` is app-only. State lives server-side in NestJS; the React UI rehydrates from scratch on each mount.
**Rationale:** Covers CRUD (tasks), distribution (resource URI routing, cross-host compatibility), and limitations (no persistence, sandbox constraints, visibility boundaries) in a single coherent project. Maximum MCP concept density per line of code.
**Downsides:** More ambitious than a single-concept demo. Risk of scope creep if not disciplined (~5 tools, 2-3 UI resources).
**Confidence:** 85%
**Complexity:** Medium
**Status:** Explored

### 2. Tool Visibility Debugger
**Description:** A transparent inspector app where the same MCP server exposes tools in three modes (model-only, app-only, both). The UI renders a live matrix of which tools each actor can call, updated in real time.
**Rationale:** Both critique agents rate top-tier. Tool visibility is the most misunderstood MCP concept.
**Downsides:** Light on CRUD. Diagnostic tool, not an application.
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 3. Resource URI Router — One Server, Many Apps
**Description:** A single NestJS server serving multiple distinct `ui://` resource URIs, each rendering a different React component. The model selects which "app" to show by calling tools with different `_meta.ui.resourceUri` values.
**Rationale:** Teaches that `ui://` URIs are routing keys. Shows how one server can be a library of micro-apps.
**Downsides:** Individual micro-apps may be shallow.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 4. The Amnesiac Journal
**Description:** A journaling app with no session persistence. Every mount fetches entries from NestJS server. UX designed around stateless rehydration as the happy path.
**Rationale:** Makes the "no persistence" limitation visceral. Clean CRUD model.
**Downsides:** Narrow focus on one limitation.
**Confidence:** 80%
**Complexity:** Low
**Status:** Unexplored

### 5. Context-Injecting Dashboard
**Description:** A dashboard where UI interactions automatically call `updateModelContext` so the model always knows what the user sees.
**Rationale:** `updateModelContext` is the most powerful MCP App primitive for human-AI collaboration.
**Downsides:** Dashboard domain could distract.
**Confidence:** 80%
**Complexity:** Medium
**Status:** Unexplored

### 6. CSP Collision Playground
**Description:** Embedded editor that deliberately violates CSP to show sandbox restrictions via a "Why This Broke" panel.
**Rationale:** Sandbox/CSP model is hardest constraint for web developers to internalize.
**Downsides:** Narrow; host-dependent.
**Confidence:** 75%
**Complexity:** Low
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Live Form Builder | Domain (drag-and-drop) overshadows MCP learning |
| 2 | Shopping Cart That Isn't | One-trick pony; weak vehicle for a real lesson |
| 3 | AI-Driven Kanban | Distributed state conflict resolution dominates |
| 4 | Annotation Layer | DOM overlay mechanics dominate |
| 5 | Decision Tree Navigator | Flowchart rendering is the hard part |
| 6 | Structured Prompt Workbench | Works identically as standalone app |
| 7 | Negotiation Simulator | Pure LLM roleplay; MCP not load-bearing |
| 8 | Dependency Debt Mapper | Building a product, not learning MCP |
| 9 | Research Synthesis Canvas | Standard LLM call pattern |
| 10 | Budget Allocation Sliders | updateModelContext identical to useState + API |
| 11 | Decision Log Without Logger | Just a chat thread |
| 12 | The Living Spec | Building a collaborative editor |
| 13 | Cross-Host Behavior Diff | QA exercise requiring multiple hosts |
| 14 | Undo as Conversation Turn | Niche; weaker duplicate |
| 15 | Stateless Whiteboard | Drawing mechanics dominate |
| 16 | Honest CRUD App | Audit trail is normal logging |
| 17 | Permission Roulette | Too narrow; absorbed by CSP Playground |
| 18 | Themeless App | One-trick; no CRUD |
| 19 | Network-Free Data Explorer | Single constraint; absorbed by others |
| 20 | LLM-Negotiated Form | Weaker duplicate of Disappearing Form |
| 21 | Personal Finance Tracker | Domain dominates |
| 22-28 | Various | Products wearing MCP clothing |

## Session Log
- 2026-04-09: Initial ideation — 35 candidates generated across 5 frames, 6 survived adversarial filtering. User selected #1 (MCP-Native Task Manager) for brainstorming first, with #3 and #5 queued.
