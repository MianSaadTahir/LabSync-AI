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
export interface PeopleCosts {
    lead: {
        count: number;
        rate: number;
        hours: number;
        total: number;
    };
    manager: {
        count: number;
        rate: number;
        hours: number;
        total: number;
    };
    developer: {
        count: number;
        rate: number;
        hours: number;
        total: number;
    };
    designer: {
        count: number;
        rate: number;
        hours: number;
        total: number;
    };
    qa: {
        count: number;
        rate: number;
        hours: number;
        total: number;
    };
}
export interface ResourceCosts {
    electricity: number;
    rent: number;
    software_licenses: number;
    hardware: number;
    other: number;
}
export interface BudgetBreakdown {
    category: string;
    item: string;
    quantity: number;
    unit_cost: number;
    total: number;
}
export interface Budget {
    meetingId: string;
    project_name: string;
    total_budget: number;
    people_costs: PeopleCosts;
    resource_costs: ResourceCosts;
    breakdown: BudgetBreakdown[];
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
//# sourceMappingURL=index.d.ts.map