# Visual Style Guide - Studio-Grade Hardware

## Color Palette Reference

### Primary Colors

#### Zinc Grays (Neutral Metal)

```
zinc-950  #09090b  rgb(9 9 11)    ████████  Base (Darkest)
zinc-900  #18181b  rgb(24 24 27)  ████████  Elevated
zinc-800  #27272a  rgb(39 39 42)  ████████  Surface
zinc-700  #3f3f46  rgb(63 63 70)  ████████  Border
zinc-600  #52525b  rgb(82 82 91)  ████████  Tertiary Text
zinc-400  #a1a1aa  rgb(161 161 170) ████████  Secondary Text
zinc-50   #fafafa  rgb(250 250 250) ████████  Primary Text
```

#### Signal Colors

```
amber-500   #f59e0b  rgb(245 158 11)  ████████  Primary (LCD Warmth)
amber-600   #d97706  rgb(217 119 6)   ████████  Primary Hover
emerald-500 #10b981  rgb(16 185 129)  ████████  Success (Active)
red-500     #ef4444  rgb(239 68 68)   ████████  Error (Fault)
blue-500    #3b82f6  rgb(59 130 246)  ████████  Info (Processing)
```

---

## Component Specifications

### BrandCard

**Dimensions:**

- Aspect Ratio: 1:1 (Square)
- Border: 2px solid
- Border Radius: 0.75rem (12px)
- Padding: Internal 2rem (32px)

**States:**

| State | Border Color   | Background    | Scale | Shadow                          |
| ----- | -------------- | ------------- | ----- | ------------------------------- |
| Rest  | `zinc-800/60`  | `zinc-900/50` | 1.0   | `0 2px 8px rgba(0,0,0,0.4)`     |
| Hover | `amber-500/50` | `zinc-900/50` | 1.02  | `0 0 24px rgba(245,158,11,0.4)` |

**Logo Treatment:**

- Rest: `grayscale opacity-60`
- Hover: `grayscale-0 opacity-100 drop-shadow-[0_0_16px_rgba(245,158,11,0.3)]`

**Status LED:**

- Position: Top-right, 1rem from edge
- Size: 1.5px diameter
- Glow: `shadow-[0_0_8px_rgba(...,0.6)]`

---

### StatusLED

**Sizes:**

```
sm: 1.5px × 1.5px  (6px)
md: 2px × 2px      (8px)
lg: 2.5px × 2.5px  (10px)
```

**Colors & Meanings:**

```css
green:  Active, Ready, Optimal       #10b981 + glow
amber:  Syncing, Warning, Processing #f59e0b + glow
red:    Error, Fault, Overload       #ef4444 + glow
blue:   Info, Data Flow              #3b82f6 + glow
off:    Inactive, Disabled           #3f3f46 (no glow)
```

**Structure:**

```
┌─────────────────┐
│ ┌─┐             │  Ring (2px border)
│ │●│ < LED       │  Dot (1.5-2.5px)
│ └─┘             │  Glow (8px spread)
└─────────────────┘
```

---

## Audio Feedback Specification

### Sound Design Parameters

#### Click (Button Press)

```
Type:      Square Wave
Frequency: 800Hz → 400Hz (falling)
Duration:  50ms
Volume:    80% of base (0.12)
Attack:    Instant
Decay:     Exponential to 0.01
```

#### Hover (Mechanical Detent)

```
Type:      Sine Wave
Frequency: 600Hz (constant)
Duration:  30ms
Volume:    30% of base (0.045)
Attack:    Instant
Decay:     Exponential to 0.01
```

#### Toggle (Switch State)

```
Type:      Square Wave
Frequency: Pulse 1: 700Hz, Pulse 2: 900Hz
Duration:  100ms total (40ms + 60ms gap + 40ms)
Volume:    50% of base (0.075)
Pattern:   Double-pulse
```

#### Success (Confirmation)

```
Type:      Triangle Wave
Frequency: 440Hz → 880Hz (perfect fifth)
Duration:  120ms
Volume:    60% of base (0.09)
Attack:    Instant
Decay:     Exponential to 0.01
```

#### Error (Alert)

```
Type:      Sawtooth Wave
Frequency: 1200Hz → 800Hz (falling)
Duration:  100ms
Volume:    70% of base (0.105)
Attack:    Instant
Decay:     Exponential to 0.01
```

**Base Volume:** 0.15 (15% of maximum)
**Accessibility:** Auto-disabled for `prefers-reduced-motion: reduce`

---

## Typography Scale

### Headings (using Heading component)

```
h1: text-3xl md:text-4xl  (30px/36px)  font-bold  zinc-50
h2: text-2xl md:text-3xl  (24px/30px)  font-bold  zinc-50
h3: text-xl md:text-2xl   (20px/24px)  font-bold  zinc-50
h4: text-lg md:text-xl    (18px/20px)  font-bold  zinc-50
```

### Body Text (using Body component)

```
lg:   text-base  (16px)  font-sans  zinc-400
base: text-sm    (14px)  font-sans  zinc-400
sm:   text-xs    (12px)  font-sans  zinc-400
```

### Mono Labels (using MonoLabel component)

```
size: text-xs (12px)  font-mono  uppercase  tracking-wider  zinc-500
```

---

## Layout Patterns

### Card Grid

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
  <BrandCard />
  <BrandCard />
  <BrandCard />
  <BrandCard />
