import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message';
import { successResponse, errorResponse } from '../utils/response';
import { MeetingExtractionService } from '../services/meetingExtractionService';

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
    const update = req.body as TelegramUpdate;
    const message = update?.message || update?.edited_message;

    if (!message || !message.message_id) {
      return errorResponse(res, 400, 'Invalid Telegram payload');
    }

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

    // Automatically trigger meeting extraction in background (non-blocking)
    if (storedMessage && message.text && message.text.trim().length > 0) {
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
 */
async function processExtractionAsync(messageId: string): Promise<void> {
  try {
    const service = getExtractionService();
    await service.extractAndSave(messageId);
    console.log(`[Webhook] Successfully extracted meeting from message ${messageId}`);
  } catch (error) {
    // Error already logged in service, just ensure it doesn't crash
    console.error(`[Webhook] Extraction error for message ${messageId}:`, error);
  }
}

