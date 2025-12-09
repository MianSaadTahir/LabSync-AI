'use client';

import { useEffect, useState } from 'react';
import { AllocationList } from "../components/AllocationList";
import type { BudgetAllocationItem } from "@/types/allocation";

export const AllocationsClient = () => {
  const [allocations, setAllocations] = useState<BudgetAllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchAllocations = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/allocations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.error("Failed to load allocations:", res.status, res.statusText);
        setAllocations([]);
        return;
      }
      const payload = await res.json();
      setAllocations(payload.data ?? []);
    } catch (error) {
      console.error("Allocations fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
    // Auto-refresh every 5 seconds (reduced to prevent excessive API calls)
    const interval = setInterval(fetchAllocations, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <div className="text-center text-slate-500">Loading allocations...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
              Module 3
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Budget Allocations</h1>
            <p className="text-slate-500">
              Track budget allocation to actual resources used (auto-updates).
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Auto-refreshing every 5s
          </div>
        </div>
      </header>
      <AllocationList allocations={allocations} />
    </main>
  );
};

