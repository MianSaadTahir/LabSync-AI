import type { BudgetAllocationItem } from "@/types/allocation";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Unknown date";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface AllocationCardProps {
  allocation: BudgetAllocationItem;
}

export const AllocationCard = ({ allocation }: AllocationCardProps) => {
  const utilization = allocation.allocated_amount > 0
    ? (allocation.actual_spent / allocation.allocated_amount) * 100
    : 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {allocation.allocated_to}
        </h3>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {allocation.category}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Allocated Amount</p>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(allocation.allocated_amount)}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">Actual Spent</p>
          <p className="text-lg font-bold text-slate-900">
            {formatCurrency(allocation.actual_spent)}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">Utilization</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  utilization > 100 ? "bg-red-500" : utilization > 80 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {utilization.toFixed(1)}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">Allocated by</p>
          <p className="text-sm text-slate-600">{allocation.allocated_by}</p>
        </div>

        {allocation.notes && (
          <div>
            <p className="text-sm font-semibold text-slate-700">Notes</p>
            <p className="text-sm text-slate-600">{allocation.notes}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Allocated: {formatDate(allocation.allocated_at)}
      </p>
    </article>
  );
};





