import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
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

/** Tool metadata used to build OpenAI-compatible tool definitions and execute calls. */
interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  resourceUri?: string;
  visibility: string[];
}

@Injectable()
export class ChatService {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly modelVisibleTools: ToolDef[];

  constructor(private readonly tasksService: TasksService) {
    this.client = new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      apiKey: 'ollama', // Ollama doesn't need a real key
    });

    this.model = process.env.OLLAMA_MODEL || 'qwen3.5:35b';

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
      'Always respond concisely.',
    ];

    if (modelContext) {
      systemParts.push(`The user is currently viewing: ${modelContext}`);
    }

    const tools: OpenAI.ChatCompletionTool[] = this.modelVisibleTools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));

    const allToolCalls: ToolCallRecord[] = [];
    const conversationMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemParts.join('\n\n') },
      ...messages.map(
        (m): OpenAI.ChatCompletionMessageParam => ({
          role: m.role,
          content: m.content,
        }),
      ),
    ];

    // Agentic loop: keep calling the model until it stops using tools.
    const MAX_ITERATIONS = 10;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: conversationMessages,
        tools,
      });

      const choice = response.choices[0];
      if (!choice) {
        return {
          messages: [{ role: 'assistant', content: 'No response from model.' }],
          toolCalls: allToolCalls,
        };
      }

      const assistantMessage = choice.message;

      // Add assistant message to conversation history
      conversationMessages.push(assistantMessage);

      // Check for tool calls
      const toolCallBlocks = assistantMessage.tool_calls || [];

      if (toolCallBlocks.length === 0) {
        // No tool calls — return the text response
        return {
          messages: [{ role: 'assistant', content: assistantMessage.content || '' }],
          toolCalls: allToolCalls,
        };
      }

      // Execute each tool call and build tool result messages
      console.log(`[ChatService] Model called ${toolCallBlocks.length} tool(s):`, toolCallBlocks.map(tc => tc.type === 'function' ? tc.function.name : tc.type));
      for (const toolCall of toolCallBlocks) {
        if (toolCall.type !== 'function') continue;
        const fnName = toolCall.function.name;
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          input = {};
        }

        const toolDef = this.modelVisibleTools.find((t) => t.name === fnName);
        let resultText: string;

        try {
          const result = await this.executeTool(fnName, input);
          resultText = typeof result === 'string' ? result : JSON.stringify(result);
        } catch (err) {
          resultText = `Error executing tool: ${(err as Error).message}`;
        }

        allToolCalls.push({
          name: fnName,
          resourceUri: toolDef?.resourceUri,
          input,
          result: resultText,
        });

        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: resultText,
        });
      }
    }

    // Safety: if we hit max iterations, return what we have.
    return {
      messages: [
        {
          role: 'assistant',
          content: 'I was unable to complete the request within the allowed number of steps.',
        },
      ],
      toolCalls: allToolCalls,
    };
  }

  /** Execute a tool by name against the TasksService directly. */
  private async executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'list_tasks':
        return this.tasksService.findAll();

      case 'get_task': {
        const task = this.tasksService.findOne(input.taskId as string);
        if (!task) throw new Error(`Task with id "${input.taskId}" not found`);
        return task;
      }

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
