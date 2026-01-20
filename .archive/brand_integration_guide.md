# HSC JIT v3 - Complete Brand & Logo Integration Guide

## 🎯 Overview
This guide provides step-by-step implementation to fully integrate brand themes and logos into your HSC JIT v3 application.

---

## 📁 Step 1: Project Structure Setup

### Create New Directories
```bash
# From project root
mkdir -p frontend/public/assets/logos
mkdir -p frontend/public/assets/patterns
mkdir -p frontend/src/contexts
mkdir -p frontend/src/hooks
mkdir -p frontend/src/components/brand
mkdir -p backend/app/models/theme
mkdir -p backend/app/routers
```

---

## 🎨 Step 2: Backend - Brand Theme System

### 2.1 Create Theme Model

**File: `backend/app/models/theme.py`**
```python
from pydantic import BaseModel, HttpUrl
from typing import Optional

class BrandTheme(BaseModel):
    """Brand visual identity configuration"""
    brand_id: str
    brand_name: str
    
    # Core Colors
    primary: str  # Main brand color
    secondary: str  # Secondary brand color
    accent: str  # Accent/highlight color
    
    # UI Colors
    background: str  # Page background
    surface: str  # Card/panel background
    text: str  # Primary text color
    text_light: str  # Secondary text color
    
    # Visual Elements
    gradient: str  # CSS gradient class or values
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    pattern_url: Optional[str] = None
    
    # Typography
    font_family: Optional[str] = None
    font_weight_normal: int = 400
    font_weight_bold: int = 700
    
    # Personality
    border_radius: str = "0.5rem"  # rounded-lg
    shadow_intensity: str = "medium"  # sm, md, lg, xl
    animation_speed: str = "normal"  # fast, normal, slow

class BrandThemeResponse(BaseModel):
    """API response for theme data"""
    success: bool
    theme: Optional[BrandTheme] = None
    error: Optional[str] = None
```

### 2.2 Update Brand Catalogs with Theme Data

**File: `backend/data/catalogs/halilit.json`**
```json
{
  "brand_id": "halilit",
  "brand_name": "Halilit",
  "theme": {
    "brand_id": "halilit",
    "brand_name": "Halilit",
    "primary": "#FF6B35",
    "secondary": "#F7931E",
    "accent": "#FDB913",
    "background": "#FFF8F0",
    "surface": "#FFFFFF",
    "text": "#2D2D2D",
    "text_light": "#6B7280",
    "gradient": "linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FDB913 100%)",
    "logo_url": "/assets/logos/halilit.svg",
    "favicon_url": "/assets/logos/halilit-favicon.png",
    "pattern_url": "/assets/patterns/halilit-pattern.svg",
    "font_family": "'Nunito', 'Inter', sans-serif",
    "font_weight_normal": 400,
    "font_weight_bold": 700,
    "border_radius": "0.75rem",
    "shadow_intensity": "lg",
    "animation_speed": "normal"
  },
  "products": [
    // ... existing products
  ]
}
```

**File: `backend/data/catalogs/roland.json`**
```json
{
  "brand_id": "roland",
  "brand_name": "Roland",
  "theme": {
    "brand_id": "roland",
    "brand_name": "Roland",
    "primary": "#E60012",
    "secondary": "#000000",
    "accent": "#FFFFFF",
    "background": "#F5F5F5",
    "surface": "#FFFFFF",
    "text": "#000000",
    "text_light": "#666666",
    "gradient": "linear-gradient(135deg, #E60012 0%, #000000 100%)",
    "logo_url": "/assets/logos/roland.svg",
    "favicon_url": "/assets/logos/roland-favicon.png",
    "font_family": "'Roboto', 'Arial', sans-serif",
    "font_weight_normal": 400,
    "font_weight_bold": 700,
    "border_radius": "0.25rem",
    "shadow_intensity": "md",
    "animation_speed": "fast"
  },
  "products": [
    // ... existing products
  ]
}
```

