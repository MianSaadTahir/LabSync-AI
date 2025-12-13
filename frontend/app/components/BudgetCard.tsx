import Link from "next/link";
import type { BudgetItem } from "@/types/budget";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface BudgetCardProps {
  budget: BudgetItem;
}

export const BudgetCard = ({ budget }: BudgetCardProps) => {
  const peopleTotal = Object.values(budget.people_costs).reduce(
    (sum, role) => sum + (role.total || 0),
    0
  );

  const resourceTotal = Object.values(budget.resource_costs).reduce(
    (sum, cost) => sum + (cost || 0),
    0
  );

  return (
    <Link href={`/budgets/${budget._id}`}>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md cursor-pointer">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {budget.project_name}
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Total Budget</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(budget.total_budget)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500">People Costs</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(peopleTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Resource Costs</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(resourceTotal)}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500">Designed by</p>
            <p className="text-sm text-slate-600">{budget.designed_by}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Click to view details
        </p>
      </article>
    </Link>
  );
};





