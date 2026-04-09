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

export interface ActiveToolCall {
  name: string;
  input: Record<string, unknown>;
  result: { content: Array<{ type: 'text'; text: string }> };
  resourceUri?: string;
}
