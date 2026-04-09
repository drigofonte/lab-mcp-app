import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { TasksModule } from './tasks/tasks.module';
import { ChatModule } from './chat/chat.module';
import { TaskViewsResource } from './mcp/resources/task-views.resource';
import { ListTasksTool } from './mcp/tools/list-tasks.tool';
import { GetTaskTool } from './mcp/tools/get-task.tool';
import { CreateTaskTool } from './mcp/tools/create-task.tool';
import { UpdateTaskTool } from './mcp/tools/update-task.tool';
import { SummarizeTasksTool } from './mcp/tools/summarize-tasks.tool';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'mcp-task-manager',
      version: '1.0.0',
    }),
    TasksModule,
    ChatModule,
  ],
  providers: [
    TaskViewsResource,
    ListTasksTool,
    GetTaskTool,
    CreateTaskTool,
    UpdateTaskTool,
    SummarizeTasksTool,
  ],
})
export class AppModule {}
