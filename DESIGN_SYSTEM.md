# HSC-JIT v3.7 Design System
## "Mission Control" UI Architecture

**Last Updated:** January 22, 2026  
**Status:** Production-Ready

---

## 🎯 Design Philosophy

### Core Principles

1. **"Studio Hardware" Aesthetic**
   - Inspired by professional audio equipment (mixing consoles, hardware synths)
   - Dark matte surfaces with LED-style indicators
   - Glass/metal material effects
   - High contrast for clarity under any lighting

2. **"Clear as Sun" Visibility**
   - Maximum contrast ratios (WCAG AAA target)
   - Bright, legible typography
   - No ambiguous states
   - Instant visual feedback

3. **"Musician Mindset" Organization**
   - Function over brand
   - Category-first navigation
   - Minimal cognitive load
   - Predictable patterns

---

## 🎨 Color Palette

### Base Studio Palette

```css
--studio-bg: #0e0e10;         /* Deepest matte black/grey - Main background */
--studio-panel: #18181b;      /* Module/panel background */
--studio-metal: #27272a;      /* Border/separator color */
```

### Signal Colors (LED Indicators)

```css
--led-active: #00ff94;        /* Active/success state - Bright green */
--led-standby: #3f3f46;       /* Inactive/disabled state - Dim grey */
--led-record: #ff3333;        /* Alert/attention state - Red */
```

### Glass Effects

```css
--glass-gloss: rgba(255, 255, 255, 0.08);   /* Subtle surface shine */
--glass-border: rgba(255, 255, 255, 0.15);  /* Glass edge highlight */
```

### Category Colors (Cognitive Anchors)

Each category has a distinctive color for instant recognition:

```css
--cat-keys: #f59e0b;          /* Amber - Keys & Pianos */
--cat-drums: #ef4444;         /* Red - Drums & Percussion */
--cat-guitars: #3b82f6;       /* Blue - Guitars & Amps */
--cat-studio: #10b981;        /* Emerald - Studio & Recording */
--cat-live: #8b5cf6;          /* Violet - Live Sound */
--cat-dj: #ec4899;            /* Pink - DJ & Production */
--cat-headphones: #6366f1;    /* Indigo - Headphones */
--cat-accessories: #64748b;   /* Slate - Accessories */
```

---

## 📐 Spacing System

### Scale (based on 4px grid)

```css
--space-0: 0;
--space-1: 4px;     /* 0.25rem - Micro spacing */
--space-2: 8px;     /* 0.5rem - Tight grouping */
--space-3: 12px;    /* 0.75rem - Standard gap */
--space-4: 16px;    /* 1rem - Default padding */
--space-6: 24px;    /* 1.5rem - Section spacing */
--space-8: 32px;    /* 2rem - Large gaps */
--space-12: 48px;   /* 3rem - Major sections */
```

### Component-Specific Spacing

#### CandyCard (Subcategory Thumbnails)
```css
/* Thumbnail container */
padding: 16px;           /* 1rem - Breathing room */

/* Thumbnail image */
width: 64px;             /* 4rem - Optimized for clarity */
height: 64px;
margin-bottom: 4px;      /* 0.25rem - MINIMAL gap to label */

/* Label */
font-size: 9px;          /* Micro typography */
line-height: 1.2;        /* Tight leading */
margin-top: 0;           /* NO gap - directly under thumbnail */

/* Brand badges */
margin-top: 2px;         /* 0.125rem - Subtle separation */
gap: 2px;                /* Tight badge grouping */
```

---

## 🖼️ Image System

### Visual Factory Pipeline

All product images processed through `/backend/services/visual_factory.py`:

#### Thumbnail Images (400x400px)
- **Format:** WebP, 92% quality
- **Processing:**
  - AI background removal (rembg)
  - Auto-crop with 10px margin
  - Smart centering
  - 1.3x sharpness enhancement
  - 1.1x saturation boost
- **Naming:** `{brand}-{product-slug}_thumb.webp`
- **Usage:** Category grids, navigation, previews

#### Inspection Images (2400px max)
- **Format:** WebP, 95% quality
- **Processing:**
  - High-resolution preservation
  - Unsharp mask for detail
  - Contrast normalization
