import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

let mcpClient: Client | null = null;
let isConnecting = false;

/**
 * Get or create MCP client connection
 */
export async function getMCPClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  if (isConnecting) {
    // Wait for connection
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (mcpClient) {
          clearInterval(checkInterval);
          resolve(mcpClient);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('MCP client connection timeout'));
      }, 10000);
    });
  }

  isConnecting = true;

  try {
    // Get MCP server path (built version)
    // From backend/src/utils, go up to root, then into mcp-server
    const mcpServerPath = path.resolve(process.cwd(), '../mcp-server/dist/server.js');
    
    // Create transport - spawns MCP server as subprocess
    const transport = new StdioClientTransport({
      command: 'node',
      args: [mcpServerPath],
      env: {
        ...process.env,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      },
    });

    // Create client
    mcpClient = new Client(
      {
        name: 'labsync-backend-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect
    await mcpClient.connect(transport);
    console.log('[MCP Client] ✅ Connected to MCP server');

    isConnecting = false;
    return mcpClient;
  } catch (error) {
    isConnecting = false;
    console.error('[MCP Client] ❌ Failed to connect:', error);
    throw error;
  }
}

/**
 * Call MCP tool
 */
export async function callMCPTool(toolName: string, args: any): Promise<any> {
  try {
    const client = await getMCPClient();
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    if (result.isError) {
      throw new Error(result.content[0]?.text || 'MCP tool error');
    }

    const content = result.content[0]?.text;
    if (content) {
      return JSON.parse(content);
    }

    return result;
  } catch (error) {
    console.error(`[MCP Client] Error calling tool ${toolName}:`, error);
    throw error;
  }
}

/**
 * Extract meeting details via MCP
 */
export async function extractMeetingViaMCP(messageId: string, messageText: string): Promise<any> {
  return callMCPTool('extract_meeting_details', { messageId, messageText });
}

/**
 * Design budget via MCP
 */
export async function designBudgetViaMCP(meetingId: string, meetingData: any): Promise<any> {
  return callMCPTool('design_budget', { meetingId, meetingData });
}

