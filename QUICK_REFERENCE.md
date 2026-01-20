# 🎨 Brandable Design System - Quick Reference Card

## 📖 For Developers

### Import the Hook

```tsx
import { useTheme } from "@/contexts/ThemeContext";
```

### Get Theme & Switch Brands

```tsx
const { theme, currentBrandId, applyTheme } = useTheme();

// Switch to Yamaha
applyTheme("yamaha");

// Access colors
console.log(theme?.colors.primary); // e.g., '#a855f7'
```

### Available Brands

- `roland` - Red (#ef4444)
- `yamaha` - Purple (#a855f7)
- `korg` - Orange (#fb923c)
- `moog` - Cyan (#22d3ee)
- `nord` - Red-light (#f87171)

---

## 🎨 Use Brand Colors

### Method 1: CSS Variables (Recommended)

```tsx
<div style={{ color: "var(--color-brand-primary)" }}>Branded Text</div>
```

### Method 2: Tailwind Classes

```tsx
<div className="bg-brand-primary text-white border-brand-accent">
  Branded Component
</div>
```

### Method 3: Direct Theme Access

```tsx
const { theme } = useTheme();
<div style={{ backgroundColor: theme?.colors.primary }}>
  {theme?.name} Theme
</div>;
```

---

## 🎯 Use Components

### BrandIcon

```tsx
import { BrandIcon } from '@/components/BrandIcon';
import { Home, Settings, Search } from 'lucide-react';

<BrandIcon icon={Home} variant="primary" size={24} />
<BrandIcon icon={Settings} variant="secondary" size={20} />
<BrandIcon icon={Search} variant="accent" size={18} />
```

**Variants:** `primary`, `secondary`, `accent`, `neutral`

### BrandedLoader

```tsx
import { BrandedLoader } from "@/components/BrandedLoader";

<BrandedLoader message="Loading..." size="md" />;
```

**Sizes:** `sm`, `md`, `lg`

### EmptyState

```tsx
import { EmptyState } from "@/components/EmptyState";
import { Package } from "lucide-react";

<EmptyState
  icon={Package}
  title="No Products"
  description="Try a different search"
  action={{
    label: "Browse All",
    onClick: () => navigate("/products"),
  }}
/>;
```

---

## 💅 CSS Custom Properties

| Property                   | Purpose          | Example Value |
| -------------------------- | ---------------- | ------------- |
| `--color-brand-primary`    | Main brand color | `#ef4444`     |
| `--color-brand-secondary`  | Supporting color | `#1f2937`     |
| `--color-brand-accent`     | Highlight/CTA    | `#fbbf24`     |
| `--color-brand-background` | Panel background | `#18181b`     |
| `--color-brand-text`       | Text on primary  | `#ffffff`     |

**Usage:**

```css
color: var(--color-brand-primary);
background: var(--color-brand-secondary);
border-color: var(--color-brand-accent);
```

---

## 🎨 Common Patterns

### Branded Button

```tsx
<button
  style={{
    backgroundColor: "var(--color-brand-primary)",
    color: "white",
  }}
  className="px-4 py-2 rounded font-medium"
>
  Click Me
</button>
```

### Branded Card

```tsx
<div
  style={{
    backgroundColor: "var(--bg-panel)",
    borderColor: "var(--color-brand-primary)",
    borderWidth: "2px",
  }}
  className="p-4 rounded-lg"
>
  Card Content
</div>
```

### Branded Icon + Text

```tsx
<div className="flex items-center gap-2">
  <BrandIcon icon={Settings} variant="primary" />
  <span style={{ color: "var(--color-brand-text)" }}>Settings</span>
</div>
```

### Branded Navigation Item

```tsx
<button
  className="flex items-center gap-3 px-4 py-3 rounded transition-all"
  style={{
    backgroundColor: active ? "var(--color-brand-primary)20" : "transparent",
    borderLeftColor: active ? "var(--color-brand-primary)" : "transparent",
    borderLeftWidth: "4px",
  }}
>
  <BrandIcon icon={icon} variant={active ? "primary" : "neutral"} />
  {label}
</button>
```

---

## ⚡ Performance Tips

✅ **Good Practices:**

- Use CSS variables for colors (instant, no re-renders)
- Use `BrandIcon` for all icons (auto-colored)
- Apply theme once on app load
- Use Tailwind shortcuts: `text-brand-primary`

❌ **Avoid:**

- Hardcoding colors (#ef4444 instead of var(--color-brand-primary))
- Reading theme object for every color (use CSS variables)
- Creating component copies per brand (use theming instead)

---

## 🧪 Testing Theme Changes

### In Browser Console

```javascript
// Check current theme
document.documentElement.style.getPropertyValue("--color-brand-primary");

// Switch theme
// (if you export applyTheme or have it available)
```

### In Component

```tsx
const { applyTheme, currentBrandId } = useTheme();

useEffect(() => {
  console.log("Current brand:", currentBrandId);
  console.log("Theme:", theme);
}, [currentBrandId, theme]);
```

---

## 📚 Further Reading

1. **BRANDABLE_DESIGN_SYSTEM_GUIDE.md** - Complete guide with examples
2. **src/contexts/ThemeContext.tsx** - Hook implementation
3. **src/lib/integrationExamples.tsx** - Real component examples
4. **src/lib/themeIntegration.tsx** - Demo components

---

## 🆘 Common Issues

### Colors not updating?

```bash
# Clear cache and rebuild
npm run build
# Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Type errors with BrandIcon?

```tsx
// ✅ Correct
import type { LucideIcon } from "lucide-react";

// ❌ Wrong (causes TS1484 error)
import { LucideIcon } from "lucide-react";
```

### CSS variables returning empty?

```tsx
// Check in console:
document.documentElement.getAttribute("style");
// Should show CSS custom properties set
```

---

## 🚀 Examples

### Switch to Yamaha Theme

```tsx
import { useTheme } from "@/contexts/ThemeContext";

function BrandSwitcher() {
  const { applyTheme } = useTheme();

  return <button onClick={() => applyTheme("yamaha")}>Switch to Yamaha</button>;
}
```

### Styled Product Card

```tsx
function ProductCard({ product }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-panel)",
        borderColor: "var(--color-brand-primary)",
        borderWidth: "2px",
      }}
      className="p-4 rounded-lg"
    >
      <h3 style={{ color: "var(--color-brand-text)" }}>{product.name}</h3>
      <button className="mt-4 bg-brand-primary text-white px-4 py-2 rounded">
        View Details
      </button>
    </div>
  );
}
```

### Loading & Empty States

```tsx
function SearchResults({ products, isLoading }) {
  if (isLoading) {
    return <BrandedLoader message="Searching..." size="lg" />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No Results"
        description="Try another search"
      />
    );
  }

  return (
    <div>
      {products.map((p) => (
        <Card key={p.id} item={p} />
      ))}
    </div>
  );
}
```

---

## 🔄 Update Existing Components

### Before

```tsx
<button className="bg-blue-500 text-white">
  <Home size={24} className="text-blue-500" />
  Home
</button>
```

### After

```tsx
<button className="bg-brand-primary text-white">
  <BrandIcon icon={Home} variant="primary" size={24} />
  Home
</button>
```

---

## 📞 Need Help?

1. Check this quick reference
2. Read `BRANDABLE_DESIGN_SYSTEM_GUIDE.md`
3. Look at examples in `integrationExamples.tsx`
4. Check `ThemeContext.tsx` source code

---

**Last Updated:** January 20, 2026  
**Version:** HSC JIT v3.7.1  
**Status:** ✅ Production Ready
