'use client';

import { useEffect, useState } from 'react';
import { MessageList } from "../components/MessageList";
import { StatusIndicator } from "../components/StatusIndicator";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useSocket } from "../hooks/useSocket";
import type { MessageItem } from "@/types/message";

export const MessagesClient = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const { isConnected, onMessageCreated, onStatusUpdated } = useSocket();

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.error("Failed to load messages:", res.status, res.statusText);
        setMessages([]);
        return;
      }
      const payload = await res.json();
      const fetchedMessages = payload.data ?? [];
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Messages fetch error:", error);
      // Don't clear messages on error, just log it
      // This prevents flickering when backend is temporarily unavailable
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Fallback polling if WebSocket is disconnected (every 10 seconds)
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Listen for WebSocket events
  useEffect(() => {
    const unsubscribe1 = onMessageCreated((data) => {
      if (data.message) {
        // Update messages list
        setMessages((prev) => {
          const index = prev.findIndex((m) => m._id === data.message!._id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.message!;
            return updated.sort((a, b) => 
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
          }
          return [data.message!, ...prev].sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        });
      }
    });

    const unsubscribe2 = onStatusUpdated((data) => {
      if (data.message) {
        // Update messages list
        setMessages((prev) => {
          const index = prev.findIndex((m) => m._id === data.message!._id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.message!;
            return updated.sort((a, b) => 
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
          }
          return prev;
        });
      }
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [onMessageCreated, onStatusUpdated]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <div className="text-center text-slate-500">Loading messages...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
              Inbox
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Telegram Messages</h1>
            <p className="text-slate-500">
              All messages received from Telegram are displayed here automatically.
            </p>
          </div>
          <ConnectionStatus baseUrl={baseUrl} />
        </div>
      </header>
      {messages.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">
            No messages found. Send a message to the Telegram bot to see it here.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Backend: {baseUrl}
          </p>
          <p className="mt-2 text-xs text-amber-600">
            💡 Make sure the backend server is running on {baseUrl}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Processing Status {isConnected ? '(Real-time updates via WebSocket)' : '(Polling every 10s - WebSocket disconnected)'}
            </p>
            <div className="space-y-2">
              {messages.slice(0, 3).map((msg) => (
                <div key={msg._id} className="flex items-center justify-between bg-white p-2 rounded">
                  <span className="text-sm text-slate-700">
                    {msg.meeting_details?.project_name || msg.text.substring(0, 50)}...
                  </span>
                  <StatusIndicator 
                    module1={msg.module1_status}
                    module2={msg.module2_status}
                    module3={msg.module3_status}
                  />
                </div>
              ))}
            </div>
          </div>
          <MessageList messages={messages} />
        </>
      )}
    </main>
  );
};

