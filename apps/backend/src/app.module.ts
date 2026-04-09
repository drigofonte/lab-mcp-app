import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { TasksModule } from './tasks/tasks.module';
import { McpToolsModule } from './mcp/mcp.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'mcp-task-manager',
      version: '1.0.0',
    }),
    TasksModule,
    McpToolsModule,
    ChatModule,
  ],
})
export class AppModule {}
