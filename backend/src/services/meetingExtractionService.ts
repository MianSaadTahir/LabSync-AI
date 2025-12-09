import Message from '../models/Message';
import Meeting, { IMeeting } from '../models/Meeting';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import { emitToUpdates, SocketEvents } from './socketService';
import { extractMeetingViaMCP } from '../utils/mcpClient';

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
  constructor() {
    console.log('[MeetingExtractionService] Using MCP server for meeting extraction');
  }

  private async extractMeetingDetails(messageText: string): Promise<MeetingDetails> {
    // Use MCP server (which uses agent) with retry logic
    const result = await retryWithBackoff(
      async () => await extractMeetingViaMCP('', messageText),
      3, // max 3 retries
      2000, // start with 2 second delay
      10000 // max 10 second delay
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to extract meeting via MCP');
    }

    const extracted = result.data;

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
        : parseInt(String(extracted.estimated_budget)) || 0,
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

      // Emit WebSocket event for status update
      emitToUpdates(SocketEvents.MESSAGE_STATUS_UPDATED, {
        messageId: message._id.toString(),
        module1_status: 'extracted',
        message: message.toObject(),
      });

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

      // Emit WebSocket event for meeting extracted
      if (meeting) {
        emitToUpdates(SocketEvents.MEETING_EXTRACTED, {
          meeting: meeting.toObject(),
          messageId: message._id.toString(),
        });

        // Automatically trigger budget design in background (non-blocking)
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

