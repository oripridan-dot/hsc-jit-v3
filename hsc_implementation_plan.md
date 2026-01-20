# HSC JIT v3 - Brandable Design System Implementation Plan

## 🎯 Executive Summary

Transform HSC JIT v3 into a fully brandable support center platform where each manufacturer's visual identity is seamlessly integrated, creating immersive brand experiences while maintaining professional functionality.

---

## 📋 Phase 1: Foundation & Architecture (Week 1-2)

### 1.1 Dynamic Theming Engine

**Backend Updates:**
```python
# backend/app/models/brand_theme.py
from pydantic import BaseModel
from typing import Optional

class BrandTheme(BaseModel):
    brand_id: str
    primary_color: str
    secondary_color: str
    accent_color: str
    background_color: str
    surface_color: str
    text_color: str
    text_light_color: str
    gradient: str
    logo_url: Optional[str]
    typography_family: Optional[str]
```

**Brand Catalog Enhancement:**
```json
// backend/data/catalogs/halilit.json (add theme section)
{
  "brand": "Halilit",
  "theme": {
    "primary": "#FF6B35",
    "secondary": "#F7931E",
    "accent": "#FDB913",
    "background": "#FFF8F0",
    "surface": "#FFFFFF",
    "text": "#2D2D2D",
    "textLight": "#6B7280",
    "gradient": "from-orange-400 via-amber-400 to-yellow-400",
    "logoUrl": "/assets/logos/halilit.svg",
    "typography": "'Inter', 'Segoe UI', sans-serif"
  },
  "products": [...existing products...]
}
```

**API Endpoint:**
```python
# backend/app/routers/theme.py
from fastapi import APIRouter, HTTPException
from app.services.catalog import CatalogService

router = APIRouter(prefix="/api/theme", tags=["theme"])

@router.get("/{brand_id}")
async def get_brand_theme(brand_id: str):
    """Retrieve brand-specific theme configuration"""
    catalog = CatalogService()
    brand_data = catalog.get_brand(brand_id)
    
    if not brand_data or "theme" not in brand_data:
        raise HTTPException(404, "Brand theme not found")
    
    return brand_data["theme"]
```

### 1.2 Frontend Theming Infrastructure

**Create Theme Provider:**
```typescript
// frontend/src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface BrandTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
  gradient: string;
  logoUrl?: string;
  typography?: string;
}

interface ThemeContextType {
  theme: BrandTheme | null;
  loadTheme: (brandId: string) => Promise<void>;
  applyTheme: (theme: BrandTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<BrandTheme | null>(null);

  const applyTheme = (newTheme: BrandTheme) => {
    // Inject CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', newTheme.primary);
    root.style.setProperty('--brand-secondary', newTheme.secondary);
    root.style.setProperty('--brand-accent', newTheme.accent);
    root.style.setProperty('--brand-background', newTheme.background);
    root.style.setProperty('--brand-surface', newTheme.surface);
    root.style.setProperty('--brand-text', newTheme.text);
    root.style.setProperty('--brand-text-light', newTheme.textLight);
    
    if (newTheme.typography) {
      root.style.setProperty('--brand-font', newTheme.typography);
    }
    
    setTheme(newTheme);
  };

  const loadTheme = async (brandId: string) => {
    try {
      const response = await fetch(`/api/theme/${brandId}`);
      const themeData = await response.json();
      applyTheme(themeData);
    } catch (error) {
      console.error('Failed to load brand theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, loadTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Tailwind Configuration:**
```javascript
// frontend/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
          background: 'var(--brand-background)',
          surface: 'var(--brand-surface)',
          text: 'var(--brand-text)',
          'text-light': 'var(--brand-text-light)',
        }
      },
      fontFamily: {
        brand: 'var(--brand-font, system-ui, sans-serif)',
      }
    }
  }
}
```

---

## 🎨 Phase 2: Component System (Week 2-3)

### 2.1 Icon Component Library

**Base Icon Component:**
```typescript
// frontend/src/components/icons/BrandIcon.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BrandIconProps {
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
  size?: number;
  className?: string;
}

export const BrandIcon: React.FC<BrandIconProps> = ({
  icon: Icon,
  variant = 'primary',
  size = 24,
  className = ''
}) => {
  const variantClasses = {
    primary: 'text-brand-primary',
    secondary: 'text-brand-secondary',
    accent: 'text-brand-accent',
    neutral: 'text-brand-text-light'
  };

  return (
    <Icon 
      size={size} 
      className={`${variantClasses[variant]} ${className}`}
    />
  );
};
```

**Navigation Icons:**
```typescript
// frontend/src/components/navigation/NavItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { BrandIcon } from '../icons/BrandIcon';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg
        transition-all duration-300
        ${active 
          ? 'bg-brand-primary text-white shadow-lg' 
          : 'text-brand-text hover:bg-brand-background'
        }
      `}
    >
      <BrandIcon 
        icon={icon} 
        variant={active ? 'accent' : 'primary'}
        size={20}
      />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};
```

