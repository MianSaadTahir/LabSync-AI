'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BudgetList } from "../components/BudgetList";
import type { BudgetItem } from "@/types/budget";

export const BudgetsClient = () => {
  const router = useRouter();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/budgets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.error("Failed to load budgets:", res.status, res.statusText);
        setBudgets([]);
        return;
      }
      const payload = await res.json();
      setBudgets(payload.data ?? []);
      
      // Check if allocation is done and auto-navigate
      const messagesRes = await fetch(`${baseUrl}/api/messages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        const messages = messagesData.data || [];
        if (messages.length > 0) {
          const latest = messages[0];
          if (latest.module3_status === 'allocated') {
            // Wait a moment then navigate to allocations
            setTimeout(() => {
              router.push('/allocations');
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error("Budgets fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    // Auto-refresh every 5 seconds (reduced to prevent excessive API calls)
    const interval = setInterval(fetchBudgets, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <div className="text-center text-slate-500">Loading budgets...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
              Module 2
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Budgets</h1>
            <p className="text-slate-500">
              Designed budgets with people and resource costs (auto-updates).
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Auto-refreshing every 5s
          </div>
        </div>
      </header>
      <BudgetList budgets={budgets} />
    </main>
  );
};

