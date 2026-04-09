import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  type ChatModelAdapter,
} from '@assistant-ui/react';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InlineMcpApp } from './InlineMcpApp';

interface ChatThreadProps {
  adapter: ChatModelAdapter;
  mcpClient: Client | null;
  toolResourceMap: Map<string, string>;
  onModelContextUpdate: (ctx: string) => void;
}

export function ChatThread({ adapter, mcpClient, toolResourceMap, onModelContextUpdate }: ChatThreadProps) {
  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadContent
        mcpClient={mcpClient}
        toolResourceMap={toolResourceMap}
        onModelContextUpdate={onModelContextUpdate}
      />
    </AssistantRuntimeProvider>
  );
}

function ThreadContent({
  mcpClient,
  toolResourceMap,
  onModelContextUpdate,
}: {
  mcpClient: Client | null;
  toolResourceMap: Map<string, string>;
  onModelContextUpdate: (ctx: string) => void;
}) {
  return (
    <ThreadPrimitive.Root style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <ThreadPrimitive.Viewport className="messages-viewport">
        <ThreadPrimitive.Empty>
          <div className="empty-state">Send a message to get started.</div>
        </ThreadPrimitive.Empty>
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage: () => (
              <AssistantMessage
                mcpClient={mcpClient}
                toolResourceMap={toolResourceMap}
                onModelContextUpdate={onModelContextUpdate}
              />
            ),
          }}
        />
      </ThreadPrimitive.Viewport>
      <Composer />
    </ThreadPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="message-user">
      <div className="message-user-bubble">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage({
  mcpClient,
  toolResourceMap,
  onModelContextUpdate,
}: {
  mcpClient: Client | null;
  toolResourceMap: Map<string, string>;
  onModelContextUpdate: (ctx: string) => void;
}) {
  return (
    <MessagePrimitive.Root className="message-assistant">
      <div className="message-assistant-bubble">
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => <span>{text}</span>,
            tools: {
              Fallback: (props) => (
                <InlineMcpApp
                  toolName={props.toolName}
                  args={props.args}
                  result={props.result}
                  addResult={props.addResult}
                  mcpClient={mcpClient}
                  toolResourceMap={toolResourceMap}
                  onModelContextUpdate={onModelContextUpdate}
                />
              ),
            },
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="composer">
      <ComposerPrimitive.Input
        placeholder="Ask about your tasks..."
        className="composer-input"
      />
      <ComposerPrimitive.Send className="composer-send">
        Send
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}
