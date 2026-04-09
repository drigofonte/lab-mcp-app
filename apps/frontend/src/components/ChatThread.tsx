import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  type ChatModelAdapter,
} from '@assistant-ui/react';

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
    <MessagePrimitive.Root
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: 12,
        paddingLeft: 40,
      }}
    >
      <div
        style={{
          background: '#2563eb',
          color: '#fff',
          borderRadius: 12,
          padding: '8px 14px',
          maxWidth: '80%',
          whiteSpace: 'pre-wrap',
        }}
      >
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: 12,
        paddingRight: 40,
      }}
    >
      <div
        style={{
          background: '#f1f5f9',
          color: '#1e293b',
          borderRadius: 12,
          padding: '8px 14px',
          maxWidth: '80%',
          whiteSpace: 'pre-wrap',
        }}
      >
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root
      style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        borderTop: '1px solid #e2e8f0',
        background: '#fff',
      }}
    >
      <ComposerPrimitive.Input
        placeholder="Ask about your tasks..."
        style={{
          flex: 1,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      <ComposerPrimitive.Send
        style={{
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 14,
          fontFamily: 'inherit',
        }}
      >
        Send
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}

function ThreadContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ThreadPrimitive.Root
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <ThreadPrimitive.Viewport
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
          }}
        >
          <ThreadPrimitive.Empty>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#94a3b8',
                fontSize: 14,
              }}
            >
              Send a message to get started.
            </div>
          </ThreadPrimitive.Empty>
          <ChatMessages />
        </ThreadPrimitive.Viewport>
        <Composer />
      </ThreadPrimitive.Root>
    </div>
  );
}

export function ChatThread({ adapter }: { adapter: ChatModelAdapter }) {
  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadContent />
    </AssistantRuntimeProvider>
  );
}
