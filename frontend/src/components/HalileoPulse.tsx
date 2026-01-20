/**
 * HalileoPulse - Mission Control Intelligence Display
 * 
 * Visual representation of the Halileo "Brain" (useHalileo hook)
 * Displays context-aware insights based on:
 * - Product intelligence tags
 * - User actions
 * - System state
 * 
 * Design: Floating notification with dynamic styling
 * Animation: Smooth slide-in from top
 * 
 * v3.7 - Static Intelligence Layer
 */
import React from 'react';
import { useHalileo } from '../hooks/useHalileo';
import { FiCpu, FiInfo, FiCheckCircle, FiZap } from 'react-icons/fi';

export const HalileoPulse: React.FC = () => {
  const { insight } = useHalileo();

  if (!insight) return null;

  // Dynamic styling based on insight type
  const styles = {
    info: 'border-l-4 border-blue-400 bg-blue-950/40 text-blue-100',
    tip: 'border-l-4 border-amber-400 bg-amber-950/40 text-amber-100',
    success: 'border-l-4 border-emerald-400 bg-emerald-950/40 text-emerald-100',
    alert: 'border-l-4 border-red-400 bg-red-950/40 text-red-100',
  };

  const icons = {
    info: <FiCpu className="animate-pulse text-blue-400" />,
    tip: <FiZap className="text-amber-400" />,
    success: <FiCheckCircle className="text-emerald-400" />,
    alert: <FiInfo className="text-red-400" />,
  };

  return (
    <div 
      className={`
        flex items-center gap-3 p-3 sm:p-4 rounded border 
        transition-all duration-300
        ${styles[insight.type] || styles.info}
      `}
    >
      {/* Icon */}
      <div className="text-lg opacity-80">
        {icons[insight.type]}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* System Label */}
        <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider opacity-70 mb-0.5 font-bold">
          🧠 Halileo // System
        </div>
        
        {/* Insight Message */}
        <div className="text-sm sm:text-base font-medium leading-snug">
          {insight.message}
        </div>
      </div>

      {/* Optional Action Button */}
      {insight.action && (
        <button 
          onClick={insight.action.onClick}
          className="
            px-3 py-1.5 text-xs font-bold uppercase tracking-wide 
            bg-white/10 hover:bg-white/20 rounded 
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-white/30
          "
        >
          {insight.action.label}
        </button>
      )}
    </div>
  );
};
