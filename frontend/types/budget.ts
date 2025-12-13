export interface PeopleCost {
  count: number;
  rate: number;
  hours: number;
  total: number;
}

export type PeopleCosts = Record<string, PeopleCost>;

export type ResourceCosts = Record<string, number>;

export interface BudgetBreakdown {
  category: string;
  item: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface BudgetItem {
  _id: string;
  meetingId: string;
  project_name: string;
  total_budget: number;
  people_costs: PeopleCosts;
  resource_costs: ResourceCosts;
  breakdown: BudgetBreakdown[];
  designed_at: string;
  designed_by: string;
  createdAt?: string;
  updatedAt?: string;
}





