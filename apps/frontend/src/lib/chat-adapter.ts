import type {
  ChatModelAdapter,
  ChatModelRunOptions,
  ChatModelRunResult,
} from '@assistant-ui/react';
import type { ChatMessage, ChatResponse } from '../types';

/**
 * ChatModelAdapter that proxies to the NestJS backend POST /api/chat endpoint.
 * The backend runs the agentic tool-use loop and returns the final assistant
 * message plus all tool calls that were executed.
 *
 * Tool calls with a resourceUri are returned as tool-call content parts so
 * assistant-ui can render them inline via the tools.Fallback component.
 */
export function createChatAdapter(opts: {
  getModelContext: () => string | undefined;
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

      // Build content parts: tool-call parts first, then text.
      const content: ChatModelRunResult['content'] = [];

      // Add tool-call parts for MCP App tools (those with a resourceUri).
      if (data.toolCalls) {
        for (const tc of data.toolCalls) {
          if (tc.resourceUri) {
            content.push({
              type: 'tool-call' as const,
              toolCallId: `tc-${Date.now()}-${tc.name}`,
              toolName: tc.name,
              args: tc.input,
              argsText: JSON.stringify(tc.input),
              result: {
                text: typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result),
                resourceUri: tc.resourceUri,
              },
            });
          }
        }
      }

      // Add text response.
      const assistantText = data.messages
        .filter((m) => m.role === 'assistant')
        .map((m) => m.content)
        .join('\n');

      if (assistantText) {
        content.push({ type: 'text' as const, text: assistantText });
      }

      // Ensure we always return at least one content part.
      if (content.length === 0) {
        content.push({ type: 'text' as const, text: 'Done.' });
      }

      console.log('[ChatAdapter] Returning content parts:', content.map(c => ({ type: c.type, ...(c.type === 'tool-call' ? { toolName: (c as any).toolName } : {}) })));
      return { content };
    },
  };
}
