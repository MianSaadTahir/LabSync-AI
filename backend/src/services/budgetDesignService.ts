import Meeting, { IMeeting } from '../models/Meeting';
import Budget, { IBudget } from '../models/Budget';
import Message from '../models/Message';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import { emitToUpdates, SocketEvents } from './socketService';
import { designBudgetViaMCP } from '../utils/mcpClient';

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
  constructor() {
    console.log('[BudgetDesignService] Using MCP server for budget design');
  }

  private async designBudget(meetingData: MeetingData): Promise<BudgetDesign> {
    // Use MCP server (which uses agent) with retry logic
    const result = await retryWithBackoff(
      async () => await designBudgetViaMCP('', meetingData),
      3, // max 3 retries
      2000, // start with 2 second delay
      10000 // max 10 second delay
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to design budget via MCP');
    }

    const designed = result.data;
    return this.validateAndNormalize(designed, meetingData.estimated_budget);
  }

  private buildBudgetDesignPrompt(meetingData: MeetingData): string {
    // Calculate project duration in months for resource cost proration
    const timelineMonths = this.parseTimelineToMonths(meetingData.timeline);
    const estimatedHours = this.parseTimelineToHours(meetingData.timeline);
    
    // Analyze project complexity from requirements
    const complexity = this.analyzeProjectComplexity(meetingData.requirements, meetingData.timeline);
    
    return `You are an expert project budget analyst. Design a comprehensive, DYNAMIC project budget that accurately reflects the ACTUAL needs of this specific project. 

CRITICAL: Analyze the project requirements carefully and create a budget that VARIES based on:
- Project complexity and scope
- Technology stack requirements
- Team size needed for the timeline
- Actual resource needs (not generic estimates)
- Project type (web app, mobile, enterprise, e-commerce, etc.)

Return ONLY valid JSON with these exact fields:

{
  "total_budget": number (should be close to estimated_budget: ${meetingData.estimated_budget}, but adjust if requirements suggest different),
  "people_costs": {
    "lead": { "count": number (based on project size), "rate": number (hourly, $80-120), "hours": number (based on actual need), "total": number },
    "manager": { "count": number (based on team size), "rate": number (hourly, $60-100), "hours": number (based on actual need), "total": number },
    "developer": { "count": number (DYNAMIC - analyze requirements to determine needed developers), "rate": number (hourly, $50-80), "hours": number (based on timeline and complexity), "total": number },
    "designer": { "count": number (0 if no design needed, 1-2 if UI/UX required), "rate": number (hourly, $40-70), "hours": number (based on design complexity), "total": number },
    "qa": { "count": number (based on project size - small: 0-1, medium: 1, large: 1-2), "rate": number (hourly, $35-60), "hours": number (based on testing needs), "total": number }
  },
  "resource_costs": {
    "electricity": number (DYNAMIC - calculate based on team size and timeline: ~$50-100 per person per month × ${timelineMonths} months),
    "rent": number (DYNAMIC - calculate based on team size: small team (1-3): $1000-1500/month, medium (4-6): $2000-3000/month, large (7+): $3000-5000/month × ${timelineMonths} months),
    "software_licenses": number (DYNAMIC - analyze requirements: basic projects: $500-1000, medium: $1000-3000, enterprise/complex: $3000-10000. Include: IDEs, cloud services, APIs, tools),
    "hardware": number (DYNAMIC - calculate based on team needs: small: $1000-2000, medium: $2000-5000, large: $5000-10000. Include: laptops, servers, equipment),
    "other": number (DYNAMIC - include: domain, hosting, third-party services, training, contingency - typically 5-10% of other costs)
  },
  "breakdown": [
    {
      "category": "string (e.g., 'Development Tools', 'Cloud Infrastructure', 'Design Assets', 'Third-party APIs')",
      "item": "string (specific item name based on requirements)",
      "quantity": number,
      "unit_cost": number,
      "total": number
    }
  ]
}

PROJECT DETAILS:
- Project Name: ${meetingData.project_name}
- Client: ${meetingData.client_details.name}${meetingData.client_details.company ? ` (${meetingData.client_details.company})` : ''}
- Estimated Budget: $${meetingData.estimated_budget}
- Timeline: ${meetingData.timeline} (approximately ${timelineMonths} months, ${estimatedHours} hours)
- Requirements: ${meetingData.requirements}

ANALYSIS REQUIRED:
1. **Project Type Analysis**: Identify if this is web app, mobile app, e-commerce, enterprise software, API, etc.
2. **Complexity Assessment**: ${complexity.assessment}
3. **Team Size Calculation**: Based on timeline (${meetingData.timeline}) and requirements, determine:
   - How many developers are actually needed?
   - Is design work required? (UI/UX, graphics, branding)
   - What level of QA is needed?
   - Does this need a dedicated manager or can lead handle it?
4. **Resource Needs**: Based on project type and requirements:
   - What software/licenses are needed? (e.g., AWS, Azure, design tools, APIs)
   - What hardware is required? (servers, development machines, testing devices)
   - What infrastructure costs? (hosting, CDN, databases, monitoring)

DYNAMIC CALCULATION RULES:
1. **Team Size**: 
   - Small project (< 1 month, simple requirements): 1-2 developers, 0-1 designer, 0-1 QA
   - Medium project (1-3 months, moderate complexity): 2-4 developers, 1 designer, 1 QA
   - Large project (3+ months, complex): 4+ developers, 1-2 designers, 1-2 QA
   - Adjust based on actual requirements analysis

2. **Hours Calculation**:
   - Calculate based on timeline: ${estimatedHours} total hours available
   - Distribute hours based on role needs (developers need more hours than managers)
   - Lead: 20-40% of timeline hours (oversight, architecture)
   - Manager: 30-50% of timeline hours (coordination, planning)
   - Developers: 80-100% of timeline hours (full-time work)
   - Designers: 40-60% of timeline hours (if needed)
   - QA: 30-50% of timeline hours (testing phase)

3. **Resource Costs** (MUST BE DYNAMIC):
   - **Electricity**: $50-100 per team member per month × ${timelineMonths} months
   - **Rent**: Based on team size (see above) × ${timelineMonths} months
   - **Software Licenses**: Analyze requirements - what tools/services are needed?
     * Basic: VS Code (free), GitHub (free), basic hosting ($50-200/month)
     * Medium: Cloud services (AWS/Azure: $200-1000/month), design tools ($50-200/month), CI/CD ($50-200/month)
     * Enterprise: Enterprise cloud ($1000-5000/month), enterprise tools, monitoring, security tools
   - **Hardware**: Based on team size and project needs
     * Development machines: $1000-2000 per developer
     * Servers/infrastructure: $500-5000 depending on scale
     * Testing devices: $200-1000 for mobile/web testing
   - **Other**: Domain ($10-50), SSL ($50-200), third-party APIs ($100-1000), training, contingency

4. **Breakdown Items**: Create specific line items based on requirements:
   - If web app: hosting, domain, SSL, CDN, database
   - If mobile: app store fees, testing devices, mobile-specific tools
   - If e-commerce: payment gateway, inventory system, shipping integration
   - If enterprise: security tools, compliance, enterprise infrastructure

CRITICAL REQUIREMENTS:
1. Total budget should be approximately $${meetingData.estimated_budget} (within 10% variance, but adjust if requirements clearly indicate different needs)
2. People costs: 60-70% of total budget
3. Resource costs: 20-30% of total budget (DYNAMIC based on actual needs)
4. Breakdown: 10-20% of total budget (specific items from requirements)
5. **DO NOT use generic/static values** - every cost must be justified by the project requirements
6. **Vary team size** based on project complexity and timeline
7. **Vary resource costs** based on project type and actual needs
8. Return ONLY the JSON object, no markdown, no explanations`;
  }

  private parseTimelineToMonths(timeline: string): number {
    const lower = timeline.toLowerCase();
    const weeksMatch = lower.match(/(\d+)\s*week/);
    const monthsMatch = lower.match(/(\d+)\s*month/);
    const daysMatch = lower.match(/(\d+)\s*day/);
    
    if (weeksMatch) {
      return Math.max(0.5, parseInt(weeksMatch[1]) / 4.33); // Convert weeks to months
    }
    if (monthsMatch) {
      return Math.max(0.5, parseInt(monthsMatch[1]));
    }
    if (daysMatch) {
      return Math.max(0.5, parseInt(daysMatch[1]) / 30);
    }
    // Default: assume 1 month if unclear
    return 1;
  }

  private parseTimelineToHours(timeline: string): number {
    const months = this.parseTimelineToMonths(timeline);
    // Assume 160 working hours per month (40 hours/week × 4 weeks)
    return Math.round(months * 160);
  }

  private analyzeProjectComplexity(requirements: string, timeline: string): { assessment: string } {
    const lowerReq = requirements.toLowerCase();
    const timelineMonths = this.parseTimelineToMonths(timeline);
    
    let complexity = 'medium';
    let indicators: string[] = [];
    
    // High complexity indicators
    if (lowerReq.includes('enterprise') || lowerReq.includes('scalable') || lowerReq.includes('microservices')) {
      complexity = 'high';
      indicators.push('enterprise-scale');
    }
    if (lowerReq.includes('ai') || lowerReq.includes('machine learning') || lowerReq.includes('ml')) {
      complexity = 'high';
      indicators.push('AI/ML integration');
    }
    if (lowerReq.includes('real-time') || lowerReq.includes('websocket') || lowerReq.includes('socket')) {
      complexity = 'high';
      indicators.push('real-time features');
    }
    if (lowerReq.includes('payment') || lowerReq.includes('e-commerce') || lowerReq.includes('transaction')) {
      complexity = 'high';
      indicators.push('payment processing');
    }
    
    // Low complexity indicators
    if (lowerReq.includes('simple') || lowerReq.includes('basic') || lowerReq.includes('landing page')) {
      complexity = 'low';
      indicators.push('simple scope');
    }
    if (timelineMonths < 0.5) {
      complexity = 'low';
      indicators.push('short timeline');
    }
    
    // Medium complexity (default)
    if (indicators.length === 0) {
      indicators.push('standard project');
    }
    
    const assessment = `Project complexity: ${complexity}. Indicators: ${indicators.join(', ')}. Timeline: ${timelineMonths.toFixed(1)} months. This suggests ${complexity === 'high' ? 'larger team and more resources' : complexity === 'low' ? 'smaller team and minimal resources' : 'moderate team and standard resources'}.`;
    
    return { assessment };
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

          // Emit WebSocket events for status update and budget designed
          emitToUpdates(SocketEvents.MESSAGE_STATUS_UPDATED, {
            messageId: message._id.toString(),
            module2_status: 'designed',
            message: message.toObject(),
          });

          emitToUpdates(SocketEvents.BUDGET_DESIGNED, {
            budget: budget.toObject(),
            meetingId: meeting._id.toString(),
            messageId: message._id.toString(),
          });
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

