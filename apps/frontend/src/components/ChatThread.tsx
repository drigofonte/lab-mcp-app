import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  type ChatModelAdapter,
} from '@assistant-ui/react';
import type { ReactNode } from 'react';

function ChatMessages() {
  return (
    <ThreadPrimitive.Messages
      components={{
        UserMessage,
        AssistantMessage,
      }}
    />
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

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="message-assistant">
      <div className="message-assistant-bubble">
        <MessagePrimitive.Content />
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

function ThreadContent({ appEmbed }: { appEmbed?: ReactNode }) {
  return (
    <ThreadPrimitive.Root style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <ThreadPrimitive.Viewport className="messages-viewport">
        <ThreadPrimitive.Empty>
          <div className="empty-state">Send a message to get started.</div>
        </ThreadPrimitive.Empty>
        <ChatMessages />
        {appEmbed}
      </ThreadPrimitive.Viewport>
      <Composer />
    </ThreadPrimitive.Root>
  );
}

interface ChatThreadProps {
  adapter: ChatModelAdapter;
  appEmbed?: ReactNode;
}

export function ChatThread({ adapter, appEmbed }: ChatThreadProps) {
  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadContent appEmbed={appEmbed} />
    </AssistantRuntimeProvider>
  );
}
