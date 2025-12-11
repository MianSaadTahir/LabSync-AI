// MCP Client for Frontend
// This will be used to communicate with the MCP server

export interface MCPToolCall {
  name: string;
  arguments?: Record<string, any>;
}

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

class MCPClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001';
  }

  async callTool(tool: MCPToolCall): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tool),
      });

      if (!response.ok) {
        throw new Error(`MCP tool call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MCP client error:', error);
      throw error;
    }
  }

  async listTools(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp/tools`);
      if (!response.ok) {
        throw new Error(`Failed to list tools: ${response.statusText}`);
      }
      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('MCP client error:', error);
      return [];
    }
  }
}

export const mcpClient = new MCPClient();





