import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ToolCallMessagePartProps,
} from '@assistant-ui/react';
import { Thread, makeMarkdownText } from '@assistant-ui/react-ui';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { useCallback } from 'react';
import { InlineMcpApp } from './InlineMcpApp';

const MarkdownText = makeMarkdownText();

interface ChatThreadProps {
  adapter: ChatModelAdapter;
  mcpClient: Client | null;
  toolResourceMap: Map<string, string>;
  onModelContextUpdate: (ctx: string) => void;
}

export function ChatThread({ adapter, mcpClient, toolResourceMap, onModelContextUpdate }: ChatThreadProps) {
  const runtime = useLocalRuntime(adapter);

  const handleAppMessage = useCallback(
    (text: string) => {
      runtime.thread.append({
        role: 'user',
        content: [{ type: 'text', text }],
      });
    },
    [runtime],
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread
        welcome={{ message: 'Send a message to get started.' }}
        assistantMessage={{
          allowCopy: true,
          components: {
            Text: MarkdownText,
            ToolFallback: (props: ToolCallMessagePartProps) => (
              <InlineMcpApp
                toolName={props.toolName}
                args={props.args}
                result={props.result}
                addResult={props.addResult}
                mcpClient={mcpClient}
                toolResourceMap={toolResourceMap}
                onModelContextUpdate={onModelContextUpdate}
                onAppMessage={handleAppMessage}
              />
            ),
          },
        }}
        strings={{
          composer: {
            input: { placeholder: 'Ask about your tasks...' },
          },
        }}
      />
    </AssistantRuntimeProvider>
  );
}
