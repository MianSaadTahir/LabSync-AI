'use client';

import { useEffect, useState } from 'react';
import { BudgetList } from "../components/BudgetList";
import { useSocket } from "../hooks/useSocket";
import type { BudgetItem } from "@/types/budget";

export const BudgetsClient = () => {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const { isConnected, onBudgetDesigned, onStatusUpdated } = useSocket();

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
    } catch (error) {
      console.error("Budgets fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchBudgets();
  }, []);

  // Fallback polling if WebSocket is disconnected (every 10 seconds)
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(fetchBudgets, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Listen for WebSocket events
  useEffect(() => {
    const unsubscribe1 = onBudgetDesigned((data) => {
      if (data.budget) {
        // Refresh budgets list
        fetchBudgets();
      }
    });

    const unsubscribe2 = onStatusUpdated((data) => {
      if (data.message && data.message.module3_status === 'allocated') {
        // Refresh budgets list when allocation is done (status update)
        fetchBudgets();
      }
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [onBudgetDesigned, onStatusUpdated]);

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
            {isConnected ? '🟢 Real-time updates' : '🟡 Polling every 10s'}
          </div>
        </div>
      </header>
      <BudgetList budgets={budgets} />
    </main>
  );
};

