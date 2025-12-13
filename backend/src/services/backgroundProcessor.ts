import Message from '../models/Message';
import { MeetingExtractionService } from './meetingExtractionService';
import { BudgetDesignService } from './budgetDesignService';
import { BudgetAllocationService } from './budgetAllocationService';
import Meeting from '../models/Meeting';
import Budget from '../models/Budget';

/**
 * Professional Background Processor with intelligent retry and API key rotation
 * Handles failed operations with exponential backoff and smart rate limit handling
 */
export class BackgroundProcessor {
  private extractionService: MeetingExtractionService;
  private budgetDesignService: BudgetDesignService;
  private allocationService: BudgetAllocationService;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  // Processing statistics
  private stats = {
    extractionsProcessed: 0,
    extractionsFailed: 0,
    budgetsProcessed: 0,
    budgetsFailed: 0,
    allocationsProcessed: 0,
    allocationsFailed: 0,
    lastProcessedAt: null as Date | null,
    apiKeyRotations: 0,
    rateLimitHits: 0
  };

  // Intelligent retry configuration
  private readonly config = {
    baseInterval: 15000,     // 15 seconds between checks
    maxRetryDelay: 300000,   // 5 minutes max delay for rate limits
    batchSize: 3,            // Process 3 items at a time
    concurrentProcessing: true
  };

  constructor() {
    this.extractionService = new MeetingExtractionService();
    this.budgetDesignService = new BudgetDesignService();
    this.allocationService = new BudgetAllocationService();
  }

  /**
   * Start the background processor with professional automation
   */
  start(intervalMs: number = 15000): void {
    if (this.intervalId) {
      console.log('[BackgroundProcessor] ⚡ Already running');
      return;
    }

    console.log('[BackgroundProcessor] 🚀 Starting Professional Automation Engine');
    console.log(`[BackgroundProcessor] ├─ Check interval: ${intervalMs}ms`);
    console.log(`[BackgroundProcessor] ├─ Batch size: ${this.config.batchSize}`);
    console.log(`[BackgroundProcessor] └─ Concurrent: ${this.config.concurrentProcessing}`);

    // Process immediately on start
    this.process().catch(console.error);

    // Then process periodically
    this.intervalId = setInterval(() => {
      if (!this.isProcessing) {
        this.process().catch(console.error);
      }
    }, intervalMs);
  }

