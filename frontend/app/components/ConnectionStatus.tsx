'use client';

import { useEffect, useState } from 'react';

interface ConnectionStatusProps {
  baseUrl: string;
}

export const ConnectionStatus = ({ baseUrl }: ConnectionStatusProps) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setIsConnected(res.ok);
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds (reduced frequency)
    return () => clearInterval(interval);
  }, [baseUrl]);

  if (isConnected === null) {
    return (
      <div className="text-xs text-slate-400">
        Checking connection...
      </div>
    );
  }

  return (
    <div className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      {isConnected ? (
        <span>🟢 Backend connected</span>
      ) : (
        <span>🔴 Backend disconnected - Check {baseUrl}</span>
      )}
    </div>
  );
};

