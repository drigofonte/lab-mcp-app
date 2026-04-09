import { AppRenderer } from '@mcp-ui/client';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { JSONRPCRequest } from '@modelcontextprotocol/sdk/types.js';

const SANDBOX_URL = new URL('http://localhost:8082/sandbox.html');

interface InlineMcpAppProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: { text: string; resourceUri: string } | unknown;
  addResult: (result: unknown) => void;
  mcpClient: Client | null;
  toolResourceMap: Map<string, string>;
  onModelContextUpdate: (ctx: string) => void;
}

export function InlineMcpApp({
  toolName,
  args,
  result,
  mcpClient,
  toolResourceMap,
  onModelContextUpdate,
}: InlineMcpAppProps) {
  const resourceUri = toolResourceMap.get(toolName);

  // Only render AppRenderer for tools that have a resourceUri (MCP App tools).
  if (!resourceUri || !mcpClient) {
    return null;
  }

  // Build the toolResult in the shape AppRenderer expects.
  const resultObj = result as { text?: string; resourceUri?: string } | undefined;
  const toolResult = resultObj?.text
    ? {
        content: [
          {
            type: 'text' as const,
            text: resultObj.text,
          },
        ],
      }
    : undefined;

  return (
    <div className="app-embed">
      <div className="app-embed-label">{toolName.replace(/_/g, ' ')}</div>
      <div className="app-embed-content">
        <AppRenderer
          key={`${toolName}-${JSON.stringify(args)}`}
          sandbox={{ url: SANDBOX_URL }}
          client={mcpClient}
          toolName={toolName}
          toolInput={args}
          toolResult={toolResult}
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
            const callResult = await mcpClient.callTool({
              name: params.name,
              arguments: params.arguments,
            });
            return callResult;
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
