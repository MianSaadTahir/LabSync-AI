import Meeting, { IMeeting } from '../models/Meeting';
import Budget, { IBudget } from '../models/Budget';
import Message from '../models/Message';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryWithBackoff } from '../utils/retryWithBackoff';

// Define types locally to avoid cross-package import issues
interface MeetingData {
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

interface PeopleCosts {
  lead: { count: number; rate: number; hours: number; total: number };
  manager: { count: number; rate: number; hours: number; total: number };
  developer: { count: number; rate: number; hours: number; total: number };
  designer: { count: number; rate: number; hours: number; total: number };
  qa: { count: number; rate: number; hours: number; total: number };
}

interface ResourceCosts {
  electricity: number;
  rent: number;
  software_licenses: number;
  hardware: number;
  other: number;
}

interface BudgetBreakdown {
  category: string;
  item: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface BudgetDesign {
  total_budget: number;
  people_costs: PeopleCosts;
  resource_costs: ResourceCosts;
  breakdown: BudgetBreakdown[];
}

export class BudgetDesignService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  private async designBudget(meetingData: MeetingData): Promise<BudgetDesign> {
    const prompt = this.buildBudgetDesignPrompt(meetingData);
    // Retry with exponential backoff for API overload errors
    const result = await retryWithBackoff(
      async () => await this.model.generateContent(prompt),
      3, // max 3 retries
      2000, // start with 2 second delay
      10000 // max 10 second delay
    );
    const response = await result.response;
    const text = response.text();

    const designed = this.parseBudgetDesign(text);
    return this.validateAndNormalize(designed, meetingData.estimated_budget);
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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (error) {
      console.warn('[BudgetDesignService] Failed to parse JSON, using fallback design');
      return this.fallbackBudgetDesign();
    }
  }

  private fallbackBudgetDesign(): any {
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
    const peopleCosts: PeopleCosts = {
      lead: this.normalizePeopleCost(designed.people_costs?.lead, 100, 160),
      manager: this.normalizePeopleCost(designed.people_costs?.manager, 80, 160),
      developer: this.normalizePeopleCost(designed.people_costs?.developer, 65, 160),
      designer: this.normalizePeopleCost(designed.people_costs?.designer, 55, 80),
      qa: this.normalizePeopleCost(designed.people_costs?.qa, 45, 80),
    };

    const resourceCosts: ResourceCosts = {
      electricity: this.normalizeNumber(designed.resource_costs?.electricity, 200),
      rent: this.normalizeNumber(designed.resource_costs?.rent, 2000),
      software_licenses: this.normalizeNumber(designed.resource_costs?.software_licenses, 1000),
      hardware: this.normalizeNumber(designed.resource_costs?.hardware, 2000),
      other: this.normalizeNumber(designed.resource_costs?.other, 1000),
    };

    const breakdown: BudgetBreakdown[] = Array.isArray(designed.breakdown)
      ? designed.breakdown.map((item: any) => ({
          category: item.category || 'Other',
          item: item.item || 'Unspecified',
          quantity: this.normalizeNumber(item.quantity, 1),
          unit_cost: this.normalizeNumber(item.unit_cost, 0),
          total: this.normalizeNumber(item.total, 0),
        }))
      : [];

    const peopleTotal = Object.values(peopleCosts).reduce((sum, cost) => sum + cost.total, 0);
    const resourceTotal = Object.values(resourceCosts).reduce((sum, cost) => sum + cost, 0);
    const breakdownTotal = breakdown.reduce((sum, item) => sum + item.total, 0);
    const calculatedTotal = peopleTotal + resourceTotal + breakdownTotal;

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

  /**
   * Design budget from meeting data and save to database
   */
  async designAndSave(meetingId: string): Promise<IBudget> {
    try {
      // Find the meeting
      const meeting = await Meeting.findById(meetingId).populate('messageId');
      if (!meeting) {
        throw new Error(`Meeting with id ${meetingId} not found`);
      }

      // Check if already designed
      if (meeting.messageId) {
        const message = await Message.findById((meeting.messageId as any)._id || meeting.messageId);
        if (message && message.module2_status === 'designed') {
          const existingBudget = await Budget.findOne({ meetingId: meeting._id });
          if (existingBudget) {
            return existingBudget;
          }
        }
      }

      // Update message status to processing
      if (meeting.messageId) {
        const message = await Message.findById((meeting.messageId as any)._id || meeting.messageId);
        if (message) {
          message.module2_status = 'pending';
          await message.save();
        }
      }

      // Prepare meeting data for agent
      const meetingData: MeetingData = {
        project_name: meeting.project_name,
        client_details: meeting.client_details,
        meeting_date: meeting.meeting_date,
        participants: meeting.participants,
        estimated_budget: meeting.estimated_budget,
        timeline: meeting.timeline,
        requirements: meeting.requirements,
      };

      // Design budget using AI
      const budgetDesign: BudgetDesign = await this.designBudget(meetingData);

      // Create or update Budget document
      const budget = await Budget.findOneAndUpdate(
        { meetingId: meeting._id },
        {
          meetingId: meeting._id,
          project_name: meeting.project_name,
          total_budget: budgetDesign.total_budget,
          people_costs: budgetDesign.people_costs,
          resource_costs: budgetDesign.resource_costs,
          breakdown: budgetDesign.breakdown,
          designed_at: new Date(),
          designed_by: 'BudgetDesignAgent',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Update message status to designed
      if (meeting.messageId) {
        const message = await Message.findById((meeting.messageId as any)._id || meeting.messageId);
        if (message) {
          message.module2_status = 'designed';
          await message.save();
        }
      }

      return budget;
    } catch (error) {
      // Update message status to failed
      const meeting = await Meeting.findById(meetingId).populate('messageId');
      if (meeting && meeting.messageId) {
        const message = await Message.findById((meeting.messageId as any)._id || meeting.messageId);
        if (message) {
          message.module2_status = 'failed';
          await message.save();
        }
      }
      throw error;
    }
  }

  /**
   * Design budget from meeting ID (finds meeting first)
   */
  async designFromMeetingId(meetingId: string): Promise<IBudget> {
    return this.designAndSave(meetingId);
  }

  /**
   * Process all meetings that need budget design
   */
  async processPendingMeetings(): Promise<void> {
    // Find all meetings that don't have budgets yet
    const meetings = await Meeting.find().limit(10); // Process 10 at a time

    for (const meeting of meetings) {
      try {
        const existingBudget = await Budget.findOne({ meetingId: meeting._id });
        if (!existingBudget) {
          // Check if meeting extraction is complete
          if (meeting.messageId) {
            const message = await Message.findById((meeting.messageId as any)._id || meeting.messageId);
            if (message && message.module1_status === 'extracted') {
              await this.designAndSave(meeting._id.toString());
              console.log(`[BudgetDesignService] Designed budget for meeting ${meeting._id}`);
            }
          }
        }
      } catch (error) {
        console.error(
          `[BudgetDesignService] Failed to design budget for meeting ${meeting._id}:`,
          error
        );
      }
    }
  }
}

