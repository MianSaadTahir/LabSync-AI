import { BaseAgent } from '../base/BaseAgent';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface MeetingData {
  project_name: string;
  client_details: {
    name: string;
    email?: string;
    company?: string;
  };
  meeting_date: Date;
  participants: string[];
  estimated_budget: number;
  timeline: string;
  requirements: string;
}

export interface PeopleCosts {
  lead: { count: number; rate: number; hours: number; total: number };
  manager: { count: number; rate: number; hours: number; total: number };
  developer: { count: number; rate: number; hours: number; total: number };
  designer: { count: number; rate: number; hours: number; total: number };
  qa: { count: number; rate: number; hours: number; total: number };
}

export interface ResourceCosts {
  electricity: number;
  rent: number;
  software_licenses: number;
  hardware: number;
  other: number;
}

export interface BudgetBreakdown {
  category: string;
  item: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface BudgetDesign {
  total_budget: number;
  people_costs: PeopleCosts;
  resource_costs: ResourceCosts;
  breakdown: BudgetBreakdown[];
}

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
    "lead": { "count": number, "rate": number (hourly), "hours": number, "total": number },
    "manager": { "count": number, "rate": number (hourly), "hours": number, "total": number },
    "developer": { "count": number, "rate": number (hourly), "hours": number, "total": number },
    "designer": { "count": number, "rate": number (hourly), "hours": number, "total": number },
    "qa": { "count": number, "rate": number (hourly), "hours": number, "total": number }
  },
  "resource_costs": {
    "electricity": number (monthly cost),
    "rent": number (monthly cost),
    "software_licenses": number (total project cost),
    "hardware": number (total project cost),
    "other": number (miscellaneous costs)
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
6. Use realistic hourly rates:
   - Lead: $80-120/hour
   - Manager: $60-100/hour
   - Developer: $50-80/hour
   - Designer: $40-70/hour
   - QA: $35-60/hour
7. Resource costs should be prorated based on timeline
8. Return ONLY the JSON object, no markdown, no explanations`;
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
      console.warn('[BudgetDesignAgent] Failed to parse JSON, using fallback design');
      return this.fallbackBudgetDesign();
    }
  }

  private fallbackBudgetDesign(): any {
    // Basic fallback budget design
    return {
      total_budget: 0,
      people_costs: {
        lead: { count: 1, rate: 100, hours: 160, total: 16000 },
        manager: { count: 1, rate: 80, hours: 160, total: 12800 },
        developer: { count: 2, rate: 65, hours: 160, total: 20800 },
        designer: { count: 1, rate: 55, hours: 80, total: 4400 },
        qa: { count: 1, rate: 45, hours: 80, total: 3600 },
      },
      resource_costs: {
        electricity: 200,
        rent: 2000,
        software_licenses: 1000,
        hardware: 2000,
        other: 1000,
      },
      breakdown: [],
    };
  }

  private validateAndNormalize(designed: any, estimatedBudget: number): BudgetDesign {
    // Calculate people costs totals
    const peopleCosts: PeopleCosts = {
      lead: this.normalizePeopleCost(designed.people_costs?.lead, 100, 160),
      manager: this.normalizePeopleCost(designed.people_costs?.manager, 80, 160),
      developer: this.normalizePeopleCost(designed.people_costs?.developer, 65, 160),
      designer: this.normalizePeopleCost(designed.people_costs?.designer, 55, 80),
      qa: this.normalizePeopleCost(designed.people_costs?.qa, 45, 80),
    };

    // Calculate resource costs
    const resourceCosts: ResourceCosts = {
      electricity: this.normalizeNumber(designed.resource_costs?.electricity, 200),
      rent: this.normalizeNumber(designed.resource_costs?.rent, 2000),
      software_licenses: this.normalizeNumber(designed.resource_costs?.software_licenses, 1000),
      hardware: this.normalizeNumber(designed.resource_costs?.hardware, 2000),
      other: this.normalizeNumber(designed.resource_costs?.other, 1000),
    };

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



