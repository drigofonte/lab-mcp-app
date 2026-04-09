import { useState, useCallback } from 'react';
import { AppRenderer } from '@mcp-ui/client';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { JSONRPCRequest } from '@modelcontextprotocol/sdk/types.js';

const SANDBOX_URL = new URL('http://localhost:8082/sandbox.html');

interface CurrentView {
  toolName: string;
  input: Record<string, unknown>;
  result?: { content: Array<{ type: 'text'; text: string }> };
  key: number;
}

interface InlineMcpAppProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: { text: string; resourceUri: string } | unknown;
  addResult: (result: unknown) => void;
  mcpClient: Client | null;
  toolResourceMap: Map<string, string>;
  onModelContextUpdate: (ctx: string) => void;
  onAppMessage?: (text: string) => void;
}

export function InlineMcpApp({
  toolName,
  args,
  result,
  mcpClient,
  toolResourceMap,
  onModelContextUpdate,
  onAppMessage,
}: InlineMcpAppProps) {
  // Track the current view — initially from the tool call, but can change
  // when the user navigates within the iframe (e.g., "View All Tasks").
  const [currentView, setCurrentView] = useState<CurrentView | null>(null);

  const initialResourceUri = toolResourceMap.get(toolName);

  // Determine what to render: either the navigated-to view or the original tool call
  const activeToolName = currentView?.toolName ?? toolName;
  const activeInput = currentView?.input ?? args;
  const activeResourceUri = currentView
    ? toolResourceMap.get(currentView.toolName)
    : initialResourceUri;

  const activeResult = currentView?.result ?? (() => {
    const resultObj = result as { text?: string } | undefined;
    return resultObj?.text
      ? { content: [{ type: 'text' as const, text: resultObj.text }] }
      : undefined;
  })();

  const renderKey = currentView?.key ?? 0;

  // Only render for tools that have a resourceUri
  if (!activeResourceUri || !mcpClient) {
    return null;
  }

  const handleCallTool = async (params: { name: string; arguments?: Record<string, unknown> }) => {
    const callResult = await mcpClient.callTool({
      name: params.name,
      arguments: params.arguments,
    });

    // Check if this tool has a different resourceUri — if so, navigate
    const calledResourceUri = toolResourceMap.get(params.name);
    if (calledResourceUri && calledResourceUri !== activeResourceUri) {
      const resultContent = callResult.content as Array<{ type: string; text: string }>;
      setCurrentView({
        toolName: params.name,
        input: (params.arguments ?? {}) as Record<string, unknown>,
        result: {
          content: resultContent.map((c) => ({
            type: 'text' as const,
            text: typeof c === 'string' ? c : c.text ?? JSON.stringify(c),
          })),
        },
        key: Date.now(),
      });
    }

    return callResult;
  };

  return (
    <div className="app-embed">
      <div className="app-embed-label">{activeToolName.replace(/_/g, ' ')}</div>
      <div className="app-embed-content">
        <AppRenderer
          key={`${activeToolName}-${renderKey}`}
          sandbox={{ url: SANDBOX_URL }}
          client={mcpClient}
          toolName={activeToolName}
          toolInput={activeInput}
          toolResult={activeResult}
          onMessage={async (params) => {
            const textParts = params.content
              ?.filter((c: { type: string }) => c.type === 'text')
              .map((c: { type: string; text: string }) => c.text);
            const text = textParts?.join('\n');
            if (text && onAppMessage) {
              onAppMessage(text);
            }
            return {};
          }}
          onFallbackRequest={async (request: JSONRPCRequest) => {
            if (
              request.method === 'ui/update-model-context' ||
              request.method === 'ui/updateModelContext'
            ) {
              const params = request.params as Record<string, unknown> | undefined;
              const content = params?.content as Array<{ type: string; text: string }> | undefined;
              const text = content?.[0]?.text;
              if (text) {
                onModelContextUpdate(text);
              }
              return {};
            }
            return {};
          }}
          onCallTool={handleCallTool}
          onOpenLink={async ({ url }: { url: string }) => {
            window.open(url, '_blank');
            return {};
          }}
        />
      </div>
    </div>
  );
}
