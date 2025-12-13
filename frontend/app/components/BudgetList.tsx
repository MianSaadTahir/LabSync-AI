import { BudgetCard } from "./BudgetCard";
import type { BudgetItem } from "@/types/budget";

interface BudgetListProps {
  budgets: BudgetItem[];
}

export const BudgetList = ({ budgets }: BudgetListProps) => {
  if (!budgets.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        No budgets designed yet. Budgets will appear here after meetings are processed.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {budgets.map((budget) => (
        <BudgetCard key={budget._id} budget={budget} />
      ))}
    </div>
  );
};





