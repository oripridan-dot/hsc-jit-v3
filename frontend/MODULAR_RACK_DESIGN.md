# Modular Rack System - Visual Design Guide

## 🎛️ Module Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  HOVER SCREEN (appears above on hotspot hover)                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [Image]      │ Price: ₪ 12,500  │  Brand: Roland           │ │
│  │ (36x36px)    │ Category: Keys   │  Model: Juno-106        │ │
│  │              │ Description: 6-voice analog...               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ │
└──────────────────────────────────────────────────────────────────┘
                          ↓ (hovers)
┌──────────────────────────────────────────────────────────────────┐
│ [01] 🎹  Synthesizers                            RK-MOD-SYN [12] │
│      ═══════════════════════════════════════════════════════     │
├──────────────────────────────────────────────────────────────────┤
│     ✦ FREQUENCY VISUALIZATION (animated bars)                    │
│     ▁▂▃▂▁▂▃▂▁▂▃▂▁▂▃▂▁▂▃▂▁▂▃▂▁▂▃▂▁▂▃▂▁▂▃▂▁▂▃▂▁▂▃▂            │
│                                                                    │
│     ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●   │
│   (1)  (2)  (3)  (4)  (5)  (6)  (7)  (8)  (9) (10) (11) (12)    │
│                                                                    │
│     ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ │
│     ════════════════════════════════════════════════════════ (meter) │
├──────────────────────────────────────────────────────────────────┤
│  ◆ RK-MOD-SYN • SLOTS: 12                                         │
└──────────────────────────────────────────────────────────────────┘
```

## 🎨 Color Palette

### State Colors

**Hotspot (Inactive)**

- Background: Zinc-600 (from) → Zinc-700 (to)
- Border: Zinc-500/80
- Text: White dot (●)

**Hotspot (Hover)**

- Background: Zinc-500 → Zinc-600
- Border: Zinc-400
- Shadow: Zinc-500/30
- Scale: +20%

**Hotspot (Active)**

- Background: Cyan-500
- Border: Cyan-300
- Glow: Cyan-500/60 shadow
- Animation: Breathing pulse
- Scale: +10%

### Data Display Colors (HoverScreen)

| Field    | Color       | Purpose                  |
| -------- | ----------- | ------------------------ |
| Price    | Cyan-400    | Monetary value highlight |
| Category | Purple-400  | Classification           |
| Brand    | White       | Primary info             |
| Model    | Green-400   | Technical identifier     |
| Borders  | Cyan-500/40 | Modern accent            |

### Module Colors

- **Background**: Gradient (brand-specific or category color)
- **Header Border**: White/10 (subtle)
- **Track Background**: Black/50 with white/10 accent
- **Text**: White (primary), Zinc-300 (secondary), Zinc-400 (tertiary)

## 🎬 Animation Specifications

### Hotspot Animations

**Hover Animation**

```
Scale: 1.0 → 1.2 (100ms ease-out)
Ring expansion: 1.0 → 1.4 (600ms ease-out)
Box shadow: normal → glowing (300ms)
```

**Active (Glow) Animation**

```
Glow radius: 1.0 → 1.3 → 1.0 (2000ms infinite)
Glow opacity: 0.5 → 0.2 → 0.5 (2000ms infinite)
Breathing effect - naturalistic pulse
```

**Tap/Click Animation**

```
Scale: 1.2 → 0.9 (100ms ease-in-out)
Feedback: immediate visual response
```

### Module Animations

**Hover Glow**

```
Gradient overlay: opacity 0 → 1 (300ms ease-in-out)
Shadow: normal → cyan-500/20 (300ms)
```

**Frequency Visualization**

```
Bar heights: oscillate sine wave pattern (2000ms)
Opacity: 20% baseline (subtle, non-intrusive)
Colors: Cyan-500/50 → Purple-500/50 gradient
```

### HoverScreen Animations

**Appearance**

```
Opacity: 0 → 1 (250ms ease-out)
Scale: 0.95 → 1.0 (250ms ease-out)
Y-position: 20px → 0px (250ms ease-out)
```

**Content Stagger**

```
Image: appear + scale (delay: 100ms)
Price box: appear + slide (delay: 100ms)
Category box: appear + slide (delay: 150ms)
Brand box: appear + slide (delay: 200ms)
Model box: appear + slide (delay: 250ms)
Description: appear + slide (delay: 300ms)
Status indicator: pulse (2000ms loop)
```

## 📏 Sizing & Spacing

### Module Dimensions

| Element          | Size          | Notes                     |
| ---------------- | ------------- | ------------------------- |
| Module Height    | 16rem (256px) | py-6 + content            |
| Header Height    | ~3rem         | Icon + text + border      |
| Hotspot Row      | 4rem (64px)   | h-16                      |
| Footer Height    | ~1.5rem       | pt-4 + text               |
| **Total Height** | ~22rem        | Flexible based on content |

### Hotspot Sizing

| Element                  | Size     | Notes                   |
| ------------------------ | -------- | ----------------------- |
| Hotspot Diameter (Base)  | 32px     | w-8 h-8                 |
| Hotspot Diameter (Hover) | 38.4px   | +20% scale              |
| Hotspot Spacing          | Flexible | Distributed via flexbox |
| Glow Blur                | 12px     | blur-md                 |
| Glow Ring                | 16px+    | motion expansion        |

### HoverScreen Sizing

| Element         | Size              | Notes      |
| --------------- | ----------------- | ---------- |
| Image Size      | 144px (36x36)     | w-36 h-36  |
| Content Padding | 1.25rem           | p-5        |
| Spec Box        | flex 1            | 2x2 grid   |
| Total Width     | Full module width | Responsive |
| **Spacing**     | 1rem gap          | flex gap-4 |

## 🌈 Responsive Behavior

### Desktop (1024px+)

- Full module width display
- Horizontal hotspot distribution
- Large HoverScreen above
- Full animations enabled

### Tablet (768px - 1024px)

- Slightly reduced spacing
- Hotspots remain distributed
- HoverScreen adapts proportionally
- Full animations

### Mobile (< 768px)

- Stack view optimized
- May need tap-to-expand
- Smaller hotspots
- Simpler animations for performance

## 🎯 Interaction Hotspots

```
┌─ Module Clickable Area
├─ Hotspot: 44px+ touch target (including padding)
├─ HoverScreen: Appears automatically (no click needed)
├─ Tooltip: Appears on hover
└─ Product Selection: Click hotspot

