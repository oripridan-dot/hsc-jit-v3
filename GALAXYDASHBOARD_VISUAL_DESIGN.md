# 🎨 GalaxyDashboard v3.9.0 - Visual Design Overview

## Screen 1: Main Categories Grid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HALILIT - SUPPORT CENTER                              ONLINE | v3.8.2 |    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🏠 SELECT A CATEGORY                                              900 prod  │
│                                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────┐
│  │   KEYS & PIANOS          │  │  DRUMS & PERCUSSION      │  │ GUITARS &    │
│  │                          │  │                          │  │    AMPS      │
│  │  [Roland SYSTEM-8]       │  │  [Roland TD-07DMK]       │  │ [Boss Kat]   │
│  │                          │  │                          │  │              │
│  │  Synths, Stage Pianos... │  │  V-Drums, Acoustic...    │  │  Pedals,     │
│  │  6 types                 │  │  6 types                 │  │  Amps...     │
│  │                          │  │                          │  │  6 types     │
│  └──────────────────────────┘  └──────────────────────────┘  └──────────────┘
│
│  ┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────┐
│  │ STUDIO & RECORDING       │  │   LIVE SOUND             │  │  DJ &        │
│  │                          │  │                          │  │ PRODUCTION   │
│  │  [UA Apollo Twin]        │  │ [Roland V-Stage]         │  │ [Akai MPC]   │
│  │                          │  │                          │  │              │
│  │  Interfaces, Mics...     │  │  Speakers, Mixers...     │  │  Samplers... │
│  │  6 types                 │  │  5 types                 │  │  5 types     │
│  │                          │  │                          │  │              │
│  └──────────────────────────┘  └──────────────────────────┘  └──────────────┘
│
│  [Plus SOFTWARE & CLOUD and ACCESSORIES categories]
│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Click any category → Expands to Level 2**

---

## Screen 2: Subcategories Grid (Example: KEYS & PIANOS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Categories | KEYS & PIANOS                          900 products │
│                                                                              │
│ KEYS & PIANOS                                                               │
│ Synths, Stage Pianos, Controllers                                           │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  Synths          │  │ Stage Pianos     │  │  Controllers     │          │
│  │                  │  │                  │  │                  │          │
│  │  [Nord Drum 3P]  │  │ [Roland RD-2K]   │  │  [Akai APC64]    │          │
│  │                  │  │                  │  │                  │          │
│  │ Synthesizers ✓   │  │  Premium Piano   │  │   Pro Controller │          │
│  │                  │  │                  │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  Arrangers       │  │   Organs         │  │  Workstations    │          │
│  │                  │  │                  │  │                  │          │
│  │  [Roland JUNO]   │  │  [Roland JUNO]   │  │  [Roland JUNO]   │          │
│  │                  │  │                  │  │                  │          │
│  │  Arranger Kbd    │  │   Organ Sound    │  │   Workstation    │          │
│  │                  │  │                  │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Synths | Stage Pianos | Controllers | Arrangers | Organs | Workstations   │
│ [✓]    (Click to switch between subcategories)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Click any subcategory → Loads products for Spectrum Module**

---

## Visual Elements

### Category/Subcategory Card

```
┌─────────────────────────────────┐
│ ┌───────────────────────────────┤
│ │  [Background Image]           │
│ │  (Darkened to 40-60% opacity) │
│ │                               │
│ │  [Gradient Overlay]           │
│ │  (Black to transparent)       │
│ │                               │
│ │  KEYS & PIANOS                │
│ │  Synths, Stage Pianos, ...    │
│ │  6 types                      │
│ │                               │
│ │  [Hover: Border glows cyan]   │
│ └───────────────────────────────┘
└─────────────────────────────────┘
```

### Selected Subcategory

```
┌─────────────────────────────┐
│ ┌───────────────────────────┤
│ │  [Product Image]          │
│ │  ✓ (Cyan dot in corner)   │
│ │  ━━ (Cyan border)         │
│ │  ━━ (Glowing shadow)      │
│ │                           │
│ │  Synthesizers             │
│ │  (Label with shadow)      │
│ │                           │
│ │                           │
│ └───────────────────────────┘
└─────────────────────────────┘
```

