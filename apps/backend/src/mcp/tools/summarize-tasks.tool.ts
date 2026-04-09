import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { TasksService } from '../../tasks/tasks.service';

@Injectable()
export class SummarizeTasksTool {
  constructor(private readonly tasksService: TasksService) {}

  @Tool({
    name: 'summarize_tasks',
    description: 'Get a text summary of task counts by status and priority',
    _meta: {
      ui: {
        visibility: ['model'],
      },
    },
  })
  async handle() {
    const tasks = this.tasksService.findAll();
    const total = tasks.length;

    const statusCounts = { todo: 0, 'in-progress': 0, done: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0 };

    for (const task of tasks) {
      statusCounts[task.status]++;
      priorityCounts[task.priority]++;
    }

    const summary =
      `${total} tasks total: ${statusCounts.todo} todo, ${statusCounts['in-progress']} in-progress, ${statusCounts.done} done. ` +
      `Priority: ${priorityCounts.high} high, ${priorityCounts.medium} medium, ${priorityCounts.low} low.`;

    return {
      content: [{ type: 'text' as const, text: summary }],
    };
  }
}
