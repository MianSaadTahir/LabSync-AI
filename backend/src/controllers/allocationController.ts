import { Request, Response, NextFunction } from 'express';
import BudgetAllocation from '../models/BudgetAllocation';
import { successResponse, errorResponse } from '../utils/response';

export const getAllocations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const allocations = await BudgetAllocation.find()
      .populate('budgetId')
      .sort({ createdAt: -1 });
    return successResponse(res, { data: allocations });
  } catch (error) {
    next(error);
  }
};

export const getAllocationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const allocation = await BudgetAllocation.findById(id).populate('budgetId');
    
    if (!allocation) {
      return errorResponse(res, 404, 'Allocation not found');
    }
    
    return successResponse(res, { data: allocation });
  } catch (error) {
    next(error);
  }
};





