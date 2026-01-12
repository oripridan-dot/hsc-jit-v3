# 🎨 Visual Architecture & Component Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HSC JIT v3 Frontend                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      App.tsx (Main)                      │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ State Management (useWebSocketStore)             │   │   │
│  │  │ ├─ status: IDLE → SNIFFING → LOCKED → ANSWERING │   │   │
│  │  │ ├─ predictions: Product[]                        │   │   │
│  │  │ ├─ actions: sendTyping, lockAndQuery, reset      │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                        ↓                                 │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Conditional Rendering                            │   │   │
│  │  ├─ showSearch → GhostCardGrid (SNIFFING)          │   │   │
│  │  ├─ showDetail → ProductDetailViewNew (LOCKED)     │   │   │
│  │  └─ isChatMode → ChatView (ANSWERING)              │   │   │
│  │                                                     │   │   │
│  └─────────────────────────────────────────────────────┘   │   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         │                          │                       │
         ↓                          ↓                       ↓
    ┌─────────────┐    ┌────────────────────┐    ┌──────────────────┐
    │GhostCardGrid│    │ProductDetailViewNew│    │    ChatView      │
    └─────────────┘    └────────────────────┘    └──────────────────┘
         ├─ Cards          ├─ ImageGallery       └─ Messages
         ├─ Animation      ├─ Info Panel         └─ LLM Integration
         └─ Layout         └─ Dock
```

---

## Data Flow Diagram

```
User Interaction
       │
       ├─ Types "search"
       │      ↓
       │  App.sendTyping("search")
       │      ↓
       │  WebSocket → Backend
       │      ↓
       │  Backend: Fuzzy Match Products
       │      ↓
       │  Returns: predictions[]
       │      ↓
       │  Store Updates: predictions, status=SNIFFING
       │      ↓
       │  GhostCardGrid Re-renders
       │      ↓
       ├─ Cards Animate to New State
       │  ghost_5 → ghost_4 → ghost_3 → ghost_2 → ghost_1
       │
       └─ Taps Card
              ↓
          onCardSelect(product)
              ↓
          App.lockAndQuery(product, query)
              ↓
          status = LOCKED
              ↓
          ProductDetailViewNew Mounts
              ↓
          ImageGallery Renders
              ↓
          AIImageEnhancer.enhanceImage()
              ↓
          Canvas Filters Applied
              ↓
          Enhanced Images Displayed
              ↓
          Click Back
              ↓
          actions.reset()
              ↓
          Return to Search
```

---

## Component Hierarchy

```
App
├── Header
│   └── Search Input + Image Upload
│
├── Main (Conditional)
│   │
│   ├─ IDLE State
│   │  └─ Welcome Message
│   │
│   ├─ SNIFFING State
│   │  └─ GhostCardGrid
│   │     ├─ GhostCard (x500)
│   │     │  ├─ Image
│   │     │  ├─ Brand
│   │     │  ├─ Name
│   │     │  ├─ Price
│   │     │  └─ Confidence Score
│   │     │
│   │     └─ Live Count Display
│   │
│   ├─ LOCKED State
│   │  └─ ProductDetailViewNew
│   │     ├─ Back Button
│   │     ├─ Header
│   │     │  ├─ Logo
│   │     │  ├─ Product Info
│   │     │  └─ Price + Score
│   │     │
│   │     ├─ Main Content
│   │     │  ├─ Left Panel (45-50%)
│   │     │  │  └─ ImageGallery
│   │     │  │     ├─ Main Image (Zoomable)
│   │     │  │     └─ Thumbnails (Scrollable)
│   │     │  │
│   │     │  └─ Right Panel (50-55%)
│   │     │     ├─ Stock Status
│   │     │     ├─ AI Confidence Bar
│   │     │     ├─ Core Specs Grid
│   │     │     ├─ Description (Expandable)
│   │     │     └─ Accessories Carousel
│   │     │
│   │     └─ Dock
│   │        ├─ Manual Link
│   │        └─ Brand Website
│   │
│   └─ ANSWERING State
│      └─ ChatView
│         ├─ Messages
│         └─ Input
│
└── Global State (useWebSocketStore)
    ├─ Socket Connection
    ├─ Predictions
    ├─ Status
    └─ Actions
```

---

## Ghost Card Evolution Sequence

```
TYPE: "r" (500+ matches)
     │
     ├─ Predictions: 500
     ├─ Match Scores: 0.1-0.3
     ├─ Card State: ghost_5
     │  Size: 60×80px
     │  Opacity: 15%
     │  Blur: 8px
     └─ Visual: •••••• (tiny dots)