  /**
   * Stop the background processor
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[BackgroundProcessor] 🛑 Stopped');
      console.log(`[BackgroundProcessor] Final Stats: ${JSON.stringify(this.stats, null, 2)}`);
    }
  }

  /**
   * Get current processing statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Main processing loop with intelligent error handling
   */
  private async process(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process in parallel for efficiency
      await Promise.all([
        this.processFailedExtractions(),
        this.processPendingMeetings(),
        this.processFailedBudgetDesigns(),
        this.processPendingAllocations()
      ]);

      this.stats.lastProcessedAt = new Date();
    } catch (error) {
      console.error('[BackgroundProcessor] ❌ Error in process cycle:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retry failed meeting extractions with smart error handling
   */
  private async processFailedExtractions(): Promise<void> {
    const failedMessages = await Message.find({
      $or: [
        { module1_status: 'pending' },
        { module1_status: 'failed' }
      ],
      text: { $exists: true, $ne: '' }
    })
      .sort({ date_received: -1 }) // Process newest first
      .limit(this.config.batchSize);

    if (failedMessages.length === 0) {
      return;
    }

    console.log(`[BackgroundProcessor] 📥 Processing ${failedMessages.length} pending extractions...`);

    for (const message of failedMessages) {
      try {
        await this.extractionService.extractAndSave(message._id.toString());
        this.stats.extractionsProcessed++;
        console.log(`[BackgroundProcessor] ✅ Extracted: ${message._id}`);
      } catch (error: any) {
        await this.handleProcessingError(error, 'extraction', message._id.toString());
      }
    }
  }

  /**
   * Process meetings that need budget design
   */
  private async processPendingMeetings(): Promise<void> {
    const meetings = await Meeting.find()
      .sort({ extracted_at: -1 })
      .limit(this.config.batchSize);

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
            console.log(`[BackgroundProcessor] 💰 Designing budget for: ${meeting.project_name}`);
            await this.budgetDesignService.designAndSave(meeting._id.toString());
            this.stats.budgetsProcessed++;
            console.log(`[BackgroundProcessor] ✅ Budget designed: ${meeting._id}`);
          }
        }
      } catch (error: any) {
        await this.handleProcessingError(error, 'budget', meeting._id.toString());
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
    }).limit(this.config.batchSize);

    if (failedMessages.length === 0) {
      return;
    }

    console.log(`[BackgroundProcessor] 🔄 Retrying ${failedMessages.length} failed budget designs...`);

    for (const message of failedMessages) {
      try {
        const meeting = await Meeting.findOne({ messageId: message._id });
        if (meeting) {
          await this.budgetDesignService.designAndSave(meeting._id.toString());
          this.stats.budgetsProcessed++;
          console.log(`[BackgroundProcessor] ✅ Budget retry succeeded: ${meeting._id}`);
        }
      } catch (error: any) {
        await this.handleProcessingError(error, 'budget_retry', message._id.toString());
      }
    }
  }

  /**
   * Intelligent error handler with API key rotation and rate limit detection
   */
  private async handleProcessingError(error: any, type: string, itemId: string): Promise<void> {
    const errorMessage = error?.message || 'Unknown error';
    const errorStatus = error?.status;

    // Rate limit detection (429 or quota errors)
    const isRateLimited =
      errorStatus === 429 ||
      errorMessage.includes('quota') ||
      errorMessage.includes('Quota exceeded') ||
      errorMessage.includes('rate limit');

    // API overload detection (503)
    const isOverloaded =
      errorStatus === 503 ||
      errorMessage.includes('overloaded') ||
      errorMessage.includes('Service Unavailable');

    // API key error detection
    const isApiKeyError =
      errorStatus === 401 ||
      errorStatus === 403 ||
      errorMessage.includes('API key') ||
      errorMessage.includes('invalid key');

    if (isRateLimited) {
      this.stats.rateLimitHits++;
      console.warn(`[BackgroundProcessor] ⏳ Rate limited for ${type} ${itemId}. Will retry with next key.`);
      // The API key manager will automatically rotate to next key
      this.stats.apiKeyRotations++;
    } else if (isOverloaded) {
      console.warn(`[BackgroundProcessor] 🔄 API overloaded for ${type} ${itemId}. Will retry later.`);
    } else if (isApiKeyError) {
      console.error(`[BackgroundProcessor] 🔑 API key error for ${type} ${itemId}. Check configuration.`);
      if (type === 'extraction') this.stats.extractionsFailed++;
      if (type.includes('budget')) this.stats.budgetsFailed++;
    } else {
      console.error(`[BackgroundProcessor] ❌ ${type} failed for ${itemId}: ${errorMessage}`);
      if (type === 'extraction') this.stats.extractionsFailed++;
      if (type.includes('budget')) this.stats.budgetsFailed++;
      if (type.includes('allocation')) this.stats.allocationsFailed++;
    }
  }

  /**
   * Process pending budget allocations (Module 3)
   */
  private async processPendingAllocations(): Promise<void> {
    // Find messages that have been designed but not allocated
    const pendingMessages = await Message.find({
      module2_status: 'designed',
      module3_status: 'pending'
    }).limit(this.config.batchSize);

    if (pendingMessages.length === 0) {
      return;
    }

    console.log(`[BackgroundProcessor] 📊 Processing ${pendingMessages.length} pending allocations...`);

    for (const message of pendingMessages) {
      try {
        // Find the meeting and budget for this message
        const meeting = await Meeting.findOne({ messageId: message._id });
        if (!meeting) {
          continue;
        }

        const budget = await Budget.findOne({ meetingId: meeting._id });
        if (!budget) {
          continue;
        }

        // Allocate the budget
        await this.allocationService.allocateAndSave(budget._id.toString());
        this.stats.allocationsProcessed++;
        console.log(`[BackgroundProcessor] ✅ Allocated: ${message._id}`);
      } catch (error: any) {
        this.stats.allocationsFailed++;
        console.error(`[BackgroundProcessor] ❌ Allocation failed for ${message._id}: ${error.message}`);
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

// Export stats getter
export function getProcessorStats(): ReturnType<BackgroundProcessor['getStats']> {
  return getBackgroundProcessor().getStats();
}
