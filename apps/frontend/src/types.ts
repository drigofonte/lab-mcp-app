export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCallRecord {
  name: string;
  resourceUri?: string;
  input: Record<string, unknown>;
  result: unknown;
}

export interface ChatResponse {
  messages: ChatMessage[];
  toolCalls: ToolCallRecord[];
}
