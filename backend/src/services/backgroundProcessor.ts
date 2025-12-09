import Message from '../models/Message';
import { MeetingExtractionService } from './meetingExtractionService';
import { BudgetDesignService } from './budgetDesignService';
import Meeting from '../models/Meeting';
import Budget from '../models/Budget';

/**
 * Background processor to retry failed extractions and designs
 * Runs periodically to process pending/failed items
 */
export class BackgroundProcessor {
  private extractionService: MeetingExtractionService;
  private budgetDesignService: BudgetDesignService;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.extractionService = new MeetingExtractionService();
    this.budgetDesignService = new BudgetDesignService();
  }

  /**
   * Start the background processor
   * Checks every 30 seconds for pending/failed items
   */
  start(intervalMs: number = 30000): void {
    if (this.intervalId) {
      console.log('[BackgroundProcessor] Already running');
      return;
    }

    console.log(`[BackgroundProcessor] Starting with ${intervalMs}ms interval`);
    
    // Process immediately on start
    this.process().catch(console.error);

    // Then process periodically
    this.intervalId = setInterval(() => {
      this.process().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop the background processor
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[BackgroundProcessor] Stopped');
    }
  }

  /**
   * Process pending and failed items
   */
  private async process(): Promise<void> {
    try {
      await this.processFailedExtractions();
      await this.processPendingMeetings();
      await this.processFailedBudgetDesigns();
    } catch (error) {
      console.error('[BackgroundProcessor] Error in process:', error);
    }
  }

  /**
   * Retry failed meeting extractions
   */
  private async processFailedExtractions(): Promise<void> {
    const failedMessages = await Message.find({
      $or: [
        { module1_status: 'pending' },
        { module1_status: 'failed' }
      ],
      text: { $exists: true, $ne: '' }
    }).limit(5);

    for (const message of failedMessages) {
      try {
        console.log(`[BackgroundProcessor] Retrying extraction for message ${message._id}`);
        await this.extractionService.extractAndSave(message._id.toString());
        console.log(`[BackgroundProcessor] ✅ Successfully extracted message ${message._id}`);
      } catch (error: any) {
        // Check if it's a quota error - don't spam retries
        const isQuotaError = 
          error?.status === 429 && 
          (error?.message?.includes('quota') || error?.message?.includes('Quota exceeded'));
        
        if (isQuotaError) {
          // Skip retrying quota errors - they'll be retried when quota resets
          console.warn(
            `[BackgroundProcessor] ⏸️ Skipping message ${message._id} - API quota exceeded. Will retry later.`
          );
          continue;
        }
        
        // Only log if it's not a retryable error (those will be retried again)
        if (error?.status !== 503 && !error?.message?.includes('overloaded')) {
          console.error(`[BackgroundProcessor] ❌ Failed to extract message ${message._id}:`, error.message);
        }
      }
    }
  }

  /**
   * Process meetings that need budget design
   */
  private async processPendingMeetings(): Promise<void> {
    const meetings = await Meeting.find().limit(5);

    for (const meeting of meetings) {
      try {
        // Check if budget already exists
        const existingBudget = await Budget.findOne({ meetingId: meeting._id });
        if (existingBudget) {
          continue;
        }

        // Check if meeting extraction is complete
        if (meeting.messageId) {
          const message = await Message.findById(meeting.messageId);
          if (message && message.module1_status === 'extracted' && message.module2_status !== 'designed') {
            console.log(`[BackgroundProcessor] Designing budget for meeting ${meeting._id}`);
            await this.budgetDesignService.designAndSave(meeting._id.toString());
            console.log(`[BackgroundProcessor] ✅ Successfully designed budget for meeting ${meeting._id}`);
          }
        }
      } catch (error: any) {
        if (error?.status !== 503 && !error?.message?.includes('overloaded')) {
          console.error(`[BackgroundProcessor] ❌ Failed to design budget for meeting ${meeting._id}:`, error.message);
        }
      }
    }
  }

  /**
   * Retry failed budget designs
   */
  private async processFailedBudgetDesigns(): Promise<void> {
    const failedMessages = await Message.find({
      module1_status: 'extracted',
      module2_status: 'failed'
    }).limit(5);

    for (const message of failedMessages) {
      try {
        const meeting = await Meeting.findOne({ messageId: message._id });
        if (meeting) {
          console.log(`[BackgroundProcessor] Retrying budget design for meeting ${meeting._id}`);
          await this.budgetDesignService.designAndSave(meeting._id.toString());
          console.log(`[BackgroundProcessor] ✅ Successfully designed budget for meeting ${meeting._id}`);
        }
      } catch (error: any) {
        // Check if it's a quota error - don't spam retries
        const isQuotaError = 
          error?.status === 429 && 
          (error?.message?.includes('quota') || error?.message?.includes('Quota exceeded'));
        
        if (isQuotaError) {
          console.warn(
            `[BackgroundProcessor] ⏸️ Skipping budget design for message ${message._id} - API quota exceeded. Will retry later.`
          );
          continue;
        }
        
        if (error?.status !== 503 && !error?.message?.includes('overloaded')) {
          console.error(`[BackgroundProcessor] ❌ Failed to design budget for message ${message._id}:`, error.message);
        }
      }
    }
  }
}

// Singleton instance
let backgroundProcessor: BackgroundProcessor | null = null;

export function getBackgroundProcessor(): BackgroundProcessor {
  if (!backgroundProcessor) {
    backgroundProcessor = new BackgroundProcessor();
  }
  return backgroundProcessor;
}