**File: `backend/data/catalogs/yamaha.json`**
```json
{
  "brand_id": "yamaha",
  "brand_name": "Yamaha",
  "theme": {
    "brand_id": "yamaha",
    "brand_name": "Yamaha",
    "primary": "#662D91",
    "secondary": "#0033A0",
    "accent": "#00A3E0",
    "background": "#F8F9FA",
    "surface": "#FFFFFF",
    "text": "#1A1A1A",
    "text_light": "#6C757D",
    "gradient": "linear-gradient(135deg, #662D91 0%, #0033A0 50%, #00A3E0 100%)",
    "logo_url": "/assets/logos/yamaha.svg",
    "favicon_url": "/assets/logos/yamaha-favicon.png",
    "font_family": "'Open Sans', 'Helvetica', sans-serif",
    "border_radius": "0.5rem",
    "shadow_intensity": "md",
    "animation_speed": "normal"
  },
  "products": [
    // ... existing products
  ]
}
```

### 2.3 Create Theme Service

**File: `backend/app/services/theme_service.py`**
```python
from typing import Optional, Dict
import json
from pathlib import Path
from app.models.theme import BrandTheme

class ThemeService:
    """Service for managing brand themes"""
    
    def __init__(self):
        self.catalog_path = Path(__file__).parent.parent.parent / "data" / "catalogs"
        self._theme_cache: Dict[str, BrandTheme] = {}
        self._load_all_themes()
    
    def _load_all_themes(self):
        """Load all brand themes from catalog files"""
        if not self.catalog_path.exists():
            return
        
        for catalog_file in self.catalog_path.glob("*.json"):
            try:
                with open(catalog_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                if "theme" in data:
                    theme = BrandTheme(**data["theme"])
                    self._theme_cache[theme.brand_id] = theme
            except Exception as e:
                print(f"Error loading theme from {catalog_file}: {e}")
    
    def get_theme(self, brand_id: str) -> Optional[BrandTheme]:
        """Get theme for a specific brand"""
        return self._theme_cache.get(brand_id.lower())
    
    def get_all_themes(self) -> Dict[str, BrandTheme]:
        """Get all available themes"""
        return self._theme_cache
    
    def refresh_themes(self):
        """Reload all themes from disk"""
        self._theme_cache.clear()
        self._load_all_themes()

# Singleton instance
theme_service = ThemeService()
```

### 2.4 Create Theme API Router

**File: `backend/app/routers/theme.py`**
```python
from fastapi import APIRouter, HTTPException
from app.models.theme import BrandTheme, BrandThemeResponse
from app.services.theme_service import theme_service

router = APIRouter(prefix="/api/theme", tags=["theme"])

@router.get("/{brand_id}", response_model=BrandThemeResponse)
async def get_brand_theme(brand_id: str):
    """
    Get theme configuration for a specific brand
    
    Args:
        brand_id: Brand identifier (e.g., 'halilit', 'roland', 'yamaha')
    
    Returns:
        BrandThemeResponse with theme data or error
    """
    theme = theme_service.get_theme(brand_id)
    
    if not theme:
        return BrandThemeResponse(
            success=False,
            error=f"Theme not found for brand: {brand_id}"
        )
    
    return BrandThemeResponse(success=True, theme=theme)

@router.get("/", response_model=dict)
async def get_all_themes():
    """
    Get all available brand themes
    
    Returns:
        Dictionary of all themes keyed by brand_id
    """
    themes = theme_service.get_all_themes()
    return {
        "success": True,
        "themes": {k: v.dict() for k, v in themes.items()},
        "count": len(themes)
    }

@router.post("/refresh", response_model=dict)
async def refresh_themes():
    """
    Reload all themes from catalog files
    Useful for development or when catalogs are updated
    """
    try:
        theme_service.refresh_themes()
        return {
            "success": True,
            "message": "Themes refreshed successfully",
            "count": len(theme_service.get_all_themes())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 2.5 Register Theme Router

**File: `backend/app/main.py`** (add to existing file)
```python
# Add this import at the top
from app.routers import theme

# Add this line where other routers are included
app.include_router(theme.router)
```

---

## 🎨 Step 3: Frontend - Theme Context System

### 3.1 Create Theme Context

**File: `frontend/src/contexts/ThemeContext.tsx`**
```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BrandTheme {
  brand_id: string;
  brand_name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  text_light: string;
  gradient: string;
  logo_url?: string;
  favicon_url?: string;
  pattern_url?: string;
  font_family?: string;
  font_weight_normal?: number;
  font_weight_bold?: number;
  border_radius?: string;
  shadow_intensity?: string;
  animation_speed?: string;
}

