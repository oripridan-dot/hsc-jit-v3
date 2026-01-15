# Design System v2: Studio-Grade Hardware Aesthetic

## Overview

This document details the refinements made to transform the HSC JIT v3.4 design system from "Modern SaaS" to "Pro Audio Rack" aesthetic.

---

## Visual Changes Summary

### Color Palette Migration

#### Before (v1): Slate + Blue

- **Base Grays**: Slate (Cool blue-grey undertone)
- **Primary Color**: Blue-500 (Generic corporate)
- **Feel**: Software dashboard, SaaS platform

#### After (v2): Zinc + Amber

- **Base Grays**: Zinc (Neutral metal/hardware)
- **Primary Color**: Amber-500 (Analog warmth, LCD glow)
- **Feel**: Rack-mounted hardware, studio equipment

### Color Token Changes

```css
/* OLD - tokens.css v1 */
--color-bg-base: rgb(15 23 42); /* Slate-900 */
--color-primary: rgb(59 130 246); /* Blue-500 */

/* NEW - tokens.css v2 */
--color-bg-base: rgb(9 9 11); /* Zinc-950 */
--color-primary: rgb(245 158 11); /* Amber-500 */
```

**Migration**: Replace all `slate-*` classes with `zinc-*` equivalents.

---

## Component Refinements

### BrandCard Component

#### Changes Made:

1. **Border Weight**: `border` (1px) → `border-2` (2px)
   - Simulates heavier rack chassis
2. **Removed**: Rainbow gradient top bar
   - Was too "gaming PC" aesthetic
3. **Added**: Subtle status LED indicator
   - Single-color functional indicator (Green/Amber/Off)
   - Hardware-style glow effect
4. **Hover State**:
   - Scale reduced: `scale-105` → `scale-[1.02]`
   - More restrained, less bouncy

#### Before:

```tsx
<div className="bg-slate-900 border border-blue-500">
  <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
</div>
```

#### After:

```tsx
<div className="bg-zinc-900/50 border-2 border-amber-500/50">
  <StatusLED color="green" size="sm" pulse={syncing} />
</div>
```

---

## New Components

### StatusLED

Hardware-style status indicator with LED glow simulation.

**Usage:**

```tsx
import { StatusLED } from "@/design-system";

<StatusLED
  color="green" // green | amber | red | blue | off
  size="sm" // sm | md | lg
  pulse={true} // Animate for "syncing" states
  label="Active" // Optional text label
/>;
```

**Visual Details:**

- Uses `shadow-[0_0_8px_rgba(...)]` for LED glow
- Ring border simulates recessed indicator housing
- Pulse animation only on transitional states (syncing, processing)

---

## Audio Feedback System

### Overview

Synthesized UI sounds using Web Audio API. No external files required.

### Available Sounds

| Sound         | Use Case                     | Technical                                    |
| ------------- | ---------------------------- | -------------------------------------------- |
| **click()**   | Button press, card selection | 800Hz → 400Hz, 50ms, Square wave             |
| **hover()**   | Card hover, focus states     | 600Hz, 30ms, Sine wave                       |
| **toggle()**  | Switch state change          | Double pulse: 700Hz + 900Hz                  |
| **success()** | Confirmation, completion     | 440Hz → 880Hz (perfect fifth), Triangle wave |
| **error()**   | Alert, validation failure    | 1200Hz → 800Hz, Sawtooth wave                |

### Integration

```tsx
import { audioFeedback } from "@/design-system";

<button
  onClick={() => {
    audioFeedback.click();
    handleAction();
  }}
  onMouseEnter={() => audioFeedback.hover()}
>
  Click Me
</button>;
```

### Settings

```typescript
// Volume control (0.0 - 1.0)
audioFeedback.setVolume(0.3);

// Enable/disable all sounds
audioFeedback.setEnabled(false);

// Cleanup when unmounting
audioFeedback.dispose();
```

**Accessibility**: Automatically respects `prefers-reduced-motion` preference.

---

## Typography Unchanged

