import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message';
import { successResponse } from '../utils/response';

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    return successResponse(res, { data: messages });
  } catch (error) {
    next(error);
  }
};





