import type {
  ChatModelAdapter,
  ChatModelRunOptions,
  ChatModelRunResult,
} from '@assistant-ui/react';
import type { ChatMessage, ChatResponse, ToolCallRecord } from '../types';

/**
 * Callback invoked when the backend returns tool calls with resourceUris,
 * so the App shell can update the MCP App panel.
 */
export type OnToolCallsReceived = (toolCalls: ToolCallRecord[]) => void;

/**
 * ChatModelAdapter that proxies to the NestJS backend POST /api/chat endpoint.
 * The backend runs the agentic tool-use loop and returns the final assistant
 * message plus all tool calls that were executed.
 */
export function createChatAdapter(opts: {
  getModelContext: () => string | undefined;
  onToolCalls: OnToolCallsReceived;
}): ChatModelAdapter {
  return {
    async run({ messages, abortSignal }: ChatModelRunOptions): Promise<ChatModelRunResult> {
      // Convert assistant-ui ThreadMessage[] to the simple {role, content} format
      // expected by the backend ChatController.
      const converted: ChatMessage[] = [];
      for (const msg of messages) {
        if (msg.role === 'user') {
          const textParts = msg.content
            .filter((p) => p.type === 'text')
            .map((p) => (p as { type: 'text'; text: string }).text);
          if (textParts.length > 0) {
            converted.push({ role: 'user', content: textParts.join('\n') });
          }
        } else if (msg.role === 'assistant') {
          const textParts = msg.content
            .filter((p) => p.type === 'text')
            .map((p) => (p as { type: 'text'; text: string }).text);
          if (textParts.length > 0) {
            converted.push({ role: 'assistant', content: textParts.join('\n') });
          }
        }
      }

      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: converted,
          modelContext: opts.getModelContext(),
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      // Notify the app about tool calls (so it can update the MCP App panel).
      if (data.toolCalls && data.toolCalls.length > 0) {
        opts.onToolCalls(data.toolCalls);
      }

      // Return assistant text as content for assistant-ui.
      const assistantText = data.messages
        .filter((m) => m.role === 'assistant')
        .map((m) => m.content)
        .join('\n');

      return {
        content: [{ type: 'text' as const, text: assistantText || 'Done.' }],
      };
    },
  };
}