### Bottom Control Bar

```
┌─────────────────────────────────────────────────────┐
│ Synths [✓ SELECTED]  | Stage Pianos | Controllers  │
│ (Cyan bg + glow)     (Gray bg)      (Gray bg)       │
│                                                      │
│ Arrangers | Organs | Workstations                   │
│ (Gray bg) (Gray bg) (Gray bg)                       │
│                                                      │
│ [Quick access to any subcategory in current cat]    │
└─────────────────────────────────────────────────────┘
```

---

## 🎬 Interaction Flow

### User Journey 1: Explore Categories

```
1. App loads
   → Shows 8 main categories (Keys, Drums, Guitars, Studio, Live, DJ, Software, Accessories)

2. User clicks "GUITARS & AMPS"
   → Screen transitions
   → Shows 6 guitar subcategories (Electric, Bass, Amps, Pedals, Effects, Accessories)

3. User clicks "AMPLIFIERS"
   → Amplifier thumbnail highlights with cyan border + dot
   → Bottom buttons show all guitar subcategories
   → Products start loading

4. User clicks "MULTI-EFFECTS" button
   → Selection switches to multi-effects
   → Different products load
   → Cyan highlight moves to multi-effects thumbnail

5. User clicks "← Back to Categories"
   → Returns to 8-category grid
```

### User Journey 2: Deep Dive

```
1. User clicks "STUDIO & RECORDING"
   → Shows 6 studio subcategories

2. User clicks "AUDIO INTERFACES" thumbnail
   → Highlights with cyan border + dot
   → Bottom shows: [Audio Interfaces ✓] [Monitors] [Microphones] [Outboard] [Preamps] [Software]
   → Audio interface products load (UA Apollo, RME, MOTU, etc.)

3. Ready for Spectrum Module
   → Next step: Click product to view details
```

---

## 🎨 Design Specifications

### Colors
- **Background**: #0e0e10 (Deep black)
- **Card Background**: Linear gradient from #27272a to #18181b
- **Selected Border**: #06b6d4 (Cyan)
- **Text**: #ffffff (White)
- **Secondary Text**: #a1a1aa (Light gray)

### Typography
- **Category Labels**: 3xl, font-black, uppercase
- **Subcategory Labels**: sm, font-semibold
- **Control Text**: xs, font-mono

### Sizes
- **Category Cards**: 1fr (responsive grid)
- **Subcategory Cards**: aspect-square
- **Thumbnails**: 400×400px (WebP)
- **Grid Gap**: 12px (3 units in Tailwind)

### Animations
- **Initial**: opacity 0, y +10px
- **Animate**: opacity 1, y 0px
- **Duration**: 400ms (transitions), 200ms (scale)
- **Stagger**: 50ms between items

---

## 🚀 State Indicators

| State | Visual | Meaning |
|-------|--------|---------|
| **Hover** | Image opacity ↑ | This category is interactive |
| **Selected Subcategory** | Cyan border + dot | This subcategory is active |
| **Selected Button** | Cyan bg + glow | Quick navigation available |
| **Loading** | Spinner text | Products are loading |
| **No Selection** | Gray cards | Browse mode |

---

## 📱 Responsive Breakpoints

| Viewport | Columns | Layout |
|----------|---------|--------|
| < 640px (Mobile) | 2 | Compact grid |
| 640-1024px (Tablet) | 3 | Medium grid |
| 1024-1536px (Desktop) | 3-4 | Large grid |
| > 1536px (Large) | 4 | Full width |

---

## ✨ Key Interactions

1. **Click Category** → Navigate to subcategories
2. **Click Subcategory** → Select and highlight
3. **Click Bottom Button** → Switch to different subcategory
4. **Back Button** → Return to main categories
5. **Breadcrumb** → Shows current location

---

**Design System**: Tailwind CSS + CSS Variables + Framer Motion  
**Status**: ✅ Production Ready  
**Version**: 3.9.0  
**Last Updated**: January 24, 2026
