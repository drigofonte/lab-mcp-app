import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TasksService } from '../../tasks/tasks.service';

@Injectable()
export class CreateTaskTool {
  constructor(private readonly tasksService: TasksService) {}

  @Tool({
    name: 'create_task',
    description:
      'Create a new task. When confirmed is false or omitted, returns a preview for the user to review. When confirmed is true, actually persists the task.',
    parameters: z.object({
      title: z.string().describe('The title of the task'),
      description: z.string().describe('A description of the task'),
      status: z
        .enum(['todo', 'in-progress', 'done'])
        .default('todo')
        .describe('The status of the task'),
      priority: z
        .enum(['low', 'medium', 'high'])
        .default('medium')
        .describe('The priority of the task'),
      confirmed: z
        .boolean()
        .default(false)
        .describe('Set to true to actually persist the task. The AI should always leave this false.'),
    }),
    _meta: {
      ui: {
        resourceUri: 'ui://tasks/create',
        visibility: ['model', 'app'],
      },
    },
  })
  async handle(params: {
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    confirmed: boolean;
  }) {
    if (params.confirmed) {
      // Actually persist the task
      const task = this.tasksService.create({
        title: params.title,
        description: params.description,
        status: params.status,
        priority: params.priority,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ ...task, confirmed: true }) }],
      };
    }

    // Stage only — return proposed data for review without persisting
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            title: params.title,
            description: params.description,
            status: params.status,
            priority: params.priority,
            confirmed: false,
          }),
        },
      ],
    };
  }
}
