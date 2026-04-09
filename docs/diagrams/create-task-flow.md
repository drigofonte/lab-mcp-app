# Create Task Flow

How a task gets created through the MCP App — from user intent to persisted data.

The key insight: the LLM decides when it has enough information to call the `create_task` tool. Our code defines the required parameters (`title`, `description`), but the model exercises judgment about whether to ask for more info or call the tool immediately.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend<br/>(assistant-ui)
    participant B as Backend<br/>(NestJS)
    participant LLM as Ollama<br/>(qwen3.5:35b)
    participant MCP as MCP Tools

    Note over U,MCP: Scenario: User says "create a task"

    U->>F: "create a task"
    F->>B: POST /api/chat<br/>{messages: [{role: "user", content: "create a task"}]}
    B->>LLM: Chat completion with tools:<br/>list_tasks, get_task, create_task, summarize_tasks

    Note over LLM: LLM sees create_task requires:<br/>title (required), description (required)<br/>User didn't provide these → ask first

    LLM-->>B: {content: "Sure! What title and description?", tool_calls: []}
    B-->>F: {messages: [{role: "assistant", content: "Sure! What..."}], toolCalls: []}
    F-->>U: "Sure! What title and description?"

    Note over U,MCP: No tool was called → no MCP App rendered

    U->>F: "Fix login bug - the login page returns 500"
    F->>B: POST /api/chat<br/>{messages: [...history, {role: "user", content: "Fix login bug..."}]}
    B->>LLM: Chat completion with tools + full history

    Note over LLM: LLM now has enough info<br/>→ calls create_task tool

    LLM-->>B: {tool_calls: [{name: "create_task",<br/>args: {title: "Fix login bug",<br/>description: "The login page returns 500",<br/>status: "todo", priority: "medium"}}]}

    B->>MCP: Execute create_task (confirmed=false)
    MCP-->>B: {title: "Fix login bug", ..., confirmed: false}
    B->>LLM: Tool result: staged task data
    LLM-->>B: {content: "I've prepared the task for you to review"}

    B-->>F: {messages: [...], toolCalls: [{name: "create_task",<br/>resourceUri: "ui://tasks/create", result: ...}]}

    Note over F: Adapter returns tool-call content part<br/>→ assistant-ui Fallback renders InlineMcpApp<br/>→ AppRenderer loads ui://tasks/create

    F-->>U: Text: "I've prepared the task..."<br/>+ Inline MCP App: editable create form

    Note over U,MCP: User reviews and edits the form

    U->>F: Clicks "Create Task" in the MCP App iframe
    F->>MCP: callServerTool({name: "create_task",<br/>args: {..., confirmed: true}})
    MCP->>MCP: TasksService.create() → persists task
    MCP-->>F: {id: "abc-123", ..., confirmed: true}
    F-->>U: MCP App shows "Task Created ✓"

    U->>F: Clicks "View All Tasks"
    F->>MCP: callServerTool({name: "list_tasks"})
    MCP-->>F: Updated task list including new task
    F-->>U: MCP App switches to task list view
```

## Who controls what

| Decision | Who decides |
|----------|------------|
| Whether to ask for more info or call the tool immediately | The LLM |
| What parameters are required for the tool | Our tool definition (`required: ['title', 'description']`) |
| Whether to stage or persist the task | Our `create_task` handler (based on `confirmed` flag) |
| Whether to show the MCP App inline | assistant-ui's `tools.Fallback` (renders when tool-call content parts exist) |
| What the form looks like | The `task-create` MCP App view |
| Whether the task gets saved | The user clicking "Create Task" in the form |
