import { BaseAgent } from '../base/BaseAgent.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  PeopleCosts,
  ResourceCosts,
  BudgetBreakdown,
  BudgetDesign as SharedBudgetDesign,
  MeetingDetails
} from '../../../shared/src/types/index.js';

// Re-export or alias if needed, or just use SharedBudgetDesign
type BudgetDesign = SharedBudgetDesign;

export interface MeetingData extends MeetingDetails { }

export class BudgetDesignAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    super(
      'BudgetDesignAgent',
      'Designs comprehensive project budgets from meeting data, including people costs and resource costs'
    );
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  async process(meetingData: MeetingData): Promise<BudgetDesign> {
    try {
      if (!this.validateInput(meetingData, { type: 'object' })) {
        throw new Error('Invalid input: meetingData must be a valid object');
      }

      const prompt = this.buildBudgetDesignPrompt(meetingData);
      console.log("[DEBUG] Budget Prompt:", JSON.stringify(prompt));
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const designed = this.parseBudgetDesign(text);
      return this.validateAndNormalize(designed, meetingData.estimated_budget);
    } catch (error) {
      this.handleError(error as Error, { meetingData });
    }
  }

  private buildBudgetDesignPrompt(meetingData: MeetingData): string {
    return `Design a comprehensive project budget based on the following meeting details. Return ONLY valid JSON with these exact fields:

{
  "total_budget": number (should be close to estimated_budget: ${meetingData.estimated_budget}),
  "people_costs": {
    "role_name_1": { "count": number, "rate": number (hourly), "hours": number, "total": number },
    "role_name_2": { "count": number, "rate": number (hourly), "hours": number, "total": number },
    ... (add specific roles relevant to the project, e.g., 'Drone Pilot', 'iOS Developer', 'Prompt Engineer')
  },
  "resource_costs": {
    "electricity": number,
    "rent": number,
    "software_licenses": number,
    "hardware": number,
    "specific_resource_1": number,
    ... (add specific resources relevant to the project)
  },
  "breakdown": [
    {
      "category": "string (e.g., 'Development', 'Design', 'Infrastructure')",
      "item": "string (specific item name)",
      "quantity": number,
      "unit_cost": number,
      "total": number
    }
  ]
}

Meeting Details:
- Project Name: ${meetingData.project_name}
- Client: ${meetingData.client_details.name}${meetingData.client_details.company ? ` (${meetingData.client_details.company})` : ''}
- Estimated Budget: $${meetingData.estimated_budget}
- Timeline: ${meetingData.timeline}
- Requirements: ${meetingData.requirements}

IMPORTANT GUIDELINES:
1. Total budget should be approximately ${meetingData.estimated_budget} (within 10% variance)
2. People costs should account for 60-70% of total budget
3. Resource costs should account for 20-30% of total budget
4. Breakdown should include detailed line items
5. Calculate hours based on timeline (e.g., "2 weeks" = 80 hours per person, "1 month" = 160 hours)
6. Use realistic market rates for roles.
7. BE CREATIVE with roles! Use specific titles like "Senior React Dev", "UX Researcher", "Cloud Architect".
8. DO NOT use generic roles like 'Lead', 'Manager', 'Developer', 'Designer', 'QA' unless specifically requested. We want detailed breakdowns.
9. Return ONLY the JSON object, no markdown, no explanations`;
  }

  private parseBudgetDesign(text: string): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // Try parsing the entire text
      return JSON.parse(text);
    } catch (error) {
      console.error('[BudgetDesignAgent] Failed to parse JSON:', error);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  private validateAndNormalize(designed: any, estimatedBudget: number): BudgetDesign {
    // Dynamic people costs normalization
    const peopleCosts: PeopleCosts = {};
    if (designed.people_costs && typeof designed.people_costs === 'object') {
      for (const [role, cost] of Object.entries(designed.people_costs)) {
        peopleCosts[role] = this.normalizePeopleCost(cost, 50, 160);
      }
    } else {
      // Fallback if structure is wrong, though AI usually follows schema
      peopleCosts['general_staff'] = { count: 1, rate: 50, hours: 160, total: 8000 };
    }

    // Dynamic resource costs normalization
    const resourceCosts: ResourceCosts = {};
    if (designed.resource_costs && typeof designed.resource_costs === 'object') {
      for (const [resource, cost] of Object.entries(designed.resource_costs)) {
        resourceCosts[resource] = this.normalizeNumber(cost, 0);
      }
    } else {
      resourceCosts['miscellaneous'] = 500;
    }

    // Calculate breakdown
    const breakdown: BudgetBreakdown[] = Array.isArray(designed.breakdown)
      ? designed.breakdown.map((item: any) => ({
        category: item.category || 'Other',
        item: item.item || 'Unspecified',
        quantity: this.normalizeNumber(item.quantity, 1),
        unit_cost: this.normalizeNumber(item.unit_cost, 0),
        total: this.normalizeNumber(item.total, 0),
      }))
      : [];

    // Calculate total budget
    const peopleTotal = Object.values(peopleCosts).reduce((sum, cost) => sum + cost.total, 0);
    const resourceTotal = Object.values(resourceCosts).reduce((sum, cost) => sum + cost, 0);
    const breakdownTotal = breakdown.reduce((sum, item) => sum + item.total, 0);
    const calculatedTotal = peopleTotal + resourceTotal + breakdownTotal;

    // Use estimated budget if provided and reasonable, otherwise use calculated
    const total_budget =
      estimatedBudget > 0 && Math.abs(calculatedTotal - estimatedBudget) / estimatedBudget < 0.5
        ? estimatedBudget
        : calculatedTotal;

    return {
      total_budget: Math.round(total_budget),
      people_costs: peopleCosts,
      resource_costs: resourceCosts,
      breakdown: breakdown,
    };
  }

  private normalizePeopleCost(
    cost: any,
    defaultRate: number,
    defaultHours: number
  ): { count: number; rate: number; hours: number; total: number } {
    const count = this.normalizeNumber(cost?.count, 1);
    const rate = this.normalizeNumber(cost?.rate, defaultRate);
    const hours = this.normalizeNumber(cost?.hours, defaultHours);
    const total = count * rate * hours;

    return { count, rate, hours, total };
  }

  private normalizeNumber(value: any, defaultValue: number): number {
    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return defaultValue;
  }
}