### 2.2 Workbench Tabs System

```typescript
// frontend/src/components/workbench/WorkbenchTabs.tsx
import React, { useState } from 'react';
import { FileText, Video, Image, Headphones, Wrench, Layers } from 'lucide-react';
import { BrandIcon } from '../icons/BrandIcon';

interface Tab {
  id: string;
  label: string;
  icon: typeof FileText;
  count?: number;
}

const defaultTabs: Tab[] = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'audio', label: 'Audio', icon: Headphones },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'resources', label: 'Resources', icon: Layers }
];

export const WorkbenchTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('documents');

  return (
    <div className="flex gap-2 border-b border-brand-primary/20 bg-brand-surface">
      {defaultTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-300
            ${activeTab === tab.id
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-text-light hover:text-brand-text'
            }
          `}
        >
          <BrandIcon 
            icon={tab.icon} 
            variant={activeTab === tab.id ? 'primary' : 'neutral'}
            size={18}
          />
          <span className="text-sm font-medium">{tab.label}</span>
          {tab.count && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
```

### 2.3 Media Bar Controls

```typescript
// frontend/src/components/mediabar/MediaControls.tsx
import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { BrandIcon } from '../icons/BrandIcon';

interface MediaControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  volume,
  onVolumeChange
}) => {
  return (
    <div className="flex items-center gap-4 bg-brand-surface border-t border-brand-primary/20 px-6 py-4">
      <button 
        onClick={onPrevious}
        className="p-2 rounded-full hover:bg-brand-background transition-colors"
      >
        <BrandIcon icon={SkipBack} variant="neutral" size={20} />
      </button>
      
      <button 
        onClick={onPlayPause}
        className="p-3 rounded-full bg-brand-primary hover:bg-brand-secondary transition-all shadow-lg hover:shadow-xl"
      >
        <BrandIcon 
          icon={isPlaying ? Pause : Play} 
          variant="accent" 
          size={24}
        />
      </button>
      
      <button 
        onClick={onNext}
        className="p-2 rounded-full hover:bg-brand-background transition-colors"
      >
        <BrandIcon icon={SkipForward} variant="neutral" size={20} />
      </button>
      
      <div className="flex items-center gap-2 ml-auto">
        <BrandIcon icon={Volume2} variant="neutral" size={20} />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value))}
          className="w-24 accent-brand-primary"
        />
      </div>
    </div>
  );
};
```

---

## 🚀 Phase 3: Integration & Brand Immersion (Week 3-4)

### 3.1 WebSocket Integration with Dynamic Theming

```typescript
// frontend/src/store/useWebSocketStore.ts (enhancement)
interface WebSocketState {
  // ...existing state
  currentBrand: string | null;
  setBrand: (brandId: string) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  // ...existing state
  currentBrand: null,
  
  setBrand: async (brandId: string) => {
    set({ currentBrand: brandId });
    
    // Load brand theme
    const { loadTheme } = useTheme();
    await loadTheme(brandId);
    
    // Notify backend of brand context
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'brand_context',
        brand_id: brandId
      }));
    }
  }
}));
```

### 3.2 Product Selection with Brand Switching

```typescript
// frontend/src/components/chat/ProductSelector.tsx
import React, { useEffect } from 'react';
import { useWebSocketStore } from '../../store/useWebSocketStore';
import { useTheme } from '../../contexts/ThemeContext';

