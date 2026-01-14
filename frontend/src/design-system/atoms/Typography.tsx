/**
 * Typography Components
 * Semantic text components using the design system tokens
 * Ensures consistent typography across the application
 */

import React from 'react';

// ============================================================================
// HEADING - Large, bold, primary text
// ============================================================================

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 'h1' | 'h2' | 'h3' | 'h4';
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 'h1',
  children,
  className = '',
  ...props
}) => {
  const Tag = level;
  const sizeMap = {
    h1: 'text-3xl md:text-4xl',
    h2: 'text-2xl md:text-3xl',
    h3: 'text-xl md:text-2xl',
    h4: 'text-lg md:text-xl',
  };

  return (
    <Tag
      className={`font-bold text-text-primary tracking-tight ${sizeMap[level]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

// ============================================================================
// SUBHEADING - Medium, semi-bold, secondary text
// ============================================================================

interface SubheadingProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'h2' | 'h3' | 'h4';
  children: React.ReactNode;
}

export const Subheading: React.FC<SubheadingProps> = ({
  level = 'h2',
  children,
  className = '',
  ...props
}) => {
  const Tag = level;
  const sizeMap = {
    h2: 'text-xl md:text-2xl',
    h3: 'text-lg md:text-xl',
    h4: 'text-base md:text-lg',
  };

  return (
    <Tag
      className={`font-semibold text-text-secondary tracking-normal ${sizeMap[level]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

// ============================================================================
// BODY - Regular text for content
// ============================================================================

interface BodyProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'base' | 'lg';
  muted?: boolean;
  mono?: boolean;
  children: React.ReactNode;
}

export const Body: React.FC<BodyProps> = ({
  size = 'base',
  muted = false,
  mono = false,
  children,
  className = '',
  ...props
}) => {
  const sizeMap = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
  };

  const colorClass = muted ? 'text-text-muted' : 'text-text-secondary';
  const fontClass = mono ? 'font-mono' : 'font-sans';

  return (
    <p
      className={`${sizeMap[size]} ${colorClass} ${fontClass} leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

// ============================================================================
// MONO LABEL - Monospace, uppercase, small, technical data
// ============================================================================

interface MonoLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'badge' | 'tag' | 'inline';
}

export const MonoLabel: React.FC<MonoLabelProps> = ({
  children,
  variant = 'inline',
  className = '',
  ...props
}) => {
  const variantMap = {
    badge: 'px-2.5 py-1 rounded-full bg-bg-surface/50 border border-white/10 inline-block',
    tag: 'px-2 py-0.5 rounded-md bg-bg-overlay/30 border border-white/5 inline-block',
    inline: '',
  };

  return (
    <span
      className={`
        font-mono text-xs uppercase tracking-wider text-text-muted
        ${variantMap[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

// ============================================================================
// PRICE - Specialized component for currency display
// ============================================================================

interface PriceProps extends React.HTMLAttributes<HTMLDivElement> {
  amount: number;
  currency?: string;
  label?: string;
}

export const Price: React.FC<PriceProps> = ({
  amount,
  currency = '$',
  label,
  className = '',
  ...props
}) => {
  const [dollars, cents] = amount.toFixed(2).split('.');

  return (
    <div className={`flex items-baseline gap-0.5 ${className}`} {...props}>
      {label && (
        <span className="text-text-muted text-xs mr-2 font-mono">{label}</span>
      )}
      <span className="text-text-muted">{currency}</span>
      <span className="text-text-primary font-bold text-2xl">
        {dollars.toLocaleString()}
      </span>
      <span className="text-text-secondary text-sm">
        .{cents}
      </span>
    </div>
  );
};

// ============================================================================
// TEXT - Generic text with variant support
// ============================================================================

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'muted' | 'dimmed';
  size?: 'xs' | 'sm' | 'base' | 'lg';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  mono?: boolean;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'primary',
  size = 'base',
  weight = 'normal',
  mono = false,
  children,
  className = '',
  ...props
}) => {
  const variantMap = {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    dimmed: 'text-text-dimmed',
  };

  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  const weightMap = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const fontClass = mono ? 'font-mono' : 'font-sans';

  return (
    <span
      className={`${variantMap[variant]} ${sizeMap[size]} ${weightMap[weight]} ${fontClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
