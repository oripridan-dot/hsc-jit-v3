import React from 'react';

interface ConfidenceMeterProps {
  score: number; // 0 to 1
  reasoning?: string[];
  animate?: boolean;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ score, reasoning = [], animate = true }) => {
  const percentage = Math.round(score * 100);
  
  let colorClass = 'bg-red-500';
  let label = 'Low Confidence';
  
  if (percentage >= 90) {
    colorClass = 'bg-green-600';
    label = 'Very High';
  } else if (percentage >= 75) {
    colorClass = 'bg-green-400';
    label = 'High';
  } else if (percentage >= 60) {
    colorClass = 'bg-yellow-400';
    label = 'Medium';
  } else if (percentage >= 40) {
    colorClass = 'bg-orange-400';
    label = 'Low';
  }

  return (
    <div className="w-full p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm animate-fade-in-up">
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
        <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
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
