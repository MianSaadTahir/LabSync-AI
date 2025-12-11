import { AllocationCard } from "./AllocationCard";
import type { BudgetAllocationItem } from "@/types/allocation";

interface AllocationListProps {
  allocations: BudgetAllocationItem[];
}

export const AllocationList = ({ allocations }: AllocationListProps) => {
  if (!allocations.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        No allocations yet. Allocations will appear here when budgets are allocated to resources.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {allocations.map((allocation) => (
        <AllocationCard key={allocation._id} allocation={allocation} />
      ))}
    </div>
  );
};





