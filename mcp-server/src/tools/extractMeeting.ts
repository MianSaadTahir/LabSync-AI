import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';
// Import from built dist files for runtime
import { MeetingExtractionAgent } from '../../../agents/dist/agents/src/meetingExtraction/MeetingExtractionAgent.js';
import { config } from '../config.js';

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
    // Check if API key is configured
    if (!config.hasGeminiApiKeys()) {
      // STRICT MODE: Fail if no keys are available
      console.error('[MCP] ❌ NO API KEYS FOUND - Cannot proceed with Real AI extraction');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'No Gemini API keys configured. Please add keys to backend/.env to use Real AI.',
              isRealAI: false
            }),
          },
        ],
        isError: true,
      };
    }

    // Use real API key for meeting extraction
    const apiKey = config.getGeminiApiKeyForMeeting();
    const agent = new MeetingExtractionAgent(apiKey);
    console.log('[MCP] 🧠 Using REAL GEMINI AI Agent for extraction');
    console.log(`[MCP] Key loaded: ${apiKey.substring(0, 8)}...`);


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
