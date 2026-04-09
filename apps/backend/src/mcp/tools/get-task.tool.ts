import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TasksService } from '../../tasks/tasks.service';

@Injectable()
export class GetTaskTool {
  constructor(private readonly tasksService: TasksService) {}

  @Tool({
    name: 'get_task',
    description: 'Get a single task by its ID',
    parameters: z.object({
      taskId: z.string().describe('The unique identifier of the task'),
    }),
    _meta: {
      ui: {
        resourceUri: 'ui://tasks/detail',
        visibility: ['model', 'app'],
      },
    },
  })
  async handle({ taskId }: { taskId: string }) {
    const task = this.tasksService.findOne(taskId);
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
