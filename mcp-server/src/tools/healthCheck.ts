// Health Check Tool

import { registerTool } from './index.js';

registerTool({
  name: 'health_check',
  description: 'Check the health status of the MCP server',
  inputSchema: {
    type: 'object',
    properties: {},
  },
});

export async function handleHealthCheck(): Promise<any> {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'labsync-ai-mcp-server',
    version: '1.0.0',
  };
}





