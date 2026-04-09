import { AppRenderer } from '@mcp-ui/client';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { JSONRPCRequest } from '@modelcontextprotocol/sdk/types.js';
import type { ActiveToolCall } from '../types';

const SANDBOX_URL = new URL('http://localhost:8082/sandbox.html');

interface InlineAppEmbedProps {
  activeToolCall: ActiveToolCall;
  mcpClient: Client;
  onModelContextUpdate: (context: string) => void;
  onToolCallUpdate: (toolCall: ActiveToolCall) => void;
}

export function InlineAppEmbed({
  activeToolCall,
  mcpClient,
  onModelContextUpdate,
  onToolCallUpdate,
}: InlineAppEmbedProps) {
  return (
    <div className="app-embed">
      <div className="app-embed-label">{activeToolCall.name.replace(/_/g, ' ')}</div>
      <div className="app-embed-content">
        <AppRenderer
          key={activeToolCall.name + '-' + activeToolCall._key}
          sandbox={{ url: SANDBOX_URL }}
          client={mcpClient}
          toolName={activeToolCall.name}
          toolInput={activeToolCall.input}
          toolResult={activeToolCall.result}
          onFallbackRequest={async (request: JSONRPCRequest) => {
            if (
              request.method === 'ui/update-model-context' ||
              request.method === 'ui/updateModelContext'
            ) {
              const params = request.params as Record<string, unknown> | undefined;
              const content = params?.content as Array<{ type: string; text: string }> | undefined;
              const structuredContent = params?.structuredContent as
                | Record<string, unknown>
                | undefined;
              const text =
                content?.[0]?.text ?? JSON.stringify(structuredContent ?? {});
              if (text) {
                onModelContextUpdate(text);
              }
              return {};
            }
            return {};
          }}
          onCallTool={async (params) => {
            const result = await mcpClient.callTool({
              name: params.name,
              arguments: params.arguments,
            });

            const resultContent = result.content as Array<{ type: string; text: string }>;
            const toolResult = {
              content: resultContent.map((c) => ({
                type: 'text' as const,
                text: typeof c === 'string' ? c : c.text ?? JSON.stringify(c),
              })),
            };

            onToolCallUpdate({
              name: params.name,
              input: (params.arguments ?? {}) as Record<string, unknown>,
              result: toolResult,
              _key: Date.now(),
            });

            return result;
          }}
          onOpenLink={async ({ url }: { url: string }) => {
            window.open(url, '_blank');
            return {};
          }}
        />
      </div>
    </div>
  );
}
