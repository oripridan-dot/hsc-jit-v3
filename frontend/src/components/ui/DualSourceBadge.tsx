import React from 'react';

// Inline SVG Icon Components
const CheckCircle2 = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 11 12 14 22 4" />
  </svg>
);

const Globe = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const Package = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

interface DualSourceBadgeProps {
  classification?: 'PRIMARY' | 'SECONDARY' | 'HALILIT_ONLY';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
}

export const DualSourceBadge: React.FC<DualSourceBadgeProps> = ({ 
  classification = 'PRIMARY', 
  size = 'md',
  showIcon = true,
  showTooltip = true
}) => {
  const configs = {
    PRIMARY: {
      icon: CheckCircle2,
      label: 'Official + Price',
      color: 'emerald',
      bgClass: 'bg-emerald-500/20 border-emerald-500/40',
      textClass: 'text-emerald-300',
      tooltip: 'Found on both brand website AND Halilit distributor'
    },
    SECONDARY: {
      icon: Globe,
      label: 'Brand Direct',
      color: 'violet',
      bgClass: 'bg-violet-500/20 border-violet-500/40',
      textClass: 'text-violet-300',
      tooltip: 'Found on brand website only, not in Halilit catalog'
    },
    HALILIT_ONLY: {
      icon: Package,
      label: 'Available from Distributor',
      color: 'amber',
      bgClass: 'bg-amber-500/20 border-amber-500/40',
      textClass: 'text-amber-300',
      tooltip: 'Found in Halilit catalog only, not on brand website'
    }
  };

  const config = configs[classification];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="relative group inline-block">
      <div className={`
        inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide
        ${config.bgClass} ${config.textClass} ${sizeClasses[size]}
      `}>
        {showIcon && <Icon className={iconSizes[size]} />}
        <span>{config.label}</span>
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {config.tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

