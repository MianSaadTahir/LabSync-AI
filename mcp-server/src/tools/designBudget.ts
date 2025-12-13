import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';
// Import from built dist files for runtime
import { BudgetDesignAgent, MeetingData as AgentMeetingData } from '../../../agents/dist/agents/src/budgetDesign/BudgetDesignAgent.js';
import { config } from '../config.js';

export const designBudgetTool = {
  name: 'design_budget',
  description: 'Design a comprehensive, dynamic project budget from meeting data using AI agent. Creates detailed budget with people costs, resource costs, and breakdown based on project requirements.',
  inputSchema: {
    type: 'object',
    properties: {
      meetingData: {
        type: 'object',
        description: 'Meeting data including project name, client details, estimated budget, timeline, and requirements',
        properties: {
          project_name: { type: 'string' },
          client_details: { type: 'object' },
          meeting_date: { type: 'string' },
          participants: { type: 'array' },
          estimated_budget: { type: 'number' },
          timeline: { type: 'string' },
          requirements: { type: 'string' },
        },
        required: ['project_name', 'client_details', 'estimated_budget', 'timeline', 'requirements'],
      },
    },
    required: ['meetingData'],
  },
};

type CallToolRequest = z.infer<typeof CallToolRequestSchema>;

export async function handleDesignBudget(request: CallToolRequest): Promise<any> {
  const { meetingData } = request.params.arguments as { meetingData: any };

  if (!meetingData) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'meetingData is required',
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    // Check if API key is configured
    if (!config.hasGeminiApiKeys()) {
      console.error('[MCP] ❌ NO API KEYS FOUND - Cannot proceed with Budget Design');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'No Gemini API keys configured. Please add keys to backend/.env to use Budget Agent.',
              isRealAI: false
            }),
          },
        ],
        isError: true,
      };
    }

    // Use real API key for budget design
    const apiKey = config.getGeminiApiKeyForBudget();
    const agent = new BudgetDesignAgent(apiKey);
    console.log('[MCP] Using BudgetDesignAgent to design budget');

    // Convert to agent format
    const agentMeetingData: AgentMeetingData = {
      project_name: meetingData.project_name,
      client_details: meetingData.client_details,
      meeting_date: meetingData.meeting_date ? new Date(meetingData.meeting_date) : new Date(),
      participants: meetingData.participants || [],
      estimated_budget: meetingData.estimated_budget || 0,
      timeline: meetingData.timeline || 'Not specified',
      requirements: meetingData.requirements || '',
    };

    const budget = await agent.process(agentMeetingData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: budget,
          }),
        },
      ],
    };
  } catch (error) {
    console.error('[MCP] Error designing budget:', error);
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
