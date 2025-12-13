'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BudgetItem } from '@/types/budget';

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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface BudgetDetailClientProps {
  budgetId: string;
}

export const BudgetDetailClient = ({ budgetId }: BudgetDetailClientProps) => {
  const router = useRouter();
  const [budget, setBudget] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${baseUrl}/api/budgets/${budgetId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError('Budget not found');
          } else {
            setError('Failed to load budget');
          }
          return;
        }

        const payload = await res.json();
        setBudget(payload.data);
      } catch (err) {
        console.error("Budget fetch error:", err);
        setError('Error loading budget');
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [budgetId, baseUrl]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <div className="text-center text-slate-500">Loading budget details...</div>
      </main>
    );
  }

  if (error || !budget) {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-900 font-medium">{error || 'Budget not found'}</p>
          <Link
            href="/budgets"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 underline"
          >
            ← Back to Budgets
          </Link>
        </div>
      </main>
    );
  }

  const peopleTotal = Object.values(budget.people_costs).reduce(
    (sum, role) => sum + (role.total || 0),
    0
  );

  const resourceTotal = Object.values(budget.resource_costs).reduce(
    (sum, cost) => sum + (cost || 0),
    0
  );

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="space-y-3">
        <Link
          href="/budgets"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Budgets
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
            Budget Details
          </p>
          <h1 className="text-3xl font-bold text-slate-900">{budget.project_name}</h1>
        </div>
      </header>

      {/* Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-slate-500 mb-1">Total Budget</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(budget.total_budget)}
            </p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-slate-500 mb-1">People Costs</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(peopleTotal)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {((peopleTotal / budget.total_budget) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-slate-500 mb-1">Resource Costs</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(resourceTotal)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {((resourceTotal / budget.total_budget) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      </div>

      {/* People Costs Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">People Costs Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Count</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Rate/Hour</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Hours</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(budget.people_costs).map(([role, cost]) => (
                <tr key={role} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 capitalize">
                    {role}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">
                    {cost.count}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">
                    {formatCurrency(cost.rate)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">
                    {cost.hours.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                    {formatCurrency(cost.total)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 font-bold">
                <td colSpan={4} className="py-3 px-4 text-sm text-slate-900">
                  Total People Costs
                </td>
                <td className="py-3 px-4 text-sm text-slate-900 text-right">
                  {formatCurrency(peopleTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Costs Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Resource Costs Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(budget.resource_costs).map(([resource, cost]) => (
            <div
              key={resource}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200"
            >
              <span className="text-sm font-medium text-slate-700 capitalize">
                {resource.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(cost)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border-2 border-blue-200 font-bold">
            <span className="text-sm text-blue-900">Total Resource Costs</span>
            <span className="text-sm text-blue-900">
              {formatCurrency(resourceTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {budget.breakdown && budget.breakdown.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Detailed Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Item</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Unit Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {budget.breakdown.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{item.category}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{item.item}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Designed By</p>
            <p className="text-slate-600">{budget.designed_by}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-1">Designed At</p>
            <p className="text-slate-600">{formatDate(budget.designed_at)}</p>
          </div>
          {budget.createdAt && (
            <div>
              <p className="font-semibold text-slate-700 mb-1">Created</p>
              <p className="text-slate-600">{formatDate(budget.createdAt)}</p>
            </div>
          )}
          {budget.updatedAt && (
            <div>
              <p className="font-semibold text-slate-700 mb-1">Last Updated</p>
              <p className="text-slate-600">{formatDate(budget.updatedAt)}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};


