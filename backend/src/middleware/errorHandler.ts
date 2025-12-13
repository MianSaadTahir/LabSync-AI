import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

interface CustomError extends Error {
  statusCode?: number;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return errorResponse(res, statusCode, message);
};

export default errorHandler;





