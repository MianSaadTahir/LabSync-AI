// Shared types for LabSync AI Budgeting System

export interface MeetingDetails {
  project_name: string;
  client_details: {
    name: string;
    email?: string;
    company?: string;
  };
  meeting_date: Date | string;
  participants: string[];
  estimated_budget: number;
  timeline: string;
  requirements: string;
}

export interface PeopleCostItem {
  count: number;
  rate: number;
  hours: number;
  total: number;
}

export type PeopleCosts = Record<string, PeopleCostItem>;

export type ResourceCosts = Record<string, number>;

export interface BudgetBreakdown {
  category: string;
  item: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface BudgetDesign {
  total_budget: number;
  people_costs: PeopleCosts;
  resource_costs: ResourceCosts;
  breakdown: BudgetBreakdown[];
}

export interface Budget extends BudgetDesign {
  meetingId: string;
  project_name: string;
  designed_at: Date;
  designed_by: string;
}

export interface BudgetAllocation {
  budgetId: string;
  allocated_to: string;
  category: string;
  allocated_amount: number;
  actual_spent: number;
  allocated_at: Date;
  allocated_by: string;
}

export type ModuleStatus = 'pending' | 'extracted' | 'designed' | 'allocated' | 'failed';





