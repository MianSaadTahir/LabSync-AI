import { Request, Response, NextFunction } from 'express';
import Meeting from '../models/Meeting';
import { successResponse, errorResponse } from '../utils/response';

export const getMeetings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const meetings = await Meeting.find()
      .populate('messageId')
      .sort({ createdAt: -1 });
    return successResponse(res, { data: meetings });
  } catch (error) {
    next(error);
  }
};

export const getMeetingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id).populate('messageId');
    
    if (!meeting) {
      return errorResponse(res, 404, 'Meeting not found');
    }
    
    return successResponse(res, { data: meeting });
  } catch (error) {
    next(error);
  }
};





