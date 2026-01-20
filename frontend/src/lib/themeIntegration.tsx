/**
 * Brand Theme Integration Test & Documentation
 * 
 * This file demonstrates how the ThemeContext integrates with all components
 * and provides real-time brand color switching throughout the application.
 */

import { useTheme } from '../contexts/ThemeContext';
import { BrandIcon } from '../components/BrandIcon';
import { BrandedLoader } from '../components/BrandedLoader';
import { EmptyState } from '../components/EmptyState';
import { Search, Package, Music } from 'lucide-react';

/**
 * DEMO 1: Basic Theme Switching
 * Shows how to switch between pre-loaded brand themes
 */
export function ThemeSwitchDemo() {
  const { applyTheme, currentBrandId } = useTheme();

  const brands = ['roland', 'yamaha', 'korg', 'moog', 'nord'];

  return (
    <div className="p-6 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)]">
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
        🎨 Theme Switcher
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Current brand: <span className="font-mono font-bold text-[var(--color-brand-primary)]">{currentBrandId}</span>
      </p>
      <div className="flex gap-2 flex-wrap">
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => applyTheme(brand)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
              currentBrandId === brand
                ? 'shadow-lg scale-105'
                : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: currentBrandId === brand 
                ? 'var(--color-brand-primary)' 
                : 'var(--bg-panel)',
              color: currentBrandId === brand ? 'white' : 'var(--text-primary)',
              border: `2px solid ${currentBrandId === brand ? 'var(--color-brand-primary)' : 'var(--border-subtle)'}`
            }}
          >
            {brand.charAt(0).toUpperCase() + brand.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * DEMO 2: BrandIcon Usage
 * Shows how icons automatically inherit brand colors
 */
export function BrandIconDemo() {
  return (
    <div className="p-6 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)]">
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
        🎯 Brand Icons
      </h2>
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-brand-primary)', backgroundImage: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))', opacity: 0.2 }}>
            <BrandIcon icon={Search} variant="primary" size={24} />
          </div>
          <span className="text-xs text-[var(--text-secondary)]">Search (Primary)</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-brand-secondary)', opacity: 0.2 }}>
            <BrandIcon icon={Package} variant="secondary" size={24} />
          </div>
          <span className="text-xs text-[var(--text-secondary)]">Product (Secondary)</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-brand-accent)', opacity: 0.2 }}>
            <BrandIcon icon={Music} variant="accent" size={24} />
          </div>
          <span className="text-xs text-[var(--text-secondary)]">Music (Accent)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * DEMO 3: BrandedLoader
 * Shows loading state with brand colors
 */
export function BrandedLoaderDemo() {
  return (
    <div className="p-6 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)]">
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
        ⏳ Branded Loader
      </h2>
      <div className="flex gap-4 justify-center">
        <BrandedLoader message="Loading small..." size="sm" />
        <BrandedLoader message="Loading medium..." size="md" />
        <BrandedLoader message="Loading large..." size="lg" />
      </div>
    </div>
  );
}

/**
 * DEMO 4: EmptyState
 * Shows brand-aware empty state
 */
export function EmptyStateDemo() {
  return (
    <div className="p-6 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)]">
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
        📭 Empty State
      </h2>
      <div className="min-h-64">
        <EmptyState
          icon={Package}
          title="No Products Found"
          description="Try adjusting your filters or search terms to find what you're looking for."
          action={{
            label: 'Browse All',
            onClick: () => alert('Action clicked!')
          }}
        />
      </div>
    </div>
  );
}

/**
 * CSS CUSTOM PROPERTIES REFERENCE
 * 
 * The ThemeContext injects these properties into :root
 * They automatically update when theme changes:
 * 
 * --color-brand-primary     - Main brand color (e.g., #ef4444 for Roland)
 * --color-brand-secondary   - Secondary color (e.g., #1f2937)
 * --color-brand-accent      - Accent/highlight color (e.g., #fbbf24)
 * --color-brand-background  - Background color
 * --color-brand-text        - Text color
 * 
 * Usage in Tailwind classes:
 * text-[var(--color-brand-primary)]
 * bg-[var(--color-brand-secondary)]
 * border-[var(--color-brand-accent)]
 * 
 * Or via Tailwind shortcuts:
 * text-brand-primary
 * bg-brand-secondary
 * border-brand-accent
 */

/**
 * HOW TO USE IN YOUR COMPONENTS:
 * 
 * 1. Import the hook:
 *    import { useTheme } from '../contexts/ThemeContext';
 * 
 * 2. Use in component:
 *    const { applyTheme, currentBrandId, theme } = useTheme();
 * 
 * 3. Apply styles:
 *    <div style={{ color: theme?.colors.primary }}>Branded Text</div>
 * 
 * 4. Switch themes:
 *    <button onClick={() => applyTheme('yamaha')}>Switch to Yamaha</button>
 * 
 * 5. Icons automatically inherit colors via CSS variables:
 *    <BrandIcon icon={Home} variant="primary" />
 */

/**
 * CURRENT BRAND THEMES AVAILABLE:
 * 
 * - roland:  Bold red (#ef4444) - Professional, Powerful
 * - yamaha:  Purple (#a855f7) - Elegant, Trustworthy
 * - korg:    Orange (#fb923c) - Modern, Precise
 * - moog:    Cyan (#22d3ee) - Classic, Distinctive
 * - nord:    Red-light (#f87171) - Iconic, Energetic
 */

export const IntegrationTestGuide = {
  themeContext: 'Use useTheme() hook in any component to access current theme',
  brandIcon: 'Use BrandIcon to display icons with brand colors',
  brandedLoader: 'Use BrandedLoader for loading states',
  emptyState: 'Use EmptyState for empty data scenarios',
  cssVariables: 'Access --color-brand-* CSS variables in inline styles',
  tailwindClasses: 'Use text-brand-primary, bg-brand-secondary etc.',
  switching: 'Call applyTheme("brand-id") to switch themes dynamically',
  performance: 'All color changes are instant via CSS custom properties (no re-renders)'
};
