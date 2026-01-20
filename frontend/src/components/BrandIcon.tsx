import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface BrandIconProps {
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
  size?: number;
  className?: string;
}

/**
 * BrandIcon - Lucide icon wrapper that applies brand colors via CSS custom properties
 * Automatically inherits current brand theme color
 * 
 * @param icon - Lucide icon component
 * @param variant - Color variant ('primary', 'secondary', 'accent', 'neutral')
 * @param size - Icon size in pixels (default 24)
 * @param className - Additional Tailwind classes
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  icon: Icon,
  variant = 'primary',
  size = 24,
  className = ''
}) => {
  const variantClasses = {
    primary: 'text-[var(--color-brand-primary)]',
    secondary: 'text-[var(--color-brand-secondary)]',
    accent: 'text-[var(--color-brand-accent)]',
    neutral: 'text-[var(--color-brand-text)]'
  };

  return (
    <Icon 
      size={size} 
      className={`${variantClasses[variant]} transition-colors duration-300 ${className}`}
      strokeWidth={1.5}
    />
  );
};

export default BrandIcon;