- **Naming:** `{brand}-{product-slug}_inspect.webp`
- **Usage:** Workbench detail view, zoom inspection

### Image Path Convention

```typescript
// Thumbnails
"/data/product_images/{brand}/{brand}-{product-slug}_thumb.webp"

// Inspection
"/data/product_images/{brand}/{brand}-{product-slug}_inspect.webp"

// Examples:
"/data/product_images/roland/roland-fantom-06_thumb.webp"
"/data/product_images/nord/nord-nord-lead-a1_inspect.webp"
```

---

## 📝 Typography

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale

```css
/* Display/Headings */
--text-3xl: 30px;        /* Major section headers */
--text-2xl: 24px;        /* Panel titles */
--text-xl: 20px;         /* Card headers */
--text-lg: 18px;         /* Subheadings */

/* Body */
--text-base: 16px;       /* Default body text */
--text-sm: 14px;         /* Secondary text */
--text-xs: 12px;         /* Labels, captions */

/* Micro */
--text-2xs: 10px;        /* Timestamps, metadata */
--text-3xs: 9px;         /* Subcategory labels (CandyCard) */
--text-4xs: 8px;         /* Micro badges */
```

### Font Weights

```css
--font-light: 300;       /* Rarely used */
--font-normal: 400;      /* Body text */
--font-medium: 500;      /* Buttons, emphasis */
--font-semibold: 600;    /* Subheadings */
--font-bold: 700;        /* Headers */
--font-black: 900;       /* Display text, all-caps */
```

### Typography Rules

1. **Subcategory Labels:** 9px semibold, tight leading (1.2)
2. **Category Headers:** 16px black, uppercase, wide tracking (0.25em)
3. **Product Names:** 14px bold, normal tracking
4. **Metadata:** 10px medium, monospace for numbers

---

## 🔘 Components

### CandyCard (Subcategory Module)

**Purpose:** Display subcategory with thumbnail, label, and brand badges

```tsx
// Component Structure
<CandyCard>
  <Background /> {/* Gradient warmth */}
  <Content>
    <Title /> {/* Category name */}
    <SubcategoryGrid>
      <Thumbnail /> {/* 64x64px, 4px gap to label */}
      <Label />    {/* 9px, tight line-height */}
      <Badges />   {/* 2px top margin */}
    </SubcategoryGrid>
  </Content>
</CandyCard>
```

**Spacing Rules:**
- Card padding: 16px
- Thumbnail size: 64×64px
- Thumbnail → Label gap: **4px** (reduced from 8px)
- Label → Badges gap: 2px
- Grid gap: 8px

**Visual Effects:**
- Border: `border-white/20` → hover `border-white/50`
- Active ring: `ring-2 ring-amber-400`
- Thumbnail hover: `scale-105` transform
- Label hover: cyan color shift

---

## 🎭 States & Interactions

### Interactive States

```css
/* Default */
opacity: 1;
border: 1px solid rgba(255, 255, 255, 0.2);

/* Hover */
opacity: 1;
border: 1px solid rgba(255, 255, 255, 0.5);
transform: scale(1.02); /* Subtle lift */

/* Active/Selected */
border: 2px solid #f59e0b; /* Category color */
box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);

/* Disabled */
opacity: 0.5;
cursor: not-allowed;
```

### Animations

```css
/* Duration Standards */
--transition-fast: 150ms;    /* Micro-interactions */
--transition-base: 200ms;    /* Default */
--transition-slow: 300ms;    /* Emphasis */

/* Easing */
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 📱 Responsive Behavior

### Breakpoints

```css
/* Mobile First */
--screen-sm: 640px;     /* Small tablets */
--screen-md: 768px;     /* Tablets */
--screen-lg: 1024px;    /* Laptops */
--screen-xl: 1280px;    /* Desktops */
--screen-2xl: 1536px;   /* Large displays */
```

### Component Adaptations

#### CandyCard Subcategory Grid

```css
/* Mobile (< 640px) */
grid-template-columns: repeat(2, 1fr); /* 2 columns */

/* Tablet (640px+) */
grid-template-columns: repeat(3, 1fr); /* 3 columns */

