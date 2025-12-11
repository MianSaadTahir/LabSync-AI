import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBudgetAllocation extends Document {
  budgetId: Types.ObjectId;
  allocated_to: string;
  category: string;
  allocated_amount: number;
  actual_spent: number;
  allocated_at: Date;
  allocated_by: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetAllocationSchema = new Schema<IBudgetAllocation>(
  {
    budgetId: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
      required: true,
    },
    allocated_to: { type: String, required: true },
    category: { type: String, required: true },
    allocated_amount: { type: Number, required: true },
    actual_spent: { type: Number, default: 0 },
    allocated_at: { type: Date, default: Date.now },
    allocated_by: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Index for faster queries
BudgetAllocationSchema.index({ budgetId: 1 });
BudgetAllocationSchema.index({ allocated_to: 1 });
BudgetAllocationSchema.index({ category: 1 });

// Compound index for common queries
BudgetAllocationSchema.index({ budgetId: 1, category: 1 });

const BudgetAllocation: Model<IBudgetAllocation> = mongoose.model<IBudgetAllocation>(
  'BudgetAllocation',
  BudgetAllocationSchema
);

export default BudgetAllocation;





