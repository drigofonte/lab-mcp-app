import { useEffect, useRef, useState } from 'react';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = 'http://localhost:3001/mcp';

export interface ToolMeta {
  name: string;
  resourceUri?: string;
}

/**
 * Hook that creates and manages an MCP client connection.
 * Connects via Streamable HTTP to the NestJS backend.
 */
export function useMcpClient() {
  const [client, setClient] = useState<Client | null>(null);
  const [tools, setTools] = useState<ToolMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
        const mcpClient = new Client({
          name: 'frontend-client',
          version: '1.0.0',
        });

        await mcpClient.connect(transport);

        if (cancelled) {
          await mcpClient.close();
          return;
        }

        clientRef.current = mcpClient;
        setClient(mcpClient);

        // Fetch tool list to get resourceUri mappings.
        const toolList = await mcpClient.listTools();
        if (!cancelled) {
          const toolMetas: ToolMeta[] = toolList.tools.map((t) => ({
            name: t.name,
            resourceUri: (t as Record<string, unknown>)?._meta
              ? ((t as Record<string, unknown>)._meta as Record<string, unknown>)?.ui
                ? (((t as Record<string, unknown>)._meta as Record<string, unknown>).ui as Record<string, unknown>)?.resourceUri as string | undefined
                : undefined
              : undefined,
          }));
          setTools(toolMetas);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('MCP client connection failed:', err);
          setError((err as Error).message);
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (clientRef.current) {
        clientRef.current.close().catch(() => {});
        clientRef.current = null;
      }
    };
  }, []);

  return { client, tools, error };
}
