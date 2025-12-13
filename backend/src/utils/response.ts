import { Response } from 'express';

export const successResponse = (
  res: Response,
  data: Record<string, any> = {},
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({ success: true, ...data });
};

export const errorResponse = (
  res: Response,
  statusCode: number = 500,
  message: string = 'Something went wrong'
): Response => {
  return res.status(statusCode).json({ success: false, message });
};