TYPE: "ro" (200 matches)
     │
     ├─ Predictions: 200
     ├─ Match Scores: 0.3-0.5
     ├─ Card State: ghost_4
     │  Size: 100×140px
     │  Opacity: 30%
     │  Blur: 6px
     └─ Visual: ░░░░░░ (ghosted)

TYPE: "rol" (50 matches)
     │
     ├─ Predictions: 50
     ├─ Match Scores: 0.5-0.7
     ├─ Card State: ghost_3 ◄─ CLICKABLE
     │  Size: 160×220px
     │  Opacity: 50%
     │  Blur: 4px
     └─ Visual: ▒▒▒▒▒▒ (visible, clickable)

TYPE: "rola" (20 matches)
     │
     ├─ Predictions: 20
     ├─ Match Scores: 0.7-0.9
     ├─ Card State: ghost_2
     │  Size: 240×320px
     │  Opacity: 75%
     │  Blur: 2px
     └─ Visual: ▓▓▓▓▓▓ (clear)

TYPE: "roland" (5 matches)
     │
     ├─ Predictions: 5
     ├─ Match Scores: 0.9-1.0
     ├─ Card State: ghost_1
     │  Size: 320×440px
     │  Opacity: 95%
     │  Blur: none
     └─ Visual: ██████ (dominant)

TAP CARD
     │
     └─ Expands to Full Screen
        (100vw × 100vh)
```

---

## Image Enhancement Pipeline

```
Original Image URL
       │
       ↓
AIImageEnhancer.enhanceImage(url, priority)
       │
       ├─ Check Cache (Memory Map)
       │  ├─ Hit → Return cached URL ✓
       │  └─ Miss → Continue
       │
       ├─ Fetch Image from URL
       │  └─ Convert to Blob
       │
       ├─ Queue Based on Priority
       │  ├─ high → Process first
       │  ├─ normal → Process second
       │  └─ low → Process last
       │
       ├─ Create Canvas from Blob
       │
       ├─ Apply Filters Sequentially:
       │  │
       │  ├─ 1. DENOISE
       │  │   └─ 2-pass bilateral filter
       │  │      └─ Removes compression artifacts
       │  │
       │  ├─ 2. SHARPEN
       │  │   └─ Unsharp mask (strength: 0.3)
       │  │      └─ Enhances edges
       │  │
       │  ├─ 3. COLOR CORRECT
       │  │   └─ Auto-levels histogram
       │  │      └─ Balances brightness
       │  │
       │  └─ 4. CONTRAST BOOST
       │      └─ CSS filter: contrast(1.1) brightness(1.02)
       │         └─ Final enhancement
       │
       ├─ Export as JPEG
       │  └─ Quality: 0.95
       │
       ├─ Create Blob URL
       │
       ├─ Cache in Memory
       │  └─ Map<url, enhancedUrl>
       │
       └─ Return Enhanced URL
              │
              ↓
          Display in Gallery
          (If original still showing, fade to enhanced)
```

---

## State Machine

```
┌─────────────────────────────────────────────┐
│                                             │
│         IDLE (Initial State)                │
│   ┌─ No search, no results                  │
│   └─ Show: Welcome message                  │
│                                             │
│              ↓ (Type in search)             │
│                                             │
│    ┌────────────────────────────────────┐   │
│    │  SNIFFING (Active Search)          │   │
│    │  ┌─ Predictions arriving           │   │
│    │  ├─ Cards evolving in size         │   │
│    │  └─ Show: GhostCardGrid            │   │
│    │                                    │   │
│    │  ├─ Action: sendTyping()           │   │
│    │  └─ Callback: onCardSelect()       │   │
│    └────────────────────────────────────┘   │
│              ↓ (Tap card)                   │
│                                             │
│    ┌────────────────────────────────────┐   │
│    │  LOCKED (Product Selected)         │   │
│    │  ┌─ Card tapped                    │   │
│    │  ├─ Images loading/enhancing       │   │
│    │  └─ Show: ProductDetailViewNew     │   │
│    │                                    │   │
│    │  ├─ Action: lockAndQuery()         │   │
│    │  └─ Can transition to: ANSWERING   │   │
│    └────────────────────────────────────┘   │
│              ↓ (Ask question)               │
│                                             │
│    ┌────────────────────────────────────┐   │
│    │  ANSWERING (LLM Response)          │   │
│    │  ┌─ Streaming answer               │   │
│    │  └─ Show: ChatView                 │   │
│    │                                    │   │
│    │  └─ Stay in ANSWERING until done   │   │
│    └────────────────────────────────────┘   │
│              ↓ (Click back in product view) │
│                                             │
│         Return to IDLE                      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Responsive Layout

