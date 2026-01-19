# Mission Control v3.7 - Developer Quick Start

## TL;DR

The UI now **automatically changes colors** when users select different brands. No manual theme switching needed.

```typescript
// That's it! This hook is already in Workbench:
useBrandTheme(selectedProduct?.brand || "default");

// Selecting a product instantly transforms the UI colors
```

---

## 🎨 How It Works

### 1. User selects a product

```
Click on "Roland TD-27" in Navigator
```

### 2. Workbench receives the product

```typescript
const { selectedProduct } = useNavigationStore();
// selectedProduct = { brand: "Roland", name: "TD-27", ... }
```

### 3. Theme hook is called

```typescript
// Already in Workbench.tsx
useBrandTheme(selectedProduct?.brand || "default");
```

### 4. CSS variables are set globally

```css
--brand-primary: #ef4444 /* Red */ --brand-secondary: #1f2937 /* Gray */
  --brand-accent: #fbbf24 /* Amber */
  --brand-gradient-hero: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
```

### 5. All components using these variables update instantly

```tsx
<div className="bg-brand-primary border border-brand-accent">
  ✨ This div is now RED with AMBER border
</div>
```

---

## 📖 Using Brand Colors in Components

### Method 1: Tailwind Classes (Recommended)

```tsx
// In any component:
<div className="bg-brand-primary text-brand-accent">
  This div is automatically the current brand's colors!
</div>

// Available classes:
// bg-brand-primary, bg-brand-secondary, bg-brand-accent
// text-brand-primary, text-brand-secondary, text-brand-accent
// shadow-glow-brand
```

### Method 2: CSS Variables

```tsx
<div
  style={{
    background: "var(--brand-primary)",
    borderColor: "var(--brand-accent)",
    boxShadow: "0 0 20px var(--brand-primary)",
  }}
>
  Using CSS variables directly
</div>
```

### Method 3: Using the Hook

```typescript
import { useBrandTheme } from '../hooks/useBrandTheme';

function MyComponent({ brandName }: { brandName: string }) {
  // Apply theme when component mounts
  useBrandTheme(brandName);

  // Now all CSS variables are set
  return (
    <div style={{ background: 'var(--brand-primary)' }}>
      Brand-aware component!
    </div>
  );
}
```

---

## 🎯 Real-World Example

### Before (Static Colors)

```tsx
<header className="border-t-4 border-red-600 bg-zinc-900">
  <h1 className="text-white">Roland TD-27</h1>
  <span className="bg-amber-500 text-black">Drums</span>
</header>
```

**Problem**: Colors are hardcoded. Doesn't work for other brands.

### After (Dynamic Colors)

```tsx
import { useBrandTheme } from "../hooks/useBrandTheme";

export function ProductHeader({ product }: { product: Product }) {
  // ✨ Apply theme automatically
  useBrandTheme(product.brand);

  return (
    <header
      className="border-t-4 border-brand-primary bg-brand-bg"
      style={{ borderTopColor: "var(--brand-primary)" }}
    >
      <h1 className="text-white">{product.name}</h1>
      <span
        className="px-3 py-1 rounded font-bold text-brand-text"
        style={{ background: "var(--brand-primary)" }}
      >
        {product.category}
      </span>
    </header>
  );
}
```

**Result**: Component works for ANY brand. Colors change automatically!

---

## 🌈 Available Brand Colors

### Roland (RED)

```css
--brand-primary: #ef4444 /* Red */ --brand-secondary: #1f2937 /* Gray-800 */
  --brand-accent: #fbbf24 /* Amber */;
```

### Yamaha (PURPLE)

```css
--brand-primary: #a855f7 /* Purple */ --brand-secondary: #fbbf24 /* Amber */
  --brand-accent: #22d3ee /* Cyan */;
```

### Korg (ORANGE)

```css
--brand-primary: #fb923c /* Orange */ --brand-secondary: #1f2937 /* Gray-800 */
  --brand-accent: #34d399 /* Emerald */;
```

### Moog (CYAN)

```css
--brand-primary: #22d3ee /* Cyan */ --brand-secondary: #f87171 /* Red-400 */
  --brand-accent: #34d399 /* Emerald */;
```

### Nord (RED-LIGHT)

```css
--brand-primary: #f87171 /* Red-400 */ --brand-secondary: #1f2937 /* Gray-800 */
  --brand-accent: #fbbf24 /* Amber */;
```

---

## 🔌 Hook Signatures

### useBrandTheme

```typescript
// String mode - looks up color from theme dictionary
useBrandTheme("roland"); // ← Recommended for component routing
useBrandTheme("yamaha");
useBrandTheme("default"); // Fallback

// Object mode - applies colors directly (good for JSON data)
useBrandTheme({
  primary: "#ef4444",
  secondary: "#1f2937",
  accent: "#fbbf24",
  background: "#18181b",
  text: "#ffffff",
});
```

---

## 🚀 Common Use Cases

### Case 1: Product Detail Page