Accessibility:
├─ aria-label on buttons
├─ ARIA live regions for status
├─ Keyboard navigation: Tab to hotspots
└─ High contrast: Cyan on dark backgrounds
```

## 📊 Data Density

### HoverScreen Information Architecture

```
┌─────────────────────────────────┐
│ Product Name (H4 - 21px bold)   │
│ ─────────────────────────────── │
│ [Image] │ [2x2 Spec Grid]       │
│ 144px   │ └─ Price              │
│         │ └─ Category           │
│         │ └─ Brand              │
│         │ └─ Model              │
│ ─────────────────────────────── │
│ Description (2 lines max)       │
│ ─────────────────────────────── │
│ Status Bar • Status Indicator   │
└─────────────────────────────────┘

Total visible data: ~8-10 items
Scanning time: 1-2 seconds
Information hierarchy: Clear (name → specs → details)
```

## 🎤 Audio/Musical Interface Parallels

This design intentionally mirrors professional audio equipment:

```
Real Synthesizer Rack          Modular Rack UI
─────────────────────────────────────────────────
[Power On] Indicator    ←→     Status Indicator (●)
Module slots [1][2][3]  ←→     Rack numbering [01][02]
Patch points/jacks      ←→     Hotspots (● dots)
Display panel            ←→     HoverScreen
LED indicators          ←→     Cyan glow + animations
Signal flow visualization ←→   Frequency bars
Smooth analog feel      ←→     Smooth transitions/easing
```

This creates **cognitive resonance** for the target audience (musicians/producers).

## 🚀 Performance Considerations

### Animation Performance

- GPU-accelerated: transform, opacity only
- Avoid: width/height changes in animations
- Use: will-change CSS hints where appropriate
- Test: 60fps on target devices

### Rendering Optimization

- Virtualize hotspots if >100 products
- Memoize HoverScreen component
- useCallback for event handlers
- Debounce frequent state updates

### File Size

- Framer Motion bundle: ~40KB gzip
- Component code: ~15KB
- CSS: Tailwind classes (included)
- **Total addition**: ~55KB (minimal)

---

## 📝 Implementation Notes

1. **Module Identifier**: RK-MOD-XXX format (Rack Module)
2. **Hotspot Distribution**: Linear percentage (index / length)
3. **HoverScreen Portal**: Absolute positioning (bottom-full)
4. **Z-index Strategy**: hover screen (50), hotspots (30), module (default)
5. **Touch Support**: Hover state on touch = tap detection

---

**Design Version**: 3.8.0
**Last Updated**: 2026-01-23
**Design System**: HSC-JIT v3.7 (Dark theme + Professional aesthetics)
