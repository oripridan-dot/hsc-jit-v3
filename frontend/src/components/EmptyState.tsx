import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { BrandIcon } from './BrandIcon';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Brand-aware empty state component
 * Shows when no data is available with branded styling
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
      {/* Icon container */}
      <div 
        className="mb-4 p-6 rounded-full"
        style={{
          backgroundColor: 'var(--color-brand-primary)',
          backgroundImage: `linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))`,
          opacity: 0.1
        }}
      >
        <BrandIcon icon={icon} variant="primary" size={48} />
      </div>

      {/* Title */}
      <h3 
        className="text-xl font-bold mb-2"
        style={{ color: 'var(--color-brand-text)' }}
      >
        {title}
      </h3>

      {/* Description */}
      <p 
        className="text-sm mb-6 max-w-md"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
          style={{
            backgroundColor: 'var(--color-brand-primary)',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            target.style.backgroundColor = 'var(--color-brand-secondary)';
            target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget;
            target.style.backgroundColor = 'var(--color-brand-primary)';
            target.style.transform = 'translateY(0)';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
