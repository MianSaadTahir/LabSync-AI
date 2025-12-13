import mongoose, { Schema, Document, Model, Types, CallbackWithoutResult } from 'mongoose';

export interface IPeopleCost {
  count: number;
  rate: number;
  hours: number;
  total: number;
}

export interface IBudgetBreakdown {
  category: string;
  item: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface IBudget extends Document {
  meetingId: Types.ObjectId;
  project_name: string;
  total_budget: number;
  people_costs: Map<string, IPeopleCost>;
  resource_costs: Map<string, number>;
  breakdown: IBudgetBreakdown[];
  designed_at: Date;
  designed_by: string;
  createdAt: Date;
  updatedAt: Date;
}

const PeopleCostSchema = new Schema<IPeopleCost>(
  {
    count: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const BudgetBreakdownSchema = new Schema<IBudgetBreakdown>(
  {
    category: { type: String, required: true },
    item: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit_cost: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const BudgetSchema = new Schema<IBudget>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      unique: true,
    },
    project_name: { type: String, required: true },
    total_budget: { type: Number, required: true },
    people_costs: {
      type: Map,
      of: PeopleCostSchema,
      default: {},
    },
    resource_costs: {
      type: Map,
      of: Number,
      default: {},
    },
    breakdown: [BudgetBreakdownSchema],
    designed_at: { type: Date, default: Date.now },
    designed_by: { type: String, default: 'BudgetDesignAgent' },
  },
  { timestamps: true }
);

// Index for faster queries (meetingId already has unique index from unique: true)
BudgetSchema.index({ project_name: 1 });
BudgetSchema.index({ total_budget: 1 });

const Budget: Model<IBudget> = mongoose.model<IBudget>('Budget', BudgetSchema);

export default Budget;

