'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { useSocket } from './hooks/useSocket';
import type { MessageItem } from '@/types/message';

export default function Home() {
  const { isConnected } = useSocket();
  const [statusMessage, setStatusMessage] = useState<MessageItem | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  // Fetch latest message on mount to show status
  useEffect(() => {
    const fetchLatestMessage = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/messages?limit=1`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const messages = data.data || [];
          if (messages.length > 0) {
            setStatusMessage(messages[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching latest message:', error);
      }
    };

    fetchLatestMessage();
  }, [baseUrl]);

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col justify-center gap-6 px-6 py-20">
      <p className="text-base font-semibold uppercase tracking-widest text-blue-500">
        LabSync AI
      </p>
      <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
        Smart Client Intake via Telegram
      </h1>
      <p className="text-lg text-slate-600 sm:max-w-2xl">
        Seamlessly capture client project requests sent through Telegram and
        display them on dashboard for your internal teams to process and
        allocate resources.
      </p>
      
      {/* Connection Status */}
      <div className={`rounded-lg border p-4 ${
        isConnected 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <p className={`font-medium ${
            isConnected ? 'text-green-900' : 'text-yellow-900'
          }`}>
            {isConnected ? '🟢 Connected (Real-time updates active)' : '🟡 Connecting...'}
          </p>
        </div>
      </div>

      {/* Status Display */}
      {statusMessage && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-blue-900 font-medium mb-3">
            Latest Message Status
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded text-xs ${
              statusMessage.module1_status === 'extracted' ? 'bg-green-100 text-green-800' : 
              statusMessage.module1_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-slate-100 text-slate-600'
            }`}>
              Module 1: {statusMessage.module1_status || 'pending'}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              statusMessage.module2_status === 'designed' ? 'bg-green-100 text-green-800' : 
              statusMessage.module2_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-slate-100 text-slate-600'
            }`}>
              Module 2: {statusMessage.module2_status || 'pending'}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              statusMessage.module3_status === 'allocated' ? 'bg-green-100 text-green-800' : 
              statusMessage.module3_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-slate-100 text-slate-600'
            }`}>
              Module 3: {statusMessage.module3_status || 'pending'}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-3">
            💡 All pages update in real-time via WebSocket. Navigate to any page to see live updates.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Link
          href="/messages"
          className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500"
        >
          View Messages
        </Link>
        <Link
          href="/meetings"
          className="rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow hover:bg-slate-300"
        >
          View Meetings
        </Link>
        <Link
          href="/budgets"
          className="rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow hover:bg-slate-300"
        >
          View Budgets
        </Link>
        <Link
          href="/allocations"
          className="rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow hover:bg-slate-300"
        >
          View Allocations
        </Link>
      </div>
    </main>
  );
}
