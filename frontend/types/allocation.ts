export interface BudgetAllocationItem {
  _id: string;
  budgetId: string;
  allocated_to: string;
  category: string;
  allocated_amount: number;
  actual_spent: number;
  allocated_at: string;
  allocated_by: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}





