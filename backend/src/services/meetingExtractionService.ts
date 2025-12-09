import Message from '../models/Message';
import Meeting, { IMeeting } from '../models/Meeting';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryWithBackoff } from '../utils/retryWithBackoff';

// Import budget design service for automatic triggering
let budgetDesignService: any = null;

async function triggerBudgetDesignAsync(meetingId: string): Promise<void> {
  try {
    // Lazy load to avoid circular dependencies
    if (!budgetDesignService) {
      const { BudgetDesignService } = await import('./budgetDesignService');
      budgetDesignService = new BudgetDesignService();
    }
    await budgetDesignService.designAndSave(meetingId);
    console.log(`[MeetingExtractionService] Successfully designed budget for meeting ${meetingId}`);
  } catch (error) {
    console.error(`[MeetingExtractionService] Budget design error for meeting ${meetingId}:`, error);
  }
}

// Define MeetingDetails locally to avoid cross-package import issues
interface MeetingDetails {
  project_name: string;
  client_details: {
    name: string;
    email?: string;
    company?: string;
  };
  meeting_date: Date | string;
  participants: string[];
  estimated_budget: number;
  timeline: string;
  requirements: string;
}

export class MeetingExtractionService {
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

  private async extractMeetingDetails(messageText: string): Promise<MeetingDetails> {
    const prompt = `Extract meeting details from the following Telegram message. Return ONLY valid JSON with these exact fields:

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

    // Retry with exponential backoff for API overload errors
    const result = await retryWithBackoff(
      async () => await this.model.generateContent(prompt),
      3, // max 3 retries
      2000, // start with 2 second delay
      10000 // max 10 second delay
    );
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let extracted: any;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        extracted = JSON.parse(text);
      }
    } catch (error) {
      // Fallback extraction
      extracted = {
        project_name: 'Unnamed Project',
        client_details: { name: 'Unknown Client', email: null, company: null },
        meeting_date: new Date().toISOString(),
        participants: [],
        estimated_budget: 0,
        timeline: 'Not specified',
        requirements: messageText.substring(0, 500),
      };
    }

    // Validate and normalize
    return {
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
    return new Date();
  }

  /**
   * Extract meeting details from a message and save to database
   */
  async extractAndSave(messageId: string): Promise<IMeeting> {
    try {
      // Find the message
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error(`Message with id ${messageId} not found`);
      }

      // Check if already extracted
      if (message.module1_status === 'extracted') {
        const existingMeeting = await Meeting.findOne({ messageId: message._id });
        if (existingMeeting) {
          return existingMeeting;
        }
      }

      // Update status to processing
      message.module1_status = 'pending';
      await message.save();

      // Extract meeting details using AI
      const meetingDetails: MeetingDetails = await this.extractMeetingDetails(message.text);

      // Save meeting details to Message model
      message.meeting_details = {
        project_name: meetingDetails.project_name,
        client_details: meetingDetails.client_details,
        meeting_date: new Date(meetingDetails.meeting_date),
        participants: meetingDetails.participants,
        estimated_budget: meetingDetails.estimated_budget,
        timeline: meetingDetails.timeline,
        requirements: meetingDetails.requirements,
      };
      message.module1_status = 'extracted';
      await message.save();

      // Create or update Meeting document
      const meeting = await Meeting.findOneAndUpdate(
        { messageId: message._id },
        {
          messageId: message._id,
          project_name: meetingDetails.project_name,
          client_details: meetingDetails.client_details,
          meeting_date: new Date(meetingDetails.meeting_date),
          participants: meetingDetails.participants,
          estimated_budget: meetingDetails.estimated_budget,
          timeline: meetingDetails.timeline,
          requirements: meetingDetails.requirements,
          extracted_at: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Automatically trigger budget design in background (non-blocking)
      if (meeting) {
        triggerBudgetDesignAsync(meeting._id.toString()).catch((error) => {
          console.error('[MeetingExtractionService] Background budget design failed:', error);
        });
      }

      return meeting;
    } catch (error) {
      // Update message status to failed
      const message = await Message.findById(messageId);
      if (message) {
        message.module1_status = 'failed';
        await message.save();
      }
      throw error;
    }
  }

  /**
   * Process all pending messages
   */
  async processPendingMessages(): Promise<void> {
    const pendingMessages = await Message.find({
      module1_status: 'pending',
    }).limit(10); // Process 10 at a time

    for (const message of pendingMessages) {
      try {
        await this.extractAndSave(message._id.toString());
        console.log(`[MeetingExtractionService] Processed message ${message._id}`);
      } catch (error) {
        console.error(
          `[MeetingExtractionService] Failed to process message ${message._id}:`,
          error
        );
      }
    }
  }
}

