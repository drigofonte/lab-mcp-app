import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { TasksService } from '../tasks/tasks.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCallRecord {
  name: string;
  resourceUri?: string;
  input: Record<string, unknown>;
  result: unknown;
}

export interface ChatResponse {
  messages: ChatMessage[];
  toolCalls: ToolCallRecord[];
}

/** Tool metadata used to build Anthropic tool definitions and execute calls. */
interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  resourceUri?: string;
  visibility: string[];
}

@Injectable()
export class ChatService {
  private readonly anthropic: Anthropic;
  private readonly modelVisibleTools: ToolDef[];

  constructor(private readonly tasksService: TasksService) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Define tool metadata matching Unit 3 tool registrations.
    // Only model-visible tools are included (visibility includes 'model').
    this.modelVisibleTools = [
      {
        name: 'list_tasks',
        description: 'List all tasks',
        input_schema: { type: 'object', properties: {}, required: [] },
        resourceUri: 'ui://tasks/list',
        visibility: ['model', 'app'],
      },
      {
        name: 'get_task',
        description: 'Get a single task by its ID',
        input_schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'The unique identifier of the task' },
          },
          required: ['taskId'],
        },
        resourceUri: 'ui://tasks/detail',
        visibility: ['model', 'app'],
      },
      {
        name: 'create_task',
        description: 'Create a new task',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The title of the task' },
            description: { type: 'string', description: 'A description of the task' },
            status: {
              type: 'string',
              enum: ['todo', 'in-progress', 'done'],
              description: 'The status of the task',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'The priority of the task',
            },
          },
          required: ['title', 'description'],
        },
        resourceUri: 'ui://tasks/create',
        visibility: ['model', 'app'],
      },
      {
        name: 'summarize_tasks',
        description: 'Get a text summary of task counts by status and priority',
        input_schema: { type: 'object', properties: {}, required: [] },
        resourceUri: undefined,
        visibility: ['model'],
      },
      // update_task is app-only (visibility: ['app']), so it is excluded.
    ];
  }

  /** Return tool definitions visible to the model. */
  getModelToolDefs(): ToolDef[] {
    return this.modelVisibleTools;
  }

  async chat(messages: ChatMessage[], modelContext?: string): Promise<ChatResponse> {
    const systemParts: string[] = [
      'You are an assistant for a task management application. You can list tasks, get task details, create tasks, and summarize tasks using the provided tools.',
      'When the user asks about tasks, use the available tools to fetch or modify data rather than guessing.',
    ];

    if (modelContext) {
      systemParts.push(`The user is currently viewing: ${modelContext}`);
    }

    const tools: Anthropic.Messages.Tool[] = this.modelVisibleTools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Messages.Tool['input_schema'],
    }));

    const allToolCalls: ToolCallRecord[] = [];
    const conversationMessages: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Agentic loop: keep calling the model until it stops using tools.
    const MAX_ITERATIONS = 10;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        system: systemParts.join('\n\n'),
        messages: conversationMessages,
        tools,
      });

      // Collect assistant content blocks.
      conversationMessages.push({ role: 'assistant', content: response.content });

      // Check if any tool_use blocks exist.
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
      );

      if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
        // No tool calls — extract final text and return.
        const textBlocks = response.content.filter(
          (block): block is Anthropic.Messages.TextBlock => block.type === 'text',
        );
        const assistantText = textBlocks.map((b) => b.text).join('\n');

        return {
          messages: [{ role: 'assistant', content: assistantText }],
          toolCalls: allToolCalls,
        };
      }

      // Execute each tool call and build tool_result messages.
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const input = toolUse.input as Record<string, unknown>;
        const toolDef = this.modelVisibleTools.find((t) => t.name === toolUse.name);
        let resultText: string;

        try {
          const result = await this.executeTool(toolUse.name, input);
          resultText = typeof result === 'string' ? result : JSON.stringify(result);
        } catch (err) {
          resultText = `Error executing tool: ${(err as Error).message}`;
        }

        allToolCalls.push({
          name: toolUse.name,
          resourceUri: toolDef?.resourceUri,
          input,
          result: resultText,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: resultText,
        });
      }

      conversationMessages.push({ role: 'user', content: toolResults });
    }

    // Safety: if we hit max iterations, return what we have.
    return {
      messages: [{ role: 'assistant', content: 'I was unable to complete the request within the allowed number of steps.' }],
      toolCalls: allToolCalls,
    };
  }

  /** Execute a tool by name against the TasksService directly. */
  private async executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'list_tasks':
        return this.tasksService.findAll();

      case 'get_task':
        const task = this.tasksService.findOne(input.taskId as string);
        if (!task) throw new Error(`Task with id "${input.taskId}" not found`);
        return task;

      case 'create_task':
        return this.tasksService.create({
          title: input.title as string,
          description: (input.description as string) || '',
          status: (input.status as 'todo' | 'in-progress' | 'done') || 'todo',
          priority: (input.priority as 'low' | 'medium' | 'high') || 'medium',
        });

      case 'summarize_tasks': {
        const tasks = this.tasksService.findAll();
        const total = tasks.length;
        const statusCounts = { todo: 0, 'in-progress': 0, done: 0 };
        const priorityCounts = { low: 0, medium: 0, high: 0 };
        for (const t of tasks) {
          statusCounts[t.status]++;
          priorityCounts[t.priority]++;
        }
        return (
          `${total} tasks total: ${statusCounts.todo} todo, ${statusCounts['in-progress']} in-progress, ${statusCounts.done} done. ` +
          `Priority: ${priorityCounts.high} high, ${priorityCounts.medium} medium, ${priorityCounts.low} low.`
        );
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
