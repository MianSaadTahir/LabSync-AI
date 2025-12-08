#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { extractMeetingTool, handleExtractMeeting } from './tools/extractMeeting.js';

// Initialize MCP Server
const server = new Server(
  {
    name: 'labsync-ai-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'health_check',
        description: 'Check the health status of the MCP server',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      extractMeetingTool,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'health_check') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            server: 'labsync-ai-mcp-server',
          }),
        },
      ],
    };
  }

  if (name === 'extract_meeting_details') {
    return await handleExtractMeeting(request);
  }

  throw new Error(`Unknown tool: ${name}`);
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('LabSync AI MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

