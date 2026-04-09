import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { TaskViewsResource } from './resources/task-views.resource';
import { ListTasksTool } from './tools/list-tasks.tool';
import { GetTaskTool } from './tools/get-task.tool';
import { CreateTaskTool } from './tools/create-task.tool';
import { UpdateTaskTool } from './tools/update-task.tool';
import { SummarizeTasksTool } from './tools/summarize-tasks.tool';

@Module({
  imports: [TasksModule],
  providers: [
    TaskViewsResource,
    ListTasksTool,
    GetTaskTool,
    CreateTaskTool,
    UpdateTaskTool,
    SummarizeTasksTool,
  ],
})
export class McpToolsModule {}
