import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TasksService } from '../../tasks/tasks.service';

@Injectable()
export class CreateTaskTool {
  constructor(private readonly tasksService: TasksService) {}

  @Tool({
    name: 'create_task',
    description: 'Create a new task',
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
  }) {
    const task = this.tasksService.create(params);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(task) }],
    };
  }
}
