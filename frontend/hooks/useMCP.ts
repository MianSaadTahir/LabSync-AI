'use client';

import { useState, useEffect } from 'react';
import { mcpClient, MCPToolCall, MCPResponse } from '@/lib/mcp-client';

export function useMCP() {
  const [tools, setTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const availableTools = await mcpClient.listTools();
      setTools(availableTools);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tools'));
    }
  };

  const callTool = async (tool: MCPToolCall): Promise<MCPResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.callTool(tool);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Tool call failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    tools,
    callTool,
    loading,
    error,
    reloadTools: loadTools,
  };
}