```
┌──────────────────────────────────────────┐
│         DESKTOP (1200px+)                │
│ ┌────────────────┬──────────────────────┐│
│ │  Images (45%)  │  Info Panel (55%)   ││
│ │                │  ├─ Stock           ││
│ │  + Thumbnails  │  ├─ Confidence      ││
│ │                │  ├─ Specs           ││
│ │                │  ├─ Description     ││
│ │                │  └─ Accessories     ││
│ └────────────────┴──────────────────────┘│
└──────────────────────────────────────────┘

┌──────────────────────────┐
│  TABLET (768-1200px)    │
│ ┌──────────────────────┐ │
│ │   Images (50%)      │ │
│ ├──────────────────────┤ │
│ │  Info Panel (50%)    │ │
│ │  ├─ Stock            │ │
│ │  ├─ Confidence       │ │
│ │  └─ Specs            │ │
│ └──────────────────────┘ │
└──────────────────────────┘

┌──────────────────┐
│ MOBILE (<768px) │
│ ┌──────────────┐ │
│ │   Images     │ │
│ ├──────────────┤ │
│ │ Thumbnails   │ │
│ ├──────────────┤ │
│ │ Info Panel   │ │
│ │ (Scrollable) │ │
│ │              │ │
│ │ (all full w) │ │
│ └──────────────┘ │
└──────────────────┘
```

---

## Interaction Patterns

### Card Interaction
```
Mouse Over
   ↓ (scale-105, shadow increase)

Click/Tap
   ↓ (if ghost_3+)
   
onCardSelect(product)
   ↓
ProductDetailViewNew Opens
```

### Image Interaction
```
Single Tap / Click
   ├─ If zoom = 1 → zoom = 2x at tap point
   └─ If zoom > 1 → zoom = 1x (reset)

Pinch (2-finger)
   ├─ Zoom in (max 4x)
   └─ Smooth spring animation

Drag (when zoom > 1)
   └─ Pan with constraints
```

### Scroll Interaction
```
Info Panel Right Side
   ├─ Smooth scroll (custom scrollbar)
   └─ Hide scrollbar on hover (refined UX)

Thumbnail Strip
   ├─ Horizontal scroll
   ├─ Snap to item
   └─ Hide scrollbar
```

---

## CSS Class Hierarchy

```
index.css
├─ Tailwind Base
├─ Tailwind Components
├─ Tailwind Utilities
│
├─ Custom Animations
│  ├─ @keyframes fadeInUp
│  ├─ @keyframes scaleIn
│  ├─ @keyframes pulseGentle
│  └─ @keyframes shimmer
│
├─ Utility Classes
│  ├─ .animate-fade-in-up
│  ├─ .animate-scale-in
│  ├─ .animate-pulse-gentle
│  ├─ .animate-shimmer
│  ├─ .glass
│  ├─ .perspective-1000
│  ├─ .custom-scrollbar
│  └─ .hide-scrollbar
│
└─ Component Styles
   ├─ GhostCardGrid
   ├─ ImageGallery
   ├─ ProductDetailViewNew
   └─ Shared Components
```

---

## Performance Optimization Flow

```
User Types
   │
   ├─ Throttle Typing Events
   └─ Send to Backend
   
Predictions Return
   │
   ├─ Calculate Match Scores
   │  └─ Memoize to prevent re-calc
   │
   ├─ Sort by Score
   └─ Render Cards with Layout Animation
   
User Taps Card
   │
   ├─ Find Product in Results
   └─ Pass to ProductDetailViewNew
   
ProductDetailViewNew Mounts
   │
   ├─ Render Image Gallery
   │  └─ Show original image
   │
   └─ Start Enhancement in Background
      ├─ Priority high for main image
      ├─ Normal for secondary
      └─ Low for thumbnails
      
Enhancement Queue
   │
   ├─ Process High Priority First
   ├─ Use Canvas Filters
   ├─ Cache Results
   └─ Fade In Enhanced When Ready
```

---

**Diagrams Version**: 1.0  
**Last Updated**: January 12, 2026
