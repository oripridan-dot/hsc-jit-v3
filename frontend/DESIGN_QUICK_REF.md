# Design System Quick Reference

## Import Pattern

```tsx
import {
  // Layout
  BrandCard,
  BrandGrid,
  // Atoms
  Button,
  StatusLED,
  Heading,
  Body,
  MonoLabel,
  // Utils
  audioFeedback,
} from "@/design-system";
```

---

## Color Variables (Use These!)

```tsx
className = "bg-zinc-950"; // Base background
className = "bg-zinc-900"; // Elevated surfaces
className = "bg-zinc-800"; // Surface elements
className = "text-zinc-50"; // Primary text
className = "text-zinc-400"; // Secondary text
className = "text-amber-500"; // Primary accent
className = "border-zinc-800"; // Default borders
```

---

## Common Patterns

### Card with Audio

```tsx
<BrandCard
  name="Roland"
  status="active"
  category="Synthesizers"
  onClick={handleClick}
  // hover sound is automatic
/>
```

### Status Display

```tsx
<div className="flex items-center gap-2">
  <StatusLED color="green" size="sm" />
  <MonoLabel>READY</MonoLabel>
</div>
```

### Interactive Button

```tsx
<Button
  variant="solid"
  onClick={() => {
    audioFeedback.click();
    handleAction();
  }}
>
  Submit
</Button>
```

### Panel Container

```tsx
<div className="bg-zinc-900/50 backdrop-blur-md border-2 border-zinc-800/60 rounded-xl p-6">
  <MonoLabel className="text-amber-500 mb-2">SECTION</MonoLabel>
  <Body muted>Content here</Body>
</div>
```

---

## Audio Feedback

```tsx
audioFeedback.click(); // Button press (50ms)
audioFeedback.hover(); // Hover state (30ms)
audioFeedback.toggle(); // Switch (100ms)
audioFeedback.success(); // Confirm (120ms)
audioFeedback.error(); // Alert (100ms)

// Settings
audioFeedback.setVolume(0.3); // 0.0 - 1.0
audioFeedback.setEnabled(false); // Disable all sounds
```

---

## LED Colors

| Color   | Use Case         | Class                               |
| ------- | ---------------- | ----------------------------------- |
| `green` | Active, Ready    | `<StatusLED color="green" />`       |
| `amber` | Syncing, Warning | `<StatusLED color="amber" pulse />` |
| `red`   | Error, Fault     | `<StatusLED color="red" />`         |
| `blue`  | Processing       | `<StatusLED color="blue" />`        |
| `off`   | Inactive         | `<StatusLED color="off" />`         |

---

## Typography

```tsx
<Heading level="h1">Title</Heading>
<Heading level="h2" className="mb-4">Subtitle</Heading>

<Body size="base" muted>Regular text</Body>
<Body size="sm" mono>Technical data</Body>

<MonoLabel variant="badge">STATUS</MonoLabel>
```

---

## Don't Use (Old Palette)

❌ `slate-*` → ✅ Use `zinc-*`  
❌ `blue-500` → ✅ Use `amber-500`  
❌ `border` (1px) → ✅ Use `border-2` (2px)  
❌ `scale-105` → ✅ Use `scale-[1.02]`

---

## Checklist for New Components

- [ ] Use `zinc-*` for grays (not `slate-*`)
- [ ] Use `amber-500` for primary (not `blue-500`)
- [ ] Use `border-2` for major containers
- [ ] Add `audioFeedback.click()` to buttons
- [ ] Add `audioFeedback.hover()` to cards
- [ ] Use `<StatusLED>` instead of custom dots
- [ ] Test with `prefers-reduced-motion`

---

**Need more details?** See [DESIGN_SYSTEM_V2.md](./DESIGN_SYSTEM_V2.md)
