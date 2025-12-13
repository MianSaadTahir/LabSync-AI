'use client';

import { useSocket } from '../hooks/useSocket';

export function SocketStatus() {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`h-2 w-2 rounded-full ${
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
      }`} />
      <span className={`font-medium ${
        isConnected ? 'text-green-700' : 'text-yellow-700'
      }`}>
        {isConnected ? 'Live' : 'Connecting...'}
      </span>
    </div>
  );
}



