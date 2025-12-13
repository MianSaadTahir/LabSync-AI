import { BaseAgent } from '../base/BaseAgent.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MeetingDetails } from '../../../shared/src/types/index.js';

export class MeetingExtractionAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    super(
      'MeetingExtractionAgent',
      'Extracts structured meeting details from Telegram messages using AI'
    );
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });
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
      // Propagation of error
      console.error('[MeetingExtractionAgent] Failed to parse JSON:', error);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  // Fallback extraction removed to enforce Real AI usage

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





