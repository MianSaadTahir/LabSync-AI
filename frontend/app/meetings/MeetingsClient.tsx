'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MeetingList } from "../components/MeetingList";
import type { MeetingItem } from "@/types/meeting";
import type { MessageItem } from "@/types/message";

export const MeetingsClient = () => {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/meetings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.error("Failed to load meetings:", res.status, res.statusText);
        setMeetings([]);
        return;
      }
      const payload = await res.json();
      setMeetings(payload.data ?? []);
      
      // Check if budget is designed and auto-navigate
      const messagesRes = await fetch(`${baseUrl}/api/messages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        const messages = messagesData.data || [];
        if (messages.length > 0) {
          const latest = messages[0];
          if (latest.module2_status === 'designed') {
            // Wait a moment then navigate to budgets
            setTimeout(() => {
              router.push('/budgets');
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error("Meetings fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    // Auto-refresh every 5 seconds (reduced to prevent excessive API calls)
    const interval = setInterval(fetchMeetings, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <div className="text-center text-slate-500">Loading meetings...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
              Module 1
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Meetings</h1>
            <p className="text-slate-500">
              Extracted meeting details from Telegram messages (auto-updates).
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Auto-refreshing every 5s
          </div>
        </div>
      </header>
      <MeetingList meetings={meetings} />
    </main>
  );
};

