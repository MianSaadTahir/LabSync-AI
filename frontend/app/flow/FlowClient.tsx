'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MessageItem } from '@/types/message';
import type { MeetingItem } from '@/types/meeting';
import type { BudgetItem } from '@/types/budget';
import { StatusIndicator } from '../components/StatusIndicator';

export const FlowClient = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'message' | 'meeting' | 'budget' | 'allocation'>('message');
  const [latestMessage, setLatestMessage] = useState<MessageItem | null>(null);
  const [latestMeeting, setLatestMeeting] = useState<MeetingItem | null>(null);
  const [latestBudget, setLatestBudget] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  const fetchLatestData = async () => {
    try {
      // Fetch latest message
      const messagesRes = await fetch(`${baseUrl}/api/messages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        const messages = messagesData.data || [];
        if (messages.length > 0) {
          const latest = messages[0];
          setLatestMessage(latest);

          // Auto-advance based on status
          if (latest.module1_status === 'extracted') {
            // Fetch meeting
            const meetingsRes = await fetch(`${baseUrl}/api/meetings`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            if (meetingsRes.ok) {
              const meetingsData = await meetingsRes.json();
              const meetings = meetingsData.data || [];
              // Find meeting by messageId (handle both populated and non-populated)
              const meeting = meetings.find((m: any) => {
                const msgId = m.messageId?._id || m.messageId;
                return msgId === latest._id || msgId?.toString() === latest._id?.toString();
              }) || meetings[0];
              
              if (meeting) {
                setLatestMeeting(meeting);
                setCurrentStep('meeting');

                // If budget is designed, move to budget step
                if (latest.module2_status === 'designed') {
                  // Fetch budget
                  const budgetsRes = await fetch(`${baseUrl}/api/budgets`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                  });
                  if (budgetsRes.ok) {
                    const budgetsData = await budgetsRes.json();
                    const budgets = budgetsData.data || [];
                    // Find budget by meetingId (handle both populated and non-populated)
                    const budget = budgets.find((b: any) => {
                      const mtgId = b.meetingId?._id || b.meetingId;
                      return mtgId === meeting._id || mtgId?.toString() === meeting._id?.toString();
                    }) || budgets[0];
                    
                    if (budget) {
                      setLatestBudget(budget);
                      setCurrentStep('budget');

                      // If allocation is done, move to allocation step
                      if (latest.module3_status === 'allocated') {
                        setCurrentStep('allocation');
                      }
                    }
                  }
                }
              }
            }
          } else {
            // Still on message step
            setCurrentStep('message');
          }
        }
      }
    } catch (error) {
      console.error('Flow fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestData();
    // Auto-refresh every 5 seconds (reduced from 2s to prevent excessive API calls)
    const interval = setInterval(fetchLatestData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8">
        <div className="text-center text-slate-500">Loading flow...</div>
      </main>
    );
  }

  if (!latestMessage) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">No messages yet. Send a message to your Telegram bot to start the flow.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { id: 'message', label: 'Message', icon: '📨' },
            { id: 'meeting', label: 'Meeting', icon: '🤝' },
            { id: 'budget', label: 'Budget', icon: '💰' },
            { id: 'allocation', label: 'Allocation', icon: '📊' },
          ].map((step, index, array) => {
            const isActive = currentStep === step.id;
            const isCompleted = 
              (step.id === 'message' && latestMessage) ||
              (step.id === 'meeting' && latestMessage?.module1_status === 'extracted') ||
              (step.id === 'budget' && latestMessage?.module2_status === 'designed') ||
              (step.id === 'allocation' && latestMessage?.module3_status === 'allocated');
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex flex-col items-center flex-1 ${
                    isActive ? 'scale-110' : ''
                  } transition-transform`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted && !isActive ? '✓' : step.icon}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <div className="mt-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  )}
                </div>
                {index < array.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Message - Always show if we have a message */}
      {latestMessage && (currentStep === 'message' || !latestMessage.module1_status || latestMessage.module1_status === 'pending') && (
        <div className="rounded-lg border-2 border-blue-500 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">📨 Message Received</h2>
            <StatusIndicator
              module1={latestMessage.module1_status}
              module2={latestMessage.module2_status}
              module3={latestMessage.module3_status}
            />
          </div>
          <div className="space-y-3">
            <p className="text-slate-700">{latestMessage.text}</p>
            <div className="text-sm text-slate-500">
              From: {latestMessage.sender_id} | {new Date(latestMessage.date_received || latestMessage.createdAt || '').toLocaleString()}
            </div>
            {latestMessage.module1_status === 'pending' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">⏳ Extracting meeting details...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Meeting - Show when extracted */}
      {latestMessage?.module1_status === 'extracted' && latestMeeting && (currentStep === 'meeting' || currentStep === 'budget' || currentStep === 'allocation') && (
        <div className="rounded-lg border-2 border-green-500 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">🤝 Meeting Extracted</h2>
            <StatusIndicator
              module1={latestMessage?.module1_status}
              module2={latestMessage?.module2_status}
              module3={latestMessage?.module3_status}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-semibold text-slate-600">Project:</span>
              <p className="text-lg font-bold text-slate-900">{latestMeeting.project_name}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-600">Client:</span>
              <p className="text-lg text-slate-900">
                {latestMeeting.client_details?.name}
                {latestMeeting.client_details?.company && ` (${latestMeeting.client_details.company})`}
              </p>
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-600">Budget:</span>
              <p className="text-lg font-bold text-green-600">
                ${latestMeeting.estimated_budget?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-600">Timeline:</span>
              <p className="text-lg text-slate-900">{latestMeeting.timeline}</p>
            </div>
          </div>
          {latestMeeting.requirements && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <span className="text-sm font-semibold text-slate-600">Requirements:</span>
              <p className="mt-2 text-slate-700">{latestMeeting.requirements}</p>
            </div>
          )}
          {latestMessage?.module2_status === 'pending' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">⏳ Designing budget...</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Budget - Show when designed */}
      {latestMessage?.module2_status === 'designed' && latestBudget && (currentStep === 'budget' || currentStep === 'allocation') && (
        <div className="rounded-lg border-2 border-purple-500 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">💰 Budget Designed</h2>
            <StatusIndicator
              module1={latestMessage?.module1_status}
              module2={latestMessage?.module2_status}
              module3={latestMessage?.module3_status}
            />
          </div>
          <div className="mb-6">
            <div className="text-3xl font-bold text-purple-600">
              ${latestBudget.total_budget?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-slate-500">Total Budget</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">People Costs</h3>
              <div className="space-y-2">
                {Object.entries(latestBudget.people_costs || {}).map(([role, cost]: [string, any]) => (
                  <div key={role} className="flex justify-between text-sm">
                    <span className="capitalize text-slate-600">{role}:</span>
                    <span className="font-semibold">${cost.total?.toLocaleString() || 0}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Resource Costs</h3>
              <div className="space-y-2">
                {Object.entries(latestBudget.resource_costs || {}).map(([resource, cost]: [string, any]) => (
                  <div key={resource} className="flex justify-between text-sm">
                    <span className="capitalize text-slate-600">{resource.replace('_', ' ')}:</span>
                    <span className="font-semibold">${cost?.toLocaleString() || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {latestBudget.breakdown && latestBudget.breakdown.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-slate-700 mb-3">Breakdown</h3>
              <div className="space-y-2">
                {latestBudget.breakdown.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                    <span className="text-slate-700">{item.item}</span>
                    <span className="font-semibold">${item.total?.toLocaleString() || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {latestMessage?.module3_status === 'pending' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">⏳ Allocating budget...</p>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Allocation - Show when allocated */}
      {latestMessage?.module3_status === 'allocated' && currentStep === 'allocation' && (
        <div className="rounded-lg border-2 border-indigo-500 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">📊 Budget Allocated</h2>
            <StatusIndicator
              module1={latestMessage?.module1_status}
              module2={latestMessage?.module2_status}
              module3={latestMessage?.module3_status}
            />
          </div>
          <div className="text-center py-8 text-slate-500">
            <p>Allocation details will appear here once Module 3 is implemented.</p>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-4 right-4 bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Auto-updating every 5s
        </div>
      </div>
    </main>
  );
};

