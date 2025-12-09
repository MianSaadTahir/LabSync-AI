'use client';

import { useEffect, useState } from 'react';

interface AutoRefreshWrapperProps {
  children: React.ReactNode;
  refreshInterval?: number; // in milliseconds
  onRefresh?: () => void;
}

export const AutoRefreshWrapper = ({ 
  children, 
  refreshInterval = 3000, // Default 3 seconds
  onRefresh 
}: AutoRefreshWrapperProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      onRefresh?.();
      // Force Next.js to revalidate the page
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  return <>{children}</>;
};

