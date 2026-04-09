import { useCallback, useMemo, useRef, useState } from 'react';
import { ChatThread } from './components/ChatThread';
import { McpAppPanel } from './components/McpAppPanel';
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
    // Find the last tool call with a resourceUri to display in the panel.
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
      });
    }
  }, []);

  const handleToolCallSwitch = useCallback((toolCall: ActiveToolCall) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header
        style={{
          height: 48,
          background: '#1e293b',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 20,
          paddingRight: 20,
          fontSize: 16,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        MCP Task Manager
      </header>

      {/* Main panels */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left: Chat */}
        <div
          style={{
            width: '40%',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <ChatThread adapter={adapter} />
        </div>

        {/* Right: MCP App Panel */}
        <div
          style={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: '#fafbfc',
          }}
        >
          <McpAppPanel
            activeToolCall={activeToolCall}
            mcpClient={mcpClient}
            onModelContextUpdate={handleModelContextUpdate}
            onToolCallSwitch={handleToolCallSwitch}
          />
        </div>
      </div>
    </div>
  );
}