/* Desktop (1024px+) */
grid-template-columns: repeat(3, 1fr); /* Maintain 3 columns */
```

**Thumbnail Sizing:**
- Mobile: 48×48px (reduced for space)
- Tablet+: 64×64px (optimal clarity)

---

## ♿ Accessibility

### WCAG Compliance

**Target Level:** AAA (where possible)

#### Contrast Ratios

```
Text on Background:
- Large text (18px+): 4.5:1 minimum ✅
- Body text (16px): 7:1 minimum ✅
- Small text (12px): 7:1 minimum ✅

Interactive Elements:
- Buttons: 4.5:1 minimum ✅
- Focus indicators: 3:1 minimum ✅
```

#### Keyboard Navigation

- All interactive elements focusable
- Visible focus rings (2px solid cyan)
- Logical tab order
- Skip navigation links

#### Screen Readers

- Semantic HTML (`<nav>`, `<button>`, `<article>`)
- ARIA labels on icons
- Alt text on all images
- Live region announcements

---

## 🔧 Implementation Guidelines

### CSS Variables Usage

```css
/* Always use design tokens */
.component {
  /* ✅ CORRECT */
  padding: var(--space-4);
  color: var(--led-active);
  
  /* ❌ WRONG */
  padding: 16px;
  color: #00ff94;
}
```

### Component Patterns

```tsx
// ✅ CORRECT: Composable, semantic
<CandyCard
  title="Keys & Pianos"
  subcategories={keysSubcategories}
  onSubcategoryClick={handleClick}
/>

// ❌ WRONG: Over-specified, inflexible
<div className="candy-card-keys-pianos-wrapper">
  <div className="card-header-title-keys">Keys & Pianos</div>
  ...
</div>
```

### Image References

```tsx
// ✅ CORRECT: Use processed thumbnails
<img src="/data/product_images/roland/roland-fantom-06_thumb.webp" />

// ❌ WRONG: Direct external URLs (breaks offline)
<img src="https://example.com/product.jpg" />

// ❌ WRONG: Unprocessed images
<img src="/data/raw/product.png" />
```

---

## 🚀 Performance Targets

### Load Times

- **Initial Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Image Load (thumbnail):** < 300ms
- **Image Load (inspection):** < 1s

### Optimization Techniques

1. **WebP Format:** 30-40% smaller than JPEG/PNG
2. **Lazy Loading:** `loading="lazy"` on images
3. **Size Optimization:** Thumbnails at 400×400px max
4. **Caching:** Aggressive service worker caching
5. **Preloading:** Critical images preloaded

---

## 📦 File Organization

```
frontend/src/
├── styles/
│   ├── tokens.css           ← Design system variables
│   └── animations.css       ← Reusable animations
├── components/
│   ├── ui/
│   │   ├── CandyCard.tsx    ← Subcategory card component
│   │   ├── ProductGrid.tsx  ← Product grid layout
│   │   └── Button.tsx       ← Base button component
│   └── smart-views/
│       └── TierBarV2.tsx    ← Category navigation
└── index.css                ← Global styles + tokens
```

---

## 🔄 Version History

### v3.7.4 (Current)
- ✅ Reduced thumbnail-to-label gap from 8px → 4px
- ✅ Optimized CandyCard spacing for density
- ✅ Updated all subcategory thumbnails to use processed WebP images
- ✅ Standardized 64×64px thumbnail size across categories

### v3.7.3
- ✅ Introduced "Clear as Sun" high-contrast design
- ✅ Implemented Visual Factory image processing
- ✅ Added category color coding system

### v3.7.0
- ✅ "Studio Dark" color palette
- ✅ Universal category system
- ✅ Glass/metal material effects

---

## 🎯 Future Enhancements

### Short Term
- [ ] Add dark/light mode toggle (maintain "Studio" aesthetic)
- [ ] Implement category color theming in product details
- [ ] Add micro-animations to brand badges

### Long Term
- [ ] Custom font for display text (hardware-style)
- [ ] Advanced image zoom with pan
- [ ] 3D product viewer integration

---

**Maintained by:** HSC-JIT Development Team  
**Reference:** [GitHub Repository](https://github.com/yourusername/hsc-jit-v3)
