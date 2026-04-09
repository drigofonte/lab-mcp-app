import { useCallback, useMemo, useRef } from 'react';
import { ChatThread } from './components/ChatThread';
import { createChatAdapter } from './lib/chat-adapter';
import { useMcpClient } from './hooks/useMcpClient';

export function App() {
  const { client: mcpClient, tools } = useMcpClient();
  const modelContextRef = useRef<string | undefined>(undefined);

  const handleModelContextUpdate = useCallback((context: string) => {
    modelContextRef.current = context;
  }, []);

  const adapter = useMemo(
    () =>
      createChatAdapter({
        getModelContext: () => modelContextRef.current,
      }),
    [],
  );

  const toolResourceMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tools) {
      if (t.resourceUri) map.set(t.name, t.resourceUri);
    }
    return map;
  }, [tools]);

  return (
    <ChatThread
      adapter={adapter}
      mcpClient={mcpClient}
      toolResourceMap={toolResourceMap}
      onModelContextUpdate={handleModelContextUpdate}
    />
  );
}
