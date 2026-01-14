/**
 * Button Component
 * Multi-variant button component with professional interactions
 * Variants: Solid, Ghost, Knob (icon)
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'ghost' | 'knob';
  size?: 'sm' | 'md' | 'lg';
  accent?: 'primary' | 'secondary' | 'success' | 'warning';
  icon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'solid',
  size = 'md',
  accent = 'primary',
  icon,
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled = false,
  children,
  ...props
}) => {
  // ===== SIZE VARIANTS =====
  const sizeMap = {
    sm: {
      solid: 'px-3 py-1.5 text-xs',
      ghost: 'px-3 py-1.5 text-xs',
      knob: 'w-8 h-8',
    },
    md: {
      solid: 'px-4 py-2.5 text-sm',
      ghost: 'px-4 py-2.5 text-sm',
      knob: 'w-10 h-10',
    },
    lg: {
      solid: 'px-6 py-3 text-base',
      ghost: 'px-6 py-3 text-base',
      knob: 'w-12 h-12',
    },
  };

  // ===== ACCENT COLOR MAPS =====
  const accentMap = {
    primary: {
      solid: {
        bg: 'bg-accent-primary hover:opacity-90',
        text: 'text-black',
        border: '',
      },
      ghost: {
        bg: 'bg-transparent hover:bg-accent-primary/10',
        text: 'text-accent-primary hover:text-accent-primary',
        border: 'border border-accent-primary/50 hover:border-accent-primary',
      },
      knob: {
        bg: 'bg-accent-primary/10 hover:bg-accent-primary/20',
        text: 'text-accent-primary',
        border: 'border border-accent-primary/30 hover:border-accent-primary/50',
      },
    },
    secondary: {
      solid: {
        bg: 'bg-accent-secondary hover:opacity-90',
        text: 'text-white',
        border: '',
      },
      ghost: {
        bg: 'bg-transparent hover:bg-accent-secondary/10',
        text: 'text-accent-secondary hover:text-accent-secondary',
        border: 'border border-accent-secondary/50 hover:border-accent-secondary',
      },
      knob: {
        bg: 'bg-accent-secondary/10 hover:bg-accent-secondary/20',
        text: 'text-accent-secondary',
        border: 'border border-accent-secondary/30 hover:border-accent-secondary/50',
      },
    },
    success: {
      solid: {
        bg: 'bg-accent-success hover:opacity-90',
        text: 'text-black',
        border: '',
      },
      ghost: {
        bg: 'bg-transparent hover:bg-accent-success/10',
        text: 'text-accent-success hover:text-accent-success',
        border: 'border border-accent-success/50 hover:border-accent-success',
      },
      knob: {
        bg: 'bg-accent-success/10 hover:bg-accent-success/20',
        text: 'text-accent-success',
        border: 'border border-accent-success/30 hover:border-accent-success/50',
      },
    },
    warning: {
      solid: {
        bg: 'bg-accent-warning hover:opacity-90',
        text: 'text-white',
        border: '',
      },
      ghost: {
        bg: 'bg-transparent hover:bg-accent-warning/10',
        text: 'text-accent-warning hover:text-accent-warning',
        border: 'border border-accent-warning/50 hover:border-accent-warning',
      },
      knob: {
        bg: 'bg-accent-warning/10 hover:bg-accent-warning/20',
        text: 'text-accent-warning',
        border: 'border border-accent-warning/30 hover:border-accent-warning/50',
      },
    },
  };

  // ===== DISABLED STYLES =====
  const disabledClass = disabled
    ? 'opacity-50 cursor-not-allowed hover:opacity-50'
    : 'cursor-pointer active:scale-95 transition-transform duration-150';

  // ===== GET VARIANT STYLES =====
  const variantStyle = accentMap[accent][variant];
  const sizeClass = sizeMap[size][variant];

  // ===== BUILD BASE CLASSES =====
  const baseClasses = {
    solid: `
      ${sizeClass}
      ${variantStyle.bg}
      ${variantStyle.text}
      font-semibold
      rounded-lg
      transition-all duration-300 ease-out
      ${disabledClass}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `,
    ghost: `
      ${sizeClass}
      ${variantStyle.bg}
      ${variantStyle.text}
      ${variantStyle.border}
      font-semibold
      rounded-lg
      transition-all duration-300 ease-out
      ${disabledClass}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `,
    knob: `
      ${sizeClass}
      ${variantStyle.bg}
      ${variantStyle.text}
      ${variantStyle.border}
      rounded-full
      flex items-center justify-center
      transition-all duration-300 ease-out
      ${disabledClass}
      ${className}
    `,
  };

  return (
    <button
      className={baseClasses[variant]}
      disabled={disabled || isLoading}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {isLoading && (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M4 12a8 8 0 018-8v0a8 8 0 018 8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </div>
    </button>
  );
};

// ============================================================================
// BUTTON GROUP - For grouping related buttons
// ============================================================================

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  size?: 'sm' | 'md' | 'lg';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  direction = 'row',
  size = 'md',
  className = '',
  ...props
}) => {
  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';

  return (
    <div
      className={`flex ${directionClass} gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Button;
