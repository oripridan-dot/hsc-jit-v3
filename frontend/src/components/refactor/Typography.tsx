/**
 * Typography Components
 * Consistent text rendering across the application
 */

import type { ReactNode, CSSProperties } from 'react';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type TextVariant = 'body' | 'caption' | 'overline' | 'code';

interface HeadingProps {
  level: HeadingLevel;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Heading Component
 * Use for page titles, section headers
 */
export function Heading({ level, children, className = '', style }: HeadingProps) {
  const baseStyles = 'font-bold text-primary';

  const sizeStyles = {
    h1: 'text-4xl leading-tight',
    h2: 'text-3xl leading-tight',
    h3: 'text-2xl leading-tight',
    h4: 'text-xl leading-normal',
    h5: 'text-lg leading-normal',
    h6: 'text-base leading-normal',
  };

  const Component = level;

  return (
    <Component
      className={`${baseStyles} ${sizeStyles[level]} ${className}`}
      style={style}
    >
      {children}
    </Component>
  );
}

interface TextProps {
  variant?: TextVariant;
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'label';
  style?: CSSProperties;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

/**
 * Text Component
 * Use for body copy, descriptions, labels
 */
export function Text({
  variant = 'body',
  children,
  className = '',
  as: Component = 'p',
  style,
  size,
}: TextProps) {
  const variantStyles = {
    body: 'text-base text-primary leading-relaxed',
    caption: 'text-sm text-secondary leading-normal',
    overline: 'text-xs text-tertiary uppercase tracking-wider font-semibold',
    code: 'font-mono text-sm text-tertiary bg-slate-900/50 px-2 py-1 rounded',
  };

  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <Component
      className={`${variantStyles[variant]} ${size ? sizeStyles[size] : ''} ${className}`}
      style={style}
    >
      {children}
    </Component>
  );
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

/**
 * Badge Component
 * Use for status labels, tags, counters
 */
export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-overlay text-secondary border border-border/50',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-300 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
  language?: string;
}

/**
 * Code Block Component
 * Use for code snippets, technical info
 */
export function CodeBlock({
  children,
  className = '',
  language = 'plaintext',
}: CodeBlockProps) {
  return (
    <pre
      className={`bg-slate-950 border border-slate-700 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-100 ${className}`}
      data-language={language}
    >
      <code>{children}</code>
    </pre>
  );
}

interface HelperTextProps {
  children: ReactNode;
  variant?: 'normal' | 'error' | 'success' | 'warning';
  className?: string;
}

/**
 * Helper Text Component
 * Use for form hints, error messages, validation feedback
 */
export function HelperText({
  children,
  variant = 'normal',
  className = '',
}: HelperTextProps) {
  const variantStyles = {
    normal: 'text-slate-400',
    error: 'text-red-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
  };

  return (
    <p className={`text-xs ${variantStyles[variant]} ${className}`}>{children}</p>
  );
}

/**
 * Truncated Text
 * Single line with ellipsis
 */
export function TruncatedText({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`truncate ${className}`}>{children}</span>;
}

/**
 * Line Clamped Text
 * Multiple lines with ellipsis
 */
export function LineClampedText({
  children,
  lines = 2,
  className = '',
}: {
  children: ReactNode;
  lines?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  return <span className={`line-clamp-${lines} ${className}`}>{children}</span>;
}