interface ThemeContextType {
  theme: BrandTheme | null;
  isLoading: boolean;
  error: string | null;
  loadTheme: (brandId: string) => Promise<void>;
  applyTheme: (theme: BrandTheme) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default theme (fallback)
const DEFAULT_THEME: BrandTheme = {
  brand_id: 'default',
  brand_name: 'Support Center',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#10B981',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  text_light: '#6B7280',
  gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  font_family: "'Inter', system-ui, sans-serif",
  border_radius: '0.5rem',
  shadow_intensity: 'md',
  animation_speed: 'normal'
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<BrandTheme | null>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyTheme = (newTheme: BrandTheme) => {
    const root = document.documentElement;
    
    // Inject CSS custom properties
    root.style.setProperty('--brand-primary', newTheme.primary);
    root.style.setProperty('--brand-secondary', newTheme.secondary);
    root.style.setProperty('--brand-accent', newTheme.accent);
    root.style.setProperty('--brand-background', newTheme.background);
    root.style.setProperty('--brand-surface', newTheme.surface);
    root.style.setProperty('--brand-text', newTheme.text);
    root.style.setProperty('--brand-text-light', newTheme.text_light);
    
    // Apply typography
    if (newTheme.font_family) {
      root.style.setProperty('--brand-font-family', newTheme.font_family);
    }
    
    // Apply border radius
    if (newTheme.border_radius) {
      root.style.setProperty('--brand-radius', newTheme.border_radius);
    }
    
    // Update favicon if provided
    if (newTheme.favicon_url) {
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = newTheme.favicon_url;
      }
    }
    
    // Update document title
    document.title = `${newTheme.brand_name} Support Center`;
    
    setTheme(newTheme);
    setError(null);
  };