export const ProductSelector: React.FC = () => {
  const { predictions, selectProduct } = useWebSocketStore();
  const { loadTheme } = useTheme();

  const handleProductSelect = async (product: any) => {
    // Select product
    selectProduct(product);
    
    // Load brand theme for the product's manufacturer
    await loadTheme(product.brand_id);
  };

  return (
    <div className="space-y-2">
      {predictions.map(product => (
        <button
          key={product.id}
          onClick={() => handleProductSelect(product)}
          className="w-full p-4 rounded-lg border-2 border-brand-primary/20 
                     hover:border-brand-primary hover:bg-brand-background
                     transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="text-left">
              <h3 className="font-semibold text-brand-text">{product.name}</h3>
              <p className="text-sm text-brand-text-light">{product.brand}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
```

### 3.3 Branded Loading States

```typescript
// frontend/src/components/ui/BrandedLoader.tsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const BrandedLoader: React.FC<{ message?: string }> = ({ message }) => {
  const { theme } = useTheme();
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="relative w-16 h-16">
        <div 
          className="absolute inset-0 rounded-full border-4 border-brand-primary/20"
        />
        <div 
          className="absolute inset-0 rounded-full border-4 border-transparent 
                     border-t-brand-primary animate-spin"
        />
      </div>
      {message && (
        <p className="text-sm text-brand-text-light animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
```

### 3.4 Brand-Aware Empty States

```typescript
// frontend/src/components/ui/EmptyState.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { BrandIcon } from '../icons/BrandIcon';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 p-6 rounded-full bg-brand-primary/10">
        <BrandIcon icon={icon} variant="primary" size={48} />
      </div>
      <h3 className="text-xl font-bold text-brand-text mb-2">{title}</h3>
      <p className="text-brand-text-light mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-secondary
                     text-white font-medium transition-all shadow-lg hover:shadow-xl"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
```

---

## 📊 Phase 4: Advanced Features (Week 4-5)

### 4.1 Brand Pattern Library

```typescript
// frontend/src/utils/brandPatterns.ts
export const generateBrandPattern = (theme: BrandTheme): string => {
  // Generate SVG pattern based on brand colors
  return `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="brand-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="${theme.primary}" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#brand-pattern)"/>
    </svg>
  `;
};
```

### 4.2 Contextual Micro-Animations

```typescript
// frontend/src/components/animations/BrandAnimation.tsx
import React from 'react';
import { motion } from 'framer-motion';

export const BrandFadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export const BrandScale: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
};
```

### 4.3 Brand Logo Integration

```typescript
// frontend/src/components/layout/Header.tsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const Header: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <header 
      className="sticky top-0 z-50 shadow-lg backdrop-blur-sm"
      style={{
        background: `linear-gradient(to right, ${theme?.primary}, ${theme?.secondary})`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {theme?.logoUrl ? (
          <img 
            src={theme.logoUrl} 
            alt="Brand Logo" 
            className="h-10"
          />
        ) : (
          <h1 className="text-2xl font-bold" style={{ color: theme?.accent }}>
            Support Center
          </h1>
        )}
        
        <div className="flex items-center gap-4">
          {/* User actions */}
        </div>
      </div>
    </header>
  );
};
```

---

## 🧪 Phase 5: Testing & Optimization (Week 5-6)

### 5.1 Theme Testing Suite

```typescript
// frontend/src/__tests__/theme.test.tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

describe('Theme System', () => {
  it('should inject CSS custom properties', async () => {
    const TestComponent = () => {
      const { applyTheme } = useTheme();
      
      React.useEffect(() => {
        applyTheme({
          primary: '#FF6B35',
          secondary: '#F7931E',
          // ...other properties
        });
      }, []);
      
      return <div>Test</div>;
    };
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--brand-primary')).toBe('#FF6B35');
  });
});
```

### 5.2 Performance Optimization

```typescript
// frontend/src/hooks/useOptimizedTheme.ts
import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const useOptimizedTheme = () => {
  const { theme } = useTheme();
  
  // Memoize theme-derived values
  const computedStyles = useMemo(() => {
    if (!theme) return null;
    
    return {
      primaryRgb: hexToRgb(theme.primary),
      secondaryRgb: hexToRgb(theme.secondary),
      gradientCss: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
    };
  }, [theme]);
  
  return { theme, computedStyles };
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};
```

---

## 📈 Success Metrics

### User Experience
- [ ] Theme switches in < 300ms
- [ ] Zero layout shift during theme changes
- [ ] Smooth animations (60fps)
- [ ] WCAG AA contrast compliance

### Technical Performance
- [ ] CSS custom properties injection: < 50ms
- [ ] Theme API response: < 100ms
- [ ] Icon rendering: < 16ms per icon
- [ ] Memory footprint: < 2MB additional

### Brand Immersion
- [ ] 100% color accuracy vs brand guidelines
- [ ] Contextual brand elements in all views
- [ ] Consistent micro-animations
- [ ] Professional polish maintained

---

## 🔧 Maintenance & Extensibility

### Adding New Brands
1. Create brand catalog JSON with theme section
2. Add brand logo to `/assets/logos/`
3. Optional: Create brand-specific pattern
4. Test with brand validator

### Icon Management
1. All icons use lucide-react (standardized)
2. BrandIcon wrapper ensures color consistency
3. Size variants: 16, 20, 24, 28, 32px
4. Semantic naming in all contexts

### Theme Updates
1. Update brand catalog JSON
2. Clear Redis cache if needed
3. Frontend auto-refreshes on next product selection
4. No build required

---

## 📚 Documentation Requirements

- [ ] Brand theming API documentation
- [ ] Icon usage guidelines
- [ ] Component storybook
- [ ] Brand onboarding guide
- [ ] Performance benchmarks
- [ ] Accessibility checklist

---

## 🎯 Next Steps

1. **Immediate**: Set up ThemeProvider and inject into App.tsx
2. **Short-term**: Implement icon system with BrandIcon component
3. **Medium-term**: Build workbench tabs and media controls
4. **Long-term**: Advanced animations and brand patterns

This plan transforms HSC JIT v3 into a truly brandable platform where musicians feel immersed in their favorite manufacturer's world while getting professional technical support.