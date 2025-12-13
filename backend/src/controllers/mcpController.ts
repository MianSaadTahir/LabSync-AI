import { Request, Response, NextFunction } from 'express';
import ClientProject from '../models/ClientProject';
import Message from '../models/Message';
import { successResponse, errorResponse } from '../utils/response';

interface ExtractedData {
  domain?: string | null;
  budget?: string | null;
  timeline?: string | null;
}

interface RouteToProjectBody {
  messageId: string;
  extracted: ExtractedData;
}

export const routeToProject = async (
  req: Request<{}, {}, RouteToProjectBody>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { messageId, extracted } = req.body;

    if (!messageId || !extracted) {
      return errorResponse(res, 400, 'messageId and extracted are required');
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return errorResponse(res, 404, 'Message not found');
    }

    const project = await ClientProject.create({
      messageId: messageId,
      raw_text: message.text,
      domain: extracted.domain || null,
      budget: extracted.budget || null,
      timeline: extracted.timeline || null,
    });

    return successResponse(res, { data: project }, 201);
  } catch (error) {
    next(error);
  }
};





