import { useCallback, useMemo, useRef, useState } from 'react';
import { ChatThread } from './components/ChatThread';
import { InlineAppEmbed } from './components/InlineAppEmbed';
import { createChatAdapter } from './lib/chat-adapter';
import { useMcpClient } from './hooks/useMcpClient';
import type { ActiveToolCall, ToolCallRecord } from './types';

export function App() {
  const { client: mcpClient } = useMcpClient();
  const [activeToolCall, setActiveToolCall] = useState<ActiveToolCall | null>(null);
  const modelContextRef = useRef<string | undefined>(undefined);

  const handleModelContextUpdate = useCallback((context: string) => {
    modelContextRef.current = context;
  }, []);

  const handleToolCalls = useCallback((toolCalls: ToolCallRecord[]) => {
    const withUri = toolCalls.filter((tc) => tc.resourceUri);
    if (withUri.length > 0) {
      const last = withUri[withUri.length - 1];
      setActiveToolCall({
        name: last.name,
        input: last.input,
        result: {
          content: [
            {
              type: 'text',
              text: typeof last.result === 'string' ? last.result : JSON.stringify(last.result),
            },
          ],
        },
        resourceUri: last.resourceUri,
        _key: Date.now(),
      });
    }
  }, []);

  const handleToolCallUpdate = useCallback((toolCall: ActiveToolCall) => {
    setActiveToolCall(toolCall);
  }, []);

  const adapter = useMemo(
    () =>
      createChatAdapter({
        getModelContext: () => modelContextRef.current,
        onToolCalls: handleToolCalls,
      }),
    [handleToolCalls],
  );

  const appEmbed =
    activeToolCall && mcpClient ? (
      <InlineAppEmbed
        activeToolCall={activeToolCall}
        mcpClient={mcpClient}
        onModelContextUpdate={handleModelContextUpdate}
        onToolCallUpdate={handleToolCallUpdate}
      />
    ) : null;

  return (
    <div className="chat-container">
      <div className="chat-header">MCP Task Manager</div>
      <ChatThread adapter={adapter} appEmbed={appEmbed} />
    </div>
  );
}