  const loadTheme = async (brandId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/theme/${brandId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load theme: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.theme) {
        throw new Error(data.error || 'Theme not found');
      }
      
      applyTheme(data.theme);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load theme';
      setError(errorMessage);
      console.error('Theme loading error:', err);
      
      // Fallback to default theme on error
      applyTheme(DEFAULT_THEME);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTheme = () => {
    applyTheme(DEFAULT_THEME);
  };

  // Apply default theme on mount
  useEffect(() => {
    applyTheme(DEFAULT_THEME);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isLoading, error, loadTheme, applyTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### 3.2 Update Tailwind Configuration

**File: `frontend/tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #3B82F6)',
          secondary: 'var(--brand-secondary, #8B5CF6)',
          accent: 'var(--brand-accent, #10B981)',
          background: 'var(--brand-background, #F9FAFB)',
          surface: 'var(--brand-surface, #FFFFFF)',
          text: 'var(--brand-text, #111827)',
          'text-light': 'var(--brand-text-light, #6B7280)',
        }
      },
      fontFamily: {
        brand: 'var(--brand-font-family, Inter, system-ui, sans-serif)',
      },
      borderRadius: {
        brand: 'var(--brand-radius, 0.5rem)',
      },
      backgroundImage: {
        'brand-gradient': 'var(--brand-gradient, linear-gradient(135deg, #3B82F6, #8B5CF6))',
      }
    },
  },
  plugins: [],
}
```

### 3.3 Update App Root

**File: `frontend/src/App.tsx`**
```typescript
import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';

function App() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}

export default App;
```

---

## 🏗️ Step 4: Brand-Aware Components

### 4.1 Branded Header with Logo

**File: `frontend/src/components/layout/Header.tsx`**
```typescript
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Settings, Bell, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, isLoading } = useTheme();

  if (isLoading || !theme) {
    return (
      <header className="h-16 bg-brand-surface border-b border-gray-200 animate-pulse">
        <div className="h-full max-w-7xl mx-auto px-6" />
      </header>
    );
  }

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur-sm border-b shadow-lg transition-all duration-300"
      style={{
        background: theme.gradient,
        borderColor: `${theme.primary}40`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            {theme.logo_url ? (
              <img 
                src={theme.logo_url} 
                alt={`${theme.brand_name} Logo`}
                className="h-10 object-contain"
                onError={(e) => {
                  // Fallback if logo fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <h1 
                className="text-2xl font-bold"
                style={{ color: theme.accent }}
              >
                {theme.brand_name}
              </h1>
            )}
            <div className="hidden md:block">
              <span 
                className="text-sm font-medium opacity-90"
                style={{ color: theme.surface }}
              >
                Support Center
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell size={20} style={{ color: theme.surface }} />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Settings size={20} style={{ color: theme.surface }} />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <User size={20} style={{ color: theme.surface }} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
```

### 4.2 Brand Switcher Component

**File: `frontend/src/components/brand/BrandSwitcher.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Palette, Check } from 'lucide-react';

interface AvailableBrand {
  brand_id: string;
  brand_name: string;
  primary: string;
}

export const BrandSwitcher: React.FC = () => {
  const { theme, loadTheme, isLoading } = useTheme();
  const [brands, setBrands] = useState<AvailableBrand[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load available brands
    fetch('/api/theme/')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.themes) {
          const brandList = Object.values(data.themes).map((t: any) => ({
            brand_id: t.brand_id,
            brand_name: t.brand_name,
            primary: t.primary
          }));
          setBrands(brandList);
        }
      })
      .catch(err => console.error('Failed to load brands:', err));
  }, []);

  const handleBrandChange = async (brandId: string) => {
    await loadTheme(brandId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-surface 
                   border-2 border-brand-primary/20 hover:border-brand-primary 
                   transition-all duration-300"
        disabled={isLoading}
      >
        <Palette size={20} className="text-brand-primary" />
        <span className="text-sm font-medium text-brand-text">
          {theme?.brand_name || 'Select Brand'}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-64 bg-brand-surface 
                         rounded-lg shadow-xl border border-brand-primary/20 z-50
                         max-h-96 overflow-y-auto">
            {brands.map(brand => (
              <button
                key={brand.brand_id}
                onClick={() => handleBrandChange(brand.brand_id)}
                className="w-full flex items-center justify-between px-4 py-3 
                         hover:bg-brand-background transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: brand.primary }}
                  />
                  <span className="text-sm font-medium text-brand-text">
                    {brand.brand_name}
                  </span>
                </div>
                {theme?.brand_id === brand.brand_id && (
                  <Check size={16} className="text-brand-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
```

### 4.3 Main Layout with Theme Integration

**File: `frontend/src/components/layout/MainLayout.tsx`**
```typescript
import React from 'react';
import { Header } from './Header';
import { BrandSwitcher } from '../brand/BrandSwitcher';
import { useTheme } from '../../contexts/ThemeContext';

export const MainLayout: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div 
      className="min-h-screen font-brand transition-colors duration-500"
      style={{ backgroundColor: theme?.background }}
    >
      <Header />
      
      {/* Brand Switcher - Dev Tool */}
      <div className="fixed bottom-4 right-4 z-50">
        <BrandSwitcher />
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div 
          className="bg-brand-surface rounded-brand shadow-lg p-8 border border-brand-primary/10"
        >
          <h1 className="text-3xl font-bold text-brand-text mb-4">
            Welcome to {theme?.brand_name} Support Center
          </h1>
          <p className="text-brand-text-light">
            The brand theme is now active. All components will automatically 
            adapt to the selected brand's visual identity.
          </p>
        </div>
      </main>
    </div>
  );
};
```

---

## 🖼️ Step 5: Logo Assets Setup

### 5.1 Add Logo Files

Place your logo files in: `frontend/public/assets/logos/`

Expected files:
- `halilit.svg` (or .png)
- `halilit-favicon.png`
- `roland.svg`
- `roland-favicon.png`
- `yamaha.svg`
- `yamaha-favicon.png`

### 5.2 Logo Guidelines

**SVG Format (Recommended):**
```svg
<!-- Example: halilit.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
  <!-- Logo content -->
  <!-- Use currentColor for adaptable colors -->
</svg>
```

**Image Specifications:**
- Logo: 200-400px width, transparent background
- Favicon: 32x32px or 64x64px PNG
- Format: SVG preferred, PNG acceptable
- File size: < 100KB

---

## 🔄 Step 6: WebSocket Integration

### 6.1 Update WebSocket Store

**File: `frontend/src/store/useWebSocketStore.ts`** (add to existing)
```typescript
import { useTheme } from '../contexts/ThemeContext';

// Add to your existing store state
interface WebSocketState {
  // ... existing state
  currentBrandId: string | null;
  setCurrentBrand: (brandId: string) => Promise<void>;
}

// Add to your store implementation
setCurrentBrand: async (brandId: string) => {
  set({ currentBrandId: brandId });
  
  // Load theme
  const { loadTheme } = useTheme();
  await loadTheme(brandId);
  
  // Notify backend
  const ws = get().ws;
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'set_brand_context',
      brand_id: brandId
    }));
  }
},
```

### 6.2 Auto-Theme on Product Selection

**File: `frontend/src/components/chat/ChatView.tsx`** (enhance existing)
```typescript
import { useTheme } from '../../contexts/ThemeContext';

// Inside your component
const { loadTheme } = useTheme();

const handleProductSelect = async (product: any) => {
  // Load theme for product's brand
  if (product.brand_id) {
    await loadTheme(product.brand_id);
  }
  
  // ... rest of your selection logic
};
```

---

## 🎯 Step 7: Testing

### 7.1 Test Backend

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Test theme endpoints
curl http://localhost:8000/api/theme/halilit
curl http://localhost:8000/api/theme/
```

### 7.2 Test Frontend

```bash
# Start frontend
cd frontend
pnpm dev

# Open browser to http://localhost:5173
# Use BrandSwitcher component to switch between brands
# Verify:
# - Logo appears in header
# - Colors change throughout UI
# - Favicon updates
# - Typography changes (if defined)
```

---

## 📋 Implementation Checklist

### Backend
- [ ] Created `backend/app/models/theme.py`
- [ ] Created `backend/app/services/theme_service.py`
- [ ] Created `backend/app/routers/theme.py`
- [ ] Updated `backend/app/main.py` to include theme router
- [ ] Added theme data to all brand catalogs
- [ ] Tested theme API endpoints

### Frontend
- [ ] Created `frontend/src/contexts/ThemeContext.tsx`
- [ ] Updated `frontend/tailwind.config.js`
- [ ] Updated `frontend/src/App.tsx` with ThemeProvider
- [ ] Created `frontend/src/components/layout/Header.tsx`
- [ ] Created `frontend/src/components/brand/BrandSwitcher.tsx`
- [ ] Created `frontend/src/components/layout/MainLayout.tsx`
- [ ] Added logo files to `frontend/public/assets/logos/`
- [ ] Updated WebSocket integration for auto-theming

### Testing
- [ ] Backend returns correct theme data
- [ ] Frontend theme switches work
- [ ] Logos display correctly
- [ ] Favicons update
- [ ] Colors apply throughout UI
- [ ] No console errors
- [ ] Smooth transitions between themes

---

## 🚀 Next Steps

1. **Add More Brands**: Follow the pattern to add Korg, Behringer, etc.
2. **Brand Patterns**: Create subtle background patterns per brand
3. **Loading States**: Add skeleton screens with brand colors
4. **Animations**: Add brand-specific micro-animations
5. **Persistence**: Save user's last selected brand to localStorage

---

## 💡 Pro Tips

1. **Color Accessibility**: Ensure all brand colors meet WCAG AA standards
2. **Logo Fallbacks**: Always provide text fallback if logo fails
3. **Performance**: Lazy load logos and patterns
4. **Cache**: Consider caching themes in localStorage
5. **Testing**: Test with high-contrast mode and dark themes

---

## 🐛 Troubleshooting

**Logos not showing?**
- Check file paths in catalog JSON
- Verify files exist in `public/assets/logos/`
- Check browser console for 404 errors

**Colors not changing?**
- Verify CSS custom properties in DevTools
- Check Tailwind config has brand colors
- Ensure ThemeProvider wraps your app

**Theme API 404?**
- Verify theme router is registered in main.py
- Check backend is running
- Verify catalog files have theme data

**Performance issues?**
- Memoize theme calculations
- Use CSS custom properties (faster than inline styles)
- Lazy load logo images