</div>
```

**Gap:** 1.5rem (24px)
**Responsive:** 2 cols mobile, 4 cols desktop

### Info Panel

```tsx
<div className="bg-zinc-900/50 backdrop-blur-md border-2 border-zinc-800/60 rounded-xl p-6">
  <MonoLabel className="text-amber-500 mb-2">SECTION TITLE</MonoLabel>
  <Body muted size="sm">
    Content here...
  </Body>
</div>
```

### Status Row

```tsx
<div className="flex items-center gap-4">
  <StatusLED color="green" size="sm" />
  <MonoLabel>SYSTEM READY</MonoLabel>
</div>
```

---

## Animation Timings

### Transitions

```css
Fast:    150ms  /* Quick state changes */
Base:    200ms  /* Default transitions */
Slow:    300ms  /* Emphasis, major changes */
Slower:  500ms  /* Entrances, modals */
```

### Easing

```css
default:  cubic-bezier(0.4, 0, 0.2, 1)  /* Standard ease */
in:       cubic-bezier(0.4, 0, 1, 1)    /* Accelerate */
out:      cubic-bezier(0, 0, 0.2, 1)    /* Decelerate */
in-out:   cubic-bezier(0.4, 0, 0.2, 1)  /* Smooth both ends */
```

### Scale Transforms

```css
Rest:     scale(1.0)    /* Default */
Hover:    scale(1.02)   /* Cards, buttons (subtle) */
Active:   scale(0.98)   /* Button press (rare) */
```

**Note:** Never use `scale(1.05)` or higher - too "bouncy" for hardware aesthetic.

---

## Shadow System

### Elevation

```css
sm:   0 1px 2px 0 rgba(0,0,0,0.05)      /* Subtle lift */
md:   0 4px 6px -1px rgba(0,0,0,0.1)    /* Cards at rest */
lg:   0 10px 15px -3px rgba(0,0,0,0.1)  /* Elevated cards */
xl:   0 20px 25px -5px rgba(0,0,0,0.1)  /* Modals */
```

### Glows (LED Effects)

```css
Primary:  0 0 20px rgba(245,158,11,0.4)   /* Amber hover */
Success:  0 0 20px rgba(16,185,129,0.5)   /* Green active */
Error:    0 0 20px rgba(239,68,68,0.5)    /* Red fault */
LED:      0 0 8px rgba(...,0.6)           /* Status indicators */
```

---

## Accessibility Requirements

### WCAG Compliance

- **Level:** AA Minimum
- **Contrast Ratio:** 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators:** Visible outline or glow
- **Motion:** Respect `prefers-reduced-motion`

### Implementation

```css
/* Focus Ring */
.focus-ring:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgb(9 9 11), 0 0 0 5px rgb(245 158 11);
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Color Contrast (against zinc-950 background)

```
zinc-50:   19.2:1 ✅ (Primary text)
zinc-400:  6.8:1  ✅ (Secondary text)
zinc-500:  5.1:1  ✅ (Muted text)
amber-500: 7.4:1  ✅ (Primary action)
```

---

## Design Tokens (CSS Variables)

### Complete Token List

```css
/* Colors - Background */
--color-bg-base: rgb(9 9 11);
--color-bg-elevated: rgb(24 24 27);
--color-bg-surface: rgb(63 63 70);

/* Colors - Primary */
--color-primary: rgb(245 158 11);
--color-primary-hover: rgb(217 119 6);
--color-primary-light: rgba(245 158 11 / 0.1);

/* Colors - Status */
--color-success: rgb(16 185 129);
--color-warning: rgb(245 158 11);
--color-error: rgb(239 68 68);

/* Colors - Text */
--color-text-primary: rgb(250 250 250);
--color-text-secondary: rgb(161 161 170);
--color-text-tertiary: rgb(82 82 91);
--color-text-muted: rgb(63 63 70);

/* Colors - Border */
--color-border: rgb(39 39 42);
--color-border-hover: rgb(63 63 70);
--color-border-focus: var(--color-primary);

/* Hardware Textures */
--glass-border: 1px solid rgba(255 255 255 / 0.08);
--metal-border: 2px solid rgba(39 39 42 / 0.6);

/* Shadows - LED Glows */
--shadow-led-amber: 0 0 8px rgba(245 158 11 / 0.6);
--shadow-led-green: 0 0 8px rgba(16 185 129 / 0.6);
--shadow-led-red: 0 0 8px rgba(239 68 68 / 0.6);
```

---

## Usage Examples

### Complete Card Component

```tsx
<BrandCard
  name="Moog"
  status="active"
  category="Synthesizers"
  logo_url="/logos/moog.png"
  onClick={() => {
    // Audio feedback is automatic
    handleBrandSelect("moog");
  }}
/>
```

### Status Display

```tsx
<div className="flex items-center gap-3">
  <StatusLED color="amber" size="md" pulse />
  <MonoLabel>SYNCING CATALOG</MonoLabel>
  <Body size="sm" muted>
    2m 15s remaining
  </Body>
</div>
```

### Interactive Button with Audio

```tsx
<Button
  variant="solid"
  size="md"
  onClick={() => {
    audioFeedback.click();
    handleAction();
  }}
>
  Execute
</Button>
```

---

**Reference Version:** HSC JIT v3.4 Design System v2
**Last Updated:** January 14, 2026
**Maintainer:** Design System Team
