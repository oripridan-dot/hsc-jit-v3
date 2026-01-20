/**
 * HOW TO INTEGRATE BRANDABLE THEMING INTO EXISTING COMPONENTS
 * 
 * This file shows real examples of updating existing HSC JIT components
 * to use the new ThemeContext system.
 */

// ============================================================================
// EXAMPLE 1: Navigator Component Enhancement
// ============================================================================

/*
BEFORE (Original Navigator):
```tsx
export function Navigator() {
  return (
    <div className="bg-slate-950 text-slate-50">
      <div className="border-b border-slate-800">
        Navigation items...
      </div>
    </div>
  );
}
```

AFTER (With Theme Support):
*/

import { useTheme } from '@/contexts/ThemeContext';
import { BrandIcon } from '@/components/BrandIcon';
import { Home, Search, Settings, BookOpen } from 'lucide-react';

export function NavigatorWithTheme() {
  const { theme, currentBrandId } = useTheme();

  return (
    <div 
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      {/* Header with brand colors */}
      <div 
        className="p-4 border-b border-opacity-20"
        style={{ 
          borderColor: 'var(--color-brand-primary)',
          backgroundColor: `var(--color-brand-primary)20`
        }}
      >
        <h2 className="font-bold text-lg" style={{ color: 'var(--color-brand-primary)' }}>
          {currentBrandId.toUpperCase()}
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">Support Center</p>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto">
        <NavItem icon={Home} label="Home" active />
        <NavItem icon={Search} label="Search" />
        <NavItem icon={BookOpen} label="Documentation" />
        <NavItem icon={Settings} label="Settings" />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <button
      className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-300 border-l-4 ${
        active ? 'border-l-[var(--color-brand-primary)]' : 'border-l-transparent'
      }`}
      style={{
        backgroundColor: active ? 'var(--color-brand-primary)20' : 'transparent'
      }}
    >
      <BrandIcon 
        icon={icon} 
        variant={active ? 'primary' : 'neutral'} 
        size={20}
      />
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {label}
      </span>
    </button>
  );
}

// ============================================================================
// EXAMPLE 2: Workbench Tab System
// ============================================================================

/*
BEFORE:
```tsx
<div className="flex border-b border-slate-700">
  <button className="px-4 py-2 border-b-2 border-blue-500">Documents</button>
  <button className="px-4 py-2 border-b-2 border-transparent">Videos</button>
</div>
```

AFTER:
*/

function WorkbenchTabsWithTheme() {
  const [activeTab, setActiveTab] = useState('documents');

  const tabs = [
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'audio', label: 'Audio', icon: Headphones }
  ];

  return (
    <div className="flex gap-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-all duration-300 ${
            activeTab === tab.id ? 'border-b-[var(--color-brand-primary)]' : 'border-b-transparent'
          }`}
          style={{
            color: activeTab === tab.id ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
            backgroundColor: activeTab === tab.id ? 'var(--color-brand-primary)10' : 'transparent'
          }}
        >
          <BrandIcon 
            icon={tab.icon} 
            variant={activeTab === tab.id ? 'primary' : 'neutral'}
            size={18}
          />
          <span className="text-sm font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Product Card with Brand Styling
// ============================================================================

/*
BEFORE:
```tsx
<div className="p-4 rounded-lg border border-slate-700 bg-slate-900">
  <h3 className="text-white">Product Name</h3>
  <p className="text-slate-400">Description...</p>
  <button className="mt-4 px-4 py-2 bg-blue-500 text-white">Details</button>
</div>
```

AFTER:
*/

function ProductCardWithTheme({ product }) {
  const { theme } = useTheme();

  return (
    <div 
      className="p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-lg"
      style={{
        borderColor: 'var(--color-brand-primary)20',
        backgroundColor: 'var(--bg-panel)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-brand-primary)20';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Product image with brand border */}
      {product.image && (
        <div 
          className="mb-3 rounded overflow-hidden border"
          style={{ borderColor: 'var(--color-brand-primary)' }}
        >
          <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
        </div>
      )}

      {/* Product info */}
      <div className="mb-3">
        <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-brand-text)' }}>
          {product.name}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {product.description}
        </p>
      </div>

      {/* Brand buttons */}
      <div className="flex gap-2">
        <button
          className="flex-1 px-4 py-2 rounded font-medium transition-all hover:shadow-lg"
          style={{
            backgroundColor: 'var(--color-brand-primary)',
            color: 'white'
          }}
        >
          View Details
        </button>
        <button
          className="px-4 py-2 rounded font-medium transition-all border-2"
          style={{
            borderColor: 'var(--color-brand-accent)',
            color: 'var(--color-brand-accent)'
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Search Results with Loading & Empty States
// ============================================================================

/*
BEFORE:
```tsx
<div className="space-y-4">
  {isLoading && <div>Loading...</div>}
  {products.length === 0 && <div>No results found</div>}
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

AFTER:
*/

import { BrandedLoader } from '@/components/BrandedLoader';
import { EmptyState } from '@/components/EmptyState';
import { Search as SearchIcon } from 'lucide-react';

function SearchResultsWithTheme({ products, isLoading, searchTerm }) {
  if (isLoading) {
    return <BrandedLoader message={`Searching for "${searchTerm}"...`} size="lg" />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="No Results Found"
        description={`No products match "${searchTerm}". Try adjusting your search terms.`}
        action={{
          label: 'Browse All',
          onClick: () => console.log('Browse all')
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Found {products.length} result{products.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(product => (
          <ProductCardWithTheme key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Header Component with Brand Logo
// ============================================================================

/*
BEFORE:
```tsx
<header className="bg-slate-950 border-b border-slate-800 px-6 py-4">
  <h1 className="text-2xl font-bold text-white">HSC Support Center</h1>
</header>
```

AFTER:
*/

function HeaderWithTheme() {
  const { theme, currentBrandId } = useTheme();

  return (
    <header 
      className="flex items-center justify-between px-6 py-4 border-b shadow-lg"
      style={{
        background: `linear-gradient(to right, var(--color-brand-primary), var(--color-brand-secondary))`,
        borderColor: 'var(--color-brand-primary)'
      }}
    >
      <div className="flex items-center gap-3">
        {/* Brand logo could go here */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: 'var(--color-brand-accent)' }}
        >
          {currentBrandId.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">
            {currentBrandId.toUpperCase()} Support
          </h1>
          <p className="text-xs text-white opacity-80">Professional Technical Support</p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <BrandIcon icon={Settings} variant="accent" size={20} />
        <button 
          className="px-4 py-2 rounded text-sm font-medium transition-all"
          style={{
            backgroundColor: 'var(--color-brand-accent)',
            color: 'var(--color-brand-text)'
          }}
        >
          Feedback
        </button>
      </div>
    </header>
  );
}

// ============================================================================
// EXAMPLE 6: Category Browser with Brand Colors
// ============================================================================

function CategoryBrowserWithTheme({ categories }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category, index) => (
        <div
          key={category.id}
          className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: `2px solid var(--color-brand-primary)20`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-brand-primary)20';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Background gradient using brand colors */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))`
            }}
          />

          {/* Content */}
          <div className="relative p-4 h-24 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <BrandIcon 
                icon={[HomeIcon, SettingsIcon, FileIcon][index % 3]} 
                variant="primary" 
                size={24}
              />
              <h3 className="font-bold" style={{ color: 'var(--color-brand-primary)' }}>
                {category.name}
              </h3>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {category.count} items
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// KEY INTEGRATION PATTERNS
// ============================================================================

/*
1. USE HOOK AT TOP OF COMPONENT:
   const { theme, currentBrandId, applyTheme } = useTheme();

2. COLOR BACKGROUNDS:
   style={{ backgroundColor: 'var(--color-brand-primary)' }}

3. COLOR TEXT:
   style={{ color: 'var(--color-brand-text)' }}

4. USE BRAND ICONS:
   <BrandIcon icon={IconName} variant="primary" />

5. BORDERS & DIVIDERS:
   style={{ borderColor: 'var(--color-brand-secondary)' }}

6. HOVER EFFECTS:
   Use 'var(--color-brand-accent)' for interactive elements

7. GRADIENTS:
   style={{ background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))' }}

8. OPACITY WITH BRAND COLOR:
   style={{ backgroundColor: 'var(--color-brand-primary)20' }} // 20% opacity

9. LOADERS & EMPTY STATES:
   <BrandedLoader /> and <EmptyState />

10. TAILWIND CLASSES:
    className="bg-brand-primary text-brand-text border-brand-accent"
*/

export {
  NavigatorWithTheme,
  WorkbenchTabsWithTheme,
  ProductCardWithTheme,
  SearchResultsWithTheme,
  HeaderWithTheme,
  CategoryBrowserWithTheme
};
