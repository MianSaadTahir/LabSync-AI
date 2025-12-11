import { BaseAgent } from '../base/BaseAgent';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MeetingDetails } from '../../../shared/src/types';

export class MeetingExtractionAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    super(
      'MeetingExtractionAgent',
      'Extracts structured meeting details from Telegram messages using AI'
    );
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  async process(messageText: string): Promise<MeetingDetails> {
    try {
      if (!this.validateInput(messageText, { type: 'string' })) {
        throw new Error('Invalid input: messageText must be a non-empty string');
      }

      const prompt = this.buildExtractionPrompt(messageText);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const extracted = this.parseExtractionResult(text);
      return this.validateAndNormalize(extracted);
    } catch (error) {
      this.handleError(error as Error, { messageText });
    }
  }

  private buildExtractionPrompt(messageText: string): string {
    return `Extract meeting details from the following Telegram message. Return ONLY valid JSON with these exact fields:

{
  "project_name": "string (required)",
  "client_details": {
    "name": "string (required)",
    "email": "string (optional, null if not found)",
    "company": "string (optional, null if not found)"
  },
  "meeting_date": "ISO 8601 date string (required, use current date if not specified)",
  "participants": ["array of participant names or usernames"],
  "estimated_budget": number (required, 0 if not specified),
  "timeline": "string (required, e.g., '2 weeks', '1 month', '3 months')",
  "requirements": "string (required, detailed project requirements)"
}

Message: "${messageText}"

IMPORTANT:
- Extract all information accurately
- If a field is not found, use reasonable defaults (e.g., current date for meeting_date, 0 for budget, empty array for participants)
- Return ONLY the JSON object, no markdown, no explanations
- Ensure all required fields are present`;
  }

  private parseExtractionResult(text: string): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // Try parsing the entire text
      return JSON.parse(text);
    } catch (error) {
      // Fallback: try to extract fields manually
      console.warn('[MeetingExtractionAgent] Failed to parse JSON, using fallback extraction');
      return this.fallbackExtraction(text);
    }
  }

  private fallbackExtraction(text: string): any {
    // Basic fallback extraction - try to find key information
    const projectMatch = text.match(/"project_name"\s*:\s*"([^"]*)"/i) || 
                        text.match(/project[:\s]+([^\n,]+)/i);
    const nameMatch = text.match(/"name"\s*:\s*"([^"]*)"/i) ||
                     text.match(/client[:\s]+([^\n,]+)/i) ||
                     text.match(/name[:\s]+([^\n,]+)/i);
    const budgetMatch = text.match(/"estimated_budget"\s*:\s*(\d+)/i) ||
                       text.match(/budget[:\s]+[\$]?(\d+)/i);
    const timelineMatch = text.match(/"timeline"\s*:\s*"([^"]*)"/i) ||
                         text.match(/timeline[:\s]+([^\n,]+)/i);

    return {
      project_name: projectMatch ? projectMatch[1].trim() : 'Unnamed Project',
      client_details: {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Client',
        email: null,
        company: null,
      },
      meeting_date: new Date().toISOString(),
      participants: [],
      estimated_budget: budgetMatch ? parseInt(budgetMatch[1]) : 0,
      timeline: timelineMatch ? timelineMatch[1].trim() : 'Not specified',
      requirements: text.substring(0, 500), // Use first 500 chars as requirements
    };
  }

  private validateAndNormalize(extracted: any): MeetingDetails {
    // Ensure all required fields exist with defaults
    const normalized: MeetingDetails = {
      project_name: extracted.project_name || 'Unnamed Project',
      client_details: {
        name: extracted.client_details?.name || 'Unknown Client',
        email: extracted.client_details?.email || undefined,
        company: extracted.client_details?.company || undefined,
      },
      meeting_date: this.parseDate(extracted.meeting_date),
      participants: Array.isArray(extracted.participants) ? extracted.participants : [],
      estimated_budget: typeof extracted.estimated_budget === 'number' 
        ? extracted.estimated_budget 
        : parseInt(extracted.estimated_budget) || 0,
      timeline: extracted.timeline || 'Not specified',
      requirements: extracted.requirements || 'No requirements specified',
    };

    return normalized;
  }

  private parseDate(dateInput: string | Date): Date {
    if (dateInput instanceof Date) {
      return dateInput;
    }
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    // Default to current date if parsing fails
    return new Date();
  }
}





