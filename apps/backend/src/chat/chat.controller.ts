import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  modelContext?: string;
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatRequestBody) {
    return this.chatService.chat(body.messages, body.modelContext);
  }
}
