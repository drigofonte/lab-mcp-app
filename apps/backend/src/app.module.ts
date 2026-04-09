import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'mcp-task-manager',
      version: '1.0.0',
    }),
    TasksModule,
  ],
})
export class AppModule {}
