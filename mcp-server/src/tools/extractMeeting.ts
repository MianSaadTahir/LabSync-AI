import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
// Note: MCP server communicates with backend via HTTP API, not direct imports
// This tool will be called from backend, so we'll handle it differently

export const extractMeetingTool = {
  name: 'extract_meeting_details',
  description: 'Extract structured meeting details from a Telegram message using AI. Automatically processes the message and saves meeting information.',
  inputSchema: {
    type: 'object',
    properties: {
      messageId: {
        type: 'string',
        description: 'The MongoDB _id of the message to extract meeting details from',
      },
    },
    required: ['messageId'],
  },
};

export async function handleExtractMeeting(request: typeof CallToolRequestSchema._type): Promise<any> {
  const { messageId } = request.params.arguments as { messageId: string };

  if (!messageId) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'messageId is required',
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    // Call backend API to extract meeting
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/agent/extract-meeting/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to extract meeting');
    }

    const result = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: result.data,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
}

