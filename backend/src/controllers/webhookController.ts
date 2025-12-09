import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message';
import { successResponse, errorResponse } from '../utils/response';
import { MeetingExtractionService } from '../services/meetingExtractionService';
import { emitToUpdates, SocketEvents } from '../services/socketService';

interface TelegramUpdate {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
  };
  text?: string;
  date: number;
}

// Initialize service (singleton pattern)
let extractionService: MeetingExtractionService | null = null;

const getExtractionService = (): MeetingExtractionService => {
  if (!extractionService) {
    try {
      extractionService = new MeetingExtractionService();
    } catch (error) {
      console.warn('[Webhook] MeetingExtractionService not available:', error);
    }
  }
  return extractionService!;
};

export const handleTelegramWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    console.log('[Webhook] Received request from Telegram');
    console.log('[Webhook] Request body:', JSON.stringify(req.body, null, 2));
    
    const update = req.body as TelegramUpdate;
    const message = update?.message || update?.edited_message;

    if (!message || !message.message_id) {
      console.warn('[Webhook] Invalid Telegram payload - no message found');
      return errorResponse(res, 400, 'Invalid Telegram payload');
    }

    console.log(`[Webhook] Processing message ${message.message_id} from user ${message.from?.id}`);
    console.log(`[Webhook] Message text: ${message.text?.substring(0, 100) || '(no text)'}`);

    const payload = {
      message_id: String(message.message_id),
      sender_id: String(message.from?.id || 'unknown'),
      text: message.text || '',
      date_received: message.date ? new Date(message.date * 1000) : new Date(),
      raw_payload: update,
      module1_status: 'pending' as const, // Mark for extraction
    };

    const storedMessage = await Message.findOneAndUpdate(
      { message_id: payload.message_id },
      { ...payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[Webhook] ✅ Message saved to database: ${storedMessage._id}`);

    // Emit WebSocket event for new message
    emitToUpdates(SocketEvents.MESSAGE_CREATED, {
      message: storedMessage.toObject(),
    });

    // Automatically trigger meeting extraction in background (non-blocking)
    if (storedMessage && message.text && message.text.trim().length > 0) {
      console.log(`[Webhook] Triggering meeting extraction for message ${storedMessage._id}`);
      // Process extraction asynchronously (don't wait for it)
      processExtractionAsync(storedMessage._id.toString()).catch((error) => {
        console.error('[Webhook] Background extraction failed:', error);
      });
    }

    return successResponse(res, { data: storedMessage }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Process extraction asynchronously without blocking the webhook response
 * Retries automatically if API is overloaded
 */
async function processExtractionAsync(messageId: string): Promise<void> {
  try {
    const service = getExtractionService();
    await service.extractAndSave(messageId);
    console.log(`[Webhook] ✅ Successfully extracted meeting from message ${messageId}`);
  } catch (error: any) {
    // Check if it's a retryable error (503, overloaded, etc.)
    const isRetryable = 
      error?.status === 503 || 
      error?.statusText === 'Service Unavailable' ||
      error?.message?.includes('overloaded');
    
    if (isRetryable) {
      console.warn(`[Webhook] ⚠️ API overloaded for message ${messageId}. Will retry automatically on next check.`);
      // The retry logic is already in the service, but we log it here for visibility
    } else {
      console.error(`[Webhook] ❌ Extraction error for message ${messageId}:`, error.message);
    }
  }
}

