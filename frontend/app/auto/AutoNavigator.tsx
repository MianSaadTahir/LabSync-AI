'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MessageItem } from '@/types/message';

export const AutoNavigator = () => {
  const router = useRouter();
  const [status, setStatus] = useState<string>('checking...');
  const [latestMessage, setLatestMessage] = useState<MessageItem | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const checkAndNavigate = async () => {
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
            
            // Navigate based on status
            if (!latest.module1_status || latest.module1_status === 'pending') {
              setStatus('Message received - showing inbox...');
              router.push('/messages');
              return;
            }
            
            if (latest.module1_status === 'extracted' && latest.module2_status !== 'designed') {
              setStatus('Meeting extracted - showing meetings...');
              router.push('/meetings');
              return;
            }
            
            if (latest.module2_status === 'designed' && latest.module3_status !== 'allocated') {
              setStatus('Budget designed - showing budgets...');
              router.push('/budgets');
              return;
            }
            
            if (latest.module3_status === 'allocated') {
              setStatus('Budget allocated - showing allocations...');
              router.push('/allocations');
              return;
            }
          } else {
            setStatus('No messages yet - waiting...');
            router.push('/messages');
          }
        }
      } catch (error) {
        console.error('Auto-navigation error:', error);
        setStatus('Error checking status');
      }
    };

    checkAndNavigate();
    // Check every 3 seconds and navigate if status changed
    const interval = setInterval(checkAndNavigate, 3000);
    return () => clearInterval(interval);
  }, [router, baseUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mb-4 text-4xl">🔄</div>
        <h1 className="text-2xl font-bold text-slate-900">Auto-Navigating</h1>
        <p className="mt-2 text-slate-600">{status}</p>
        {latestMessage && (
          <div className="mt-4 rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-slate-500">Latest Message Status:</p>
            <div className="mt-2 flex gap-2 justify-center">
              <span className={`px-2 py-1 rounded text-xs ${
                latestMessage.module1_status === 'extracted' ? 'bg-green-100 text-green-800' : 
                latestMessage.module1_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-slate-100 text-slate-600'
              }`}>
                Module 1: {latestMessage.module1_status || 'pending'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                latestMessage.module2_status === 'designed' ? 'bg-green-100 text-green-800' : 
                latestMessage.module2_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-slate-100 text-slate-600'
              }`}>
                Module 2: {latestMessage.module2_status || 'pending'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                latestMessage.module3_status === 'allocated' ? 'bg-green-100 text-green-800' : 
                latestMessage.module3_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-slate-100 text-slate-600'
              }`}>
                Module 3: {latestMessage.module3_status || 'pending'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