The Typography system (Heading, Body, MonoLabel, etc.) remains **unchanged**. It was already well-structured and doesn't require hardware-specific modifications.

---

## Migration Checklist

### For Existing Components:

- [ ] Replace `slate-*` classes with `zinc-*`
- [ ] Replace `blue-500` primary with `amber-500`
- [ ] Change `border` to `border-2` on major containers (cards, modals)
- [ ] Replace custom status dots with `<StatusLED>` component
- [ ] Add `audioFeedback.click()` to major interactions
- [ ] Add `audioFeedback.hover()` to card hover states

### CSS Token Updates:

- [ ] Update all `--color-bg-*` variables to Zinc palette
- [ ] Update `--color-primary` to Amber
- [ ] Add new LED shadow tokens (`--shadow-led-*`)
- [ ] Ensure `--glass-border` uses `rgba(255,255,255, 0.08)`

### Component Patterns:

```tsx
// OLD Pattern
<div className="bg-slate-900 border border-blue-500 hover:scale-105">

// NEW Pattern
<div className="bg-zinc-900/50 border-2 border-amber-500/50 hover:scale-[1.02]">
```

---

## Design Philosophy

### Key Principles

1. **Metal, Not Glass**: Zinc feels like aluminum chassis. Slate feels like frosted glass.
2. **Signal, Not Brand**: Amber/Orange is used for functional indicators (LCD displays, tube warmth), not marketing.
3. **Weight Matters**: Heavier borders (`border-2`) simulate physical depth. Pro gear is heavy.
4. **Subtle Animation**: Hardware doesn't bounce. Use `scale-[1.02]` instead of `scale-105`.
5. **Functional Color**: Every color has meaning:
   - **Amber**: Primary action, signal presence
   - **Green**: Active, ready, optimal
   - **Red**: Error, overload, fault
   - **Blue**: Processing, data flow (rare)

---

## Before/After Comparison

### Visual "Temperature"

- **Before**: Cool (Blue undertones, slate grays)
- **After**: Warm (Amber accents, neutral zinc)

### Interactive Feel

- **Before**: Bouncy, Software-like (scale-105, smooth easing)
- **After**: Mechanical, Tactile (scale-102, audio clicks)

### Inspiration

- **Before**: Vercel, Linear, Modern SaaS dashboards
- **After**: SSL consoles, Moog synthesizers, API 500-series racks

---

## Performance Notes

### Audio System

- **Memory**: ~5KB for audio class
- **CPU**: Negligible (Web Audio API is hardware-accelerated)
- **Latency**: <10ms from click to sound

### Color Changes

- **No Performance Impact**: CSS color changes don't affect render performance
- **Bundle Size**: Identical (just token values changed)

---

## Future Enhancements

### Potential Additions:

- [ ] Noise texture overlay for "powder-coated metal" effect
- [ ] Subtle scanline animation for VU meter aesthetic
- [ ] Haptic feedback via Vibration API (mobile)
- [ ] Peak meter component (vertical LED array)
- [ ] Rotary knob component with detent feedback

---

## Questions & Answers

### Q: Why not use actual audio files?

**A**: Synthesized sounds are:

- Smaller (no file loading)
- More consistent across devices
- Parameterizable (volume, pitch can be adjusted)

### Q: Can users disable sounds?

**A**: Yes, via `audioFeedback.setEnabled(false)`. Also auto-disabled for users with `prefers-reduced-motion`.

### Q: Does this work on mobile?

**A**: Yes, but iOS requires user interaction before playing audio. First click enables the audio context.

### Q: What about screen readers?

**A**: Audio feedback is supplementary. All components still use proper ARIA labels and semantic HTML.

---

## Credits

**Inspired by**:

- SSL (Solid State Logic) console interfaces
- Moog modular synthesizer panels
- API 500-series rack modules
- Universal Audio Apollo interfaces
- Avid (Digidesign) Pro Tools HD hardware

**Color Psychology**:

- Warm amber/orange = Analog tube saturation
- Neutral zinc = Aluminum rack chassis
- Emerald green = Optimal signal level
- Sharp red = Peak/overload warning
