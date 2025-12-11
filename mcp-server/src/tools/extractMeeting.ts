import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';
// Import from built dist files for runtime
import { MeetingExtractionAgent } from '../../../agents/dist/meetingExtraction/MeetingExtractionAgent.js';

export const extractMeetingTool = {
  name: 'extract_meeting_details',
  description: 'Extract structured meeting details from a Telegram message using AI agent. Returns meeting information including project name, client details, budget, timeline, and requirements.',
  inputSchema: {
    type: 'object',
    properties: {
      messageText: {
        type: 'string',
        description: 'The text content of the Telegram message to extract meeting details from',
      },
    },
    required: ['messageText'],
  },
};

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export async function handleExtractMeeting(request: CallToolRequest): Promise<any> {
  const { messageText } = request.params.arguments as { messageText: string };

  if (!messageText) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'messageText is required',
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    // Use agent directly (MCP → Agent → AI)
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const agent = new MeetingExtractionAgent(apiKey);
    console.log('[MCP] Using MeetingExtractionAgent to extract meeting details');
    
    const extracted = await agent.process(messageText);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: extracted,
          }),
        },
      ],
    };
  } catch (error) {
    console.error('[MCP] Error extracting meeting:', error);
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

