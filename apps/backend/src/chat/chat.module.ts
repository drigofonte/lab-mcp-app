import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [TasksModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
