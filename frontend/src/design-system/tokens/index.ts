/**
 * Design System Tokens
 * Single source of truth for all design decisions
 * Inspired by pro-audio aesthetic (dark, high-contrast, data-dense)
 */

// ============================================================================
// PALETTE - "Studio Dark" Theme
// ============================================================================

export const palette = {
  // Base - Zinc foundation (hardware-like aesthetic)
  background: {
    base: '#09090b', // zinc-950 - Main app background
    card: '#18181b', // zinc-900 - Card/panel background
    surface: '#27272a', // zinc-800 - Secondary surfaces
    overlay: '#3f3f46', // zinc-700 - Overlays & borders
  },

  // Accents - "Signal" colors inspired by mixer LEDs
  accent: {
    primary: '#f59e0b', // amber-500 - Primary action (Live signal)
    secondary: '#3b82f6', // blue-500 - Secondary action
    success: '#10b981', // emerald-500 - Active/healthy state
    warning: '#ef4444', // red-500 - Alert/error
    muted: '#6b7280', // gray-500 - Inactive/secondary
  },

  // Text - High contrast for readability
  text: {
    primary: '#fafafa', // zinc-50 - Main text
    secondary: '#d4d4d8', // zinc-300 - Secondary text
    muted: '#a1a1aa', // zinc-400 - Muted/tertiary text
    dimmed: '#71717a', // zinc-500 - Very muted
  },

  // Borders & dividers
  border: {
    strong: 'rgba(255, 255, 255, 0.15)', // Strong borders
    subtle: 'rgba(255, 255, 255, 0.05)', // Subtle dividers
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  family: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Courier New', monospace",
  },

  size: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },

  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',
    wider: '0.1em',
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  12: '3rem', // 48px
  16: '4rem', // 64px
};

// ============================================================================
// SHADOWS & EFFECTS
// ============================================================================

export const effects = {
  // Glass effect - translucent blur
  glass: {
    background: 'rgba(15, 15, 15, 0.4)',
    backdropBlur: 'blur(16px)',
    border: 'rgba(255, 255, 255, 0.05)',
  },

  // Glow effect - active/signal states
  glow: {
    amber: '0 0 20px -5px rgb(245, 158, 11)',
    blue: '0 0 20px -5px rgb(59, 130, 246)',
    green: '0 0 20px -5px rgb(16, 185, 129)',
    red: '0 0 20px -5px rgb(239, 68, 68)',
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  },
};

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const motion = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  easing: {
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================================================
// SEMANTIC ALIASES - Use these in components
// ============================================================================

export const semantic = {
  // Surfaces
  surface: {
    base: palette.background.base,
    card: palette.background.card,
    overlay: palette.background.overlay,
  },

  // Interactive states
  interactive: {
    accent: palette.accent.primary,
    accentHover: palette.accent.primary,
    accentActive: 'rgba(245, 158, 11, 0.8)',
    disabled: palette.border.subtle,
  },

  // Text layers
  text: {
    primary: palette.text.primary,
    secondary: palette.text.secondary,
    muted: palette.text.muted,
  },

  // Indicators
  status: {
    active: palette.accent.success,
    inactive: palette.border.subtle,
    warning: palette.accent.warning,
    error: palette.accent.warning,
  },
};

// ============================================================================
// EXPORT AS GROUPED OBJECT
// ============================================================================

export const designTokens = {
  palette,
  typography,
  spacing,
  effects,
  motion,
  semantic,
};
