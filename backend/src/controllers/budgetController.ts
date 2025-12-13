import { Request, Response, NextFunction } from 'express';
import Budget from '../models/Budget';
import { successResponse, errorResponse } from '../utils/response';
import { BudgetDesignService } from '../services/budgetDesignService';

export const getBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const budgets = await Budget.find()
      .populate('meetingId')
      .sort({ createdAt: -1 });
    return successResponse(res, { data: budgets });
  } catch (error) {
    next(error);
  }
};

export const getBudgetById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id).populate('meetingId');
    
    if (!budget) {
      return errorResponse(res, 404, 'Budget not found');
    }
    
    return successResponse(res, { data: budget });
  } catch (error) {
    next(error);
  }
};

// New endpoint for budget design
export const designBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      return errorResponse(res, 400, 'meetingId is required');
    }

    const service = new BudgetDesignService();
    const budget = await service.designAndSave(meetingId);

    return successResponse(res, { data: budget });
  } catch (error) {
    next(error);
  }
};



