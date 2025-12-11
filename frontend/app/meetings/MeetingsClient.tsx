'use client';

import { useEffect, useState } from 'react';
import { MeetingList } from "../components/MeetingList";
import { useSocket } from "../hooks/useSocket";
import type { MeetingItem } from "@/types/meeting";

export const MeetingsClient = () => {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const { isConnected, onMeetingExtracted, onStatusUpdated } = useSocket();

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
    } catch (error) {
      console.error("Meetings fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchMeetings();
  }, []);

  // Fallback polling if WebSocket is disconnected (every 10 seconds)
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(fetchMeetings, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Listen for WebSocket events
  useEffect(() => {
    const unsubscribe1 = onMeetingExtracted((data) => {
      if (data.meeting) {
        // Refresh meetings list
        fetchMeetings();
      }
    });

    const unsubscribe2 = onStatusUpdated((data) => {
      if (data.message && data.message.module2_status === 'designed') {
        // Refresh meetings list when budget is designed (status update)
        fetchMeetings();
      }
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [onMeetingExtracted, onStatusUpdated]);

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
            {isConnected ? '🟢 Real-time updates' : '🟡 Polling every 10s'}
          </div>
        </div>
      </header>
      <MeetingList meetings={meetings} />
    </main>
  );
};

