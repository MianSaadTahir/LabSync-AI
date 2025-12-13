import { Request, Response, NextFunction } from 'express';
import BudgetAllocation from '../models/BudgetAllocation';
import { successResponse, errorResponse } from '../utils/response';
import { emitToUpdates } from '../services/socketService';

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

/**
 * Update the actual spent amount for an allocation
 * PATCH /api/allocations/:id/spend
 */
export const updateAllocationSpent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { actual_spent, notes } = req.body;

    if (actual_spent === undefined || typeof actual_spent !== 'number') {
      return errorResponse(res, 400, 'actual_spent must be a number');
    }

    if (actual_spent < 0) {
      return errorResponse(res, 400, 'actual_spent cannot be negative');
    }

    const allocation = await BudgetAllocation.findById(id);

    if (!allocation) {
      return errorResponse(res, 404, 'Allocation not found');
    }

    // Update the allocation
    allocation.actual_spent = actual_spent;
    if (notes) {
      allocation.notes = notes;
    }
    await allocation.save();

    // Calculate utilization percentage
    const utilization = allocation.allocated_amount > 0
      ? Math.round((actual_spent / allocation.allocated_amount) * 100)
      : 0;

    // Emit real-time update
    emitToUpdates('allocation:updated', {
      allocation: allocation.toObject(),
      utilization: `${utilization}%`,
      isOverBudget: actual_spent > allocation.allocated_amount,
    });

    return successResponse(res, {
      data: allocation,
      utilization: `${utilization}%`,
      message: `Updated spending for ${allocation.allocated_to}: $${actual_spent.toFixed(2)}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record an expense (add to actual_spent)
 * POST /api/allocations/:id/expense
 */
export const recordExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return errorResponse(res, 400, 'amount must be a positive number');
    }

    const allocation = await BudgetAllocation.findById(id);

    if (!allocation) {
      return errorResponse(res, 404, 'Allocation not found');
    }

    // Add to actual spent
    allocation.actual_spent = (allocation.actual_spent || 0) + amount;
    if (description) {
      allocation.notes = `${allocation.notes || ''} | Expense: ${description} ($${amount})`;
    }
    await allocation.save();

    // Calculate utilization
    const utilization = allocation.allocated_amount > 0
      ? Math.round((allocation.actual_spent / allocation.allocated_amount) * 100)
      : 0;

    // Emit real-time update
    emitToUpdates('allocation:expense', {
      allocation: allocation.toObject(),
      expenseAmount: amount,
      description,
      utilization: `${utilization}%`,
      isOverBudget: allocation.actual_spent > allocation.allocated_amount,
    });

    return successResponse(res, {
      data: allocation,
      expenseAdded: amount,
      newTotal: allocation.actual_spent,
      utilization: `${utilization}%`,
      message: `Recorded $${amount.toFixed(2)} expense for ${allocation.allocated_to}`,
    });
  } catch (error) {
    next(error);
  }
};

