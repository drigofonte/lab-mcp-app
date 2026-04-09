import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { TasksService } from '../../tasks/tasks.service';

@Injectable()
export class ListTasksTool {
  constructor(private readonly tasksService: TasksService) {}

  @Tool({
    name: 'list_tasks',
    description: 'List all tasks',
    _meta: {
      ui: {
        resourceUri: 'ui://tasks/list',
        visibility: ['model', 'app'],
      },
    },
  })
  async handle() {
    const tasks = this.tasksService.findAll();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(tasks) }],
    };
  }
}
