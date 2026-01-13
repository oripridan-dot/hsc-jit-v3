/**
 * Button Components
 * Consistent button styles and variants
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * Primary Button
 */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  isLoading = false,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-default focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary hover:bg-primary-hover text-white focus:ring-primary disabled:bg-overlay disabled:text-tertiary',
    secondary:
      'bg-overlay hover:bg-surface text-primary focus:ring-primary disabled:text-tertiary',
    ghost: 'hover:bg-elevated text-secondary hover:text-primary focus:ring-primary disabled:text-tertiary',
    danger:
      'bg-error hover:bg-red-600 text-white focus:ring-error disabled:bg-overlay disabled:text-tertiary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}

/**
 * Icon Button
 * For buttons that contain only an icon
 */
export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}: Omit<ButtonProps, 'leftIcon' | 'rightIcon'>) {
  const baseStyles =
    'flex items-center justify-center rounded-lg transition-default focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white focus:ring-primary',
    secondary: 'bg-overlay hover:bg-surface text-primary focus:ring-primary',
    ghost: 'hover:bg-elevated text-secondary hover:text-primary focus:ring-primary',
    danger: 'bg-error hover:bg-red-600 text-white focus:ring-error',
  };

  const sizes = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-3 w-12 h-12',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

/**
 * Button Group
 */
export function ButtonGroup({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}
