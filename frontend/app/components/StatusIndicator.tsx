'use client';

interface StatusIndicatorProps {
  module1?: 'pending' | 'extracted' | 'failed';
  module2?: 'pending' | 'designed' | 'failed';
  module3?: 'pending' | 'allocated' | 'failed';
}

export const StatusIndicator = ({ module1, module2, module3 }: StatusIndicatorProps) => {
  const getStatusColor = (status?: string) => {
    if (status === 'extracted' || status === 'designed' || status === 'allocated') {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (status === 'failed') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'extracted' || status === 'designed' || status === 'allocated') {
      return '✓';
    }
    if (status === 'failed') {
      return '✗';
    }
    return '⏳';
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {module1 && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(module1)}`}>
          {getStatusIcon(module1)} Module 1: {module1}
        </span>
      )}
      {module2 && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(module2)}`}>
          {getStatusIcon(module2)} Module 2: {module2}
        </span>
      )}
      {module3 && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(module3)}`}>
          {getStatusIcon(module3)} Module 3: {module3}
        </span>
      )}
    </div>
  );
};



