import { AppRenderer } from '@mcp-ui/client';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { JSONRPCRequest } from '@modelcontextprotocol/sdk/types.js';
import type { ActiveToolCall } from '../types';

const SANDBOX_URL = new URL('http://localhost:8082/sandbox.html');

interface McpAppPanelProps {
  activeToolCall: ActiveToolCall | null;
  mcpClient: Client | null;
  onModelContextUpdate: (context: string) => void;
  onToolCallSwitch: (toolCall: ActiveToolCall) => void;
}

export function McpAppPanel({
  activeToolCall,
  mcpClient,
  onModelContextUpdate,
  onToolCallSwitch,
}: McpAppPanelProps) {
  if (!activeToolCall || !mcpClient) {
    return (
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
        {!mcpClient
          ? 'Connecting to MCP server...'
          : 'Chat with the assistant to view tasks here.'}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <AppRenderer
        sandbox={{ url: SANDBOX_URL }}
        client={mcpClient}
        toolName={activeToolCall.name}
        toolInput={activeToolCall.input}
        toolResult={activeToolCall.result}
        onFallbackRequest={async (request: JSONRPCRequest) => {
          console.log('[McpAppPanel] fallbackRequest:', request.method, request.params);
          if (
            request.method === 'ui/update-model-context' ||
            request.method === 'ui/updateModelContext'
          ) {
            const params = request.params as Record<string, unknown> | undefined;
            const content = params?.content as Array<{ type: string; text: string }> | undefined;
            const structuredContent = params?.structuredContent as Record<string, unknown> | undefined;
            const text = content?.[0]?.text ?? JSON.stringify(structuredContent ?? {});
            if (text) {
              onModelContextUpdate(text);
            }
            return {};
          }
          // Return empty object for any other unhandled method to avoid errors
          return {};
        }}
        onCallTool={async (params) => {
          const result = await mcpClient.callTool({
            name: params.name,
            arguments: params.arguments,
          });

          // Check if this tool call has a different resourceUri - if so, switch views.
          const resultContent = result.content as Array<{ type: string; text: string }>;
          const toolResult = {
            content: resultContent.map((c) => ({
              type: 'text' as const,
              text: typeof c === 'string' ? c : c.text ?? JSON.stringify(c),
            })),
          };

          onToolCallSwitch({
            name: params.name,
            input: (params.arguments ?? {}) as Record<string, unknown>,
            result: toolResult,
          });

          return result;
        }}
        onOpenLink={async ({ url }: { url: string }) => {
          window.open(url, '_blank');
          return {};
        }}
      />
    </div>
  );
}