```tsx
export function ProductPage() {
  const { selectedProduct } = useNavigationStore();

  // ✨ Theme changes when product changes
  useBrandTheme(selectedProduct?.brand);

  return (
    <div className="flex flex-col gap-4">
      <header className="border-t-4 border-brand-primary">
        <h1>{selectedProduct.name}</h1>
      </header>

      <section className="bg-brand-bg rounded-lg border border-brand-primary/20">
        {/* Content */}
      </section>
    </div>
  );
}
```

### Case 2: Brand Selector

```tsx
export function BrandSelector({ brands }: { brands: Brand[] }) {
  const [selectedBrand, setSelectedBrand] = useState(brands[0].name);

  useBrandTheme(selectedBrand);

  return (
    <div>
      {brands.map((brand) => (
        <button
          key={brand.slug}
          onClick={() => setSelectedBrand(brand.name)}
          className="px-4 py-2 rounded bg-brand-primary text-brand-text"
        >
          {brand.name}
        </button>
      ))}
    </div>
  );
}
```

### Case 3: Dynamic Badges

```tsx
export function ProductBadge({ product }: { product: Product }) {
  useBrandTheme(product.brand);

  return (
    <span
      className="px-3 py-1 rounded font-bold text-white"
      style={{ background: "var(--brand-primary)" }}
    >
      {product.category}
    </span>
  );
}
```

---

## ⚠️ Important Notes

### 1. Hook Must Be Called at Component Level

```tsx
// ✅ GOOD - Hook called at component level
function ProductDisplay({ product }: { product: Product }) {
  useBrandTheme(product.brand); // Called here
  return <div>...</div>;
}

// ❌ WRONG - Hook called conditionally
function ProductDisplay({ product }: { product: Product }) {
  if (product) {
    useBrandTheme(product.brand); // ❌ Conditional
  }
  return <div>...</div>;
}
```

### 2. CSS Variables Are Global

The variables are set on `document.documentElement`, so they affect the entire page:

```tsx
// This affects the whole app
useBrandTheme('roland');

// All these components now use Roland colors:
<div className="bg-brand-primary">Red 🎉</div>
<div className="bg-brand-secondary">Gray 🎉</div>
<div className="bg-brand-accent">Amber 🎉</div>
```

### 3. Cleanup Is Automatic

When component unmounts, variables are reset to defaults. No cleanup needed!

```tsx
// Entering component → Theme applied
// Exiting component → Theme reset automatically ✨
```

---

## 🧪 Testing Your Implementation

### 1. Check Variables Are Set

```javascript
// In browser console:
getComputedStyle(document.documentElement).getPropertyValue("--brand-primary");
// Should return: "#ef4444" (or whatever brand is active)
```

### 2. Test Theme Switching

```javascript
// In browser console:
const hook = require("../hooks/useBrandTheme");
// Then select different products in the UI
// Colors should change instantly
```

### 3. Verify Tailwind Classes Work

```html
<!-- In component -->
<div class="bg-brand-primary text-brand-accent">Should show brand colors</div>
```

---

## 📚 Reference Files

| File                                    | Purpose           | Status   |
| --------------------------------------- | ----------------- | -------- |
| `frontend/src/hooks/useBrandTheme.ts`   | Theme hook        | ✅ Ready |
| `frontend/src/styles/brandThemes.ts`    | Color definitions | ✅ Ready |
| `frontend/tailwind.config.js`           | Tailwind config   | ✅ Ready |
| `frontend/src/components/Workbench.tsx` | Uses hook         | ✅ Ready |

---

## 🎯 Migration Checklist

If you have components with hardcoded colors, update them:

```tsx
// OLD - Hardcoded Red (only works for Roland)
<div className="bg-red-500">...</div>

// NEW - Dynamic Red (works for any brand)
<div className="bg-brand-primary">...</div>
```

Quick sed command to help:

```bash
# Find all hardcoded color classes that should be brand-aware
grep -r "bg-red\|text-red\|border-red" frontend/src/components/
# Then manually update to use brand colors
```

---

## 🆘 Troubleshooting

### Issue: Colors not changing

**Solution**: Make sure `useBrandTheme()` is called in the component. Check browser console for errors.

### Issue: FOUC (Flash of Unstyled Content)

**Solution**: Apply initial brand theme in App.tsx before rendering components.

### Issue: Theme not resetting

**Solution**: This is automatic. If it's not resetting, check browser DevTools → Application → CSS Variables.

### Issue: Tailwind classes not working

**Solution**: Ensure `frontend/tailwind.config.js` is updated with `'brand'` colors section.

---

## 📞 Questions?

- **Hook usage**: See `frontend/src/hooks/useBrandTheme.ts`
- **Component example**: See `frontend/src/components/Workbench.tsx`
- **Theme colors**: See `frontend/src/styles/brandThemes.ts`
- **Full guide**: See `MISSION_CONTROL_THEMING_GUIDE.md`

---

**Status**: ✅ Production-Ready  
**Version**: 3.7.0  
**Last Updated**: January 2026
