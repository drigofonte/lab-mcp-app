import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TasksService } from '../../tasks/tasks.service';

@Injectable()
export class UpdateTaskTool {
  constructor(private readonly tasksService: TasksService) {}

  @Tool({
    name: 'update_task',
    description: 'Update an existing task status or priority',
    parameters: z.object({
      taskId: z.string().describe('The unique identifier of the task'),
      status: z
        .enum(['todo', 'in-progress', 'done'])
        .optional()
        .describe('The new status of the task'),
      priority: z
        .enum(['low', 'medium', 'high'])
        .optional()
        .describe('The new priority of the task'),
    }),
    _meta: {
      ui: {
        resourceUri: 'ui://tasks/detail',
        visibility: ['app'],
      },
    },
  })
  async handle(params: {
    taskId: string;
    status?: 'todo' | 'in-progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
  }) {
    const { taskId, ...updates } = params;
    const task = this.tasksService.update(taskId, updates);
    if (!task) {
      return {
        content: [{ type: 'text' as const, text: `Error: Task with id "${taskId}" not found` }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(task) }],
    };
  }
}
