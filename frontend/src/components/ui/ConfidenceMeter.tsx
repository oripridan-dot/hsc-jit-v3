import React from 'react';

interface ConfidenceMeterProps {
  score: number; // 0 to 1
  reasoning?: string[];
  animate?: boolean;
  price?: number | string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ score, reasoning = [], animate = true, price }) => {
  const percentage = Math.round(score * 100);
  
  let colorClass = 'bg-red-500';
  let label = 'Low Confidence';
  
  // Tier System Implementation
  if (percentage === 100) {
    colorClass = 'bg-green-600';
    label = 'Verified Locally';
  } else if (percentage >= 80) {
    colorClass = 'bg-amber-500';
    label = 'Global Orphan';
  } else if (percentage >= 60) {
    colorClass = 'bg-gray-400';
    label = 'Legacy Item';
  } else {
    colorClass = 'bg-red-400';
    label = 'Unverified';
  }

  const containerClass = `w-full p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm ${animate ? 'animate-fade-in-up' : ''}`;

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700">🎯 AI Match Confidence</h3>
        <span className="text-xs text-gray-500 cursor-help" title="Based on model match, source verification, and data freshness">ⓘ Info</span>
      </div>
      
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div 
          className={`absolute top-0 left-0 h-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between items-end mb-3">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
          {percentage === 100 && price && (
             <span className="text-xs font-bold text-green-700 mt-1">
               ₪{Number(price).toLocaleString()} ILS
             </span>
          )}
        </div>
        <span className={`text-sm font-medium ${colorClass.replace('bg-', 'text-')}`}>{label}</span>
      </div>

      {reasoning.length > 0 && (
        <div className="space-y-1">
          {reasoning.map((reason, idx) => (
            <div key={idx} className="flex items-start text-xs text-gray-600 animate-slide-in-right" style={{ animationDelay: `${idx * 100}ms` }}>
              <span className="mr-1.5 text-green-500">✓</span>
              {reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
