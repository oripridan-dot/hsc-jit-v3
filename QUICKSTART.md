# ⚡ Quick Start Guide - Progressive Discovery

## 🚀 Get Running in 60 Seconds

### Step 1: Install Dependencies
```bash
cd /workspaces/hsc-jit-v3/frontend
npm install
```

### Step 2: Start Development Servers
```bash
# Terminal 1: Start frontend
cd frontend
npm run dev

# Terminal 2: Start backend  
cd backend
uvicorn app.main:app --reload
```

### Step 3: Test It Out
1. Open http://localhost:5173
2. Type "r" in search → See 500+ tiny cards
3. Type "ro" → Cards grow
4. Type "rol" → Cards become clickable
5. Tap any card → Full product view
6. Pinch/tap image → Zoom interaction
7. Click back → Return to search

---

## 📁 Key Files to Know

```
frontend/src/
├── components/
│   ├── GhostCardGrid.tsx ← Progressive cards evolving
│   ├── ImageGallery.tsx ← Zoomable image viewer
│   └── ProductDetailViewNew.tsx ← Product info panel
├── services/
│   └── AIImageEnhancer.ts ← Image processing engine
├── App.tsx ← Main search orchestration
└── index.css ← Animation styles
```

---

## 🎯 What Each Component Does

### GhostCardGrid
**Shows**: Cards that grow as search results narrow
**Input**: Array of products, current query
**Output**: User taps card → triggers detail view
```tsx
<GhostCardGrid products={results} query="search" onCardSelect={handleTap} />
```

### ImageGallery  
**Shows**: Product image with zoom/pan controls
**Features**: Pinch zoom, tap zoom, drag pan, thumbnails
```tsx
<ImageGallery images={productImages} enhanced={true} />
```

### ProductDetailViewNew
**Shows**: Full product information with image gallery
**Layout**: Left (images) + Right (specs/info)
```tsx
<ProductDetailViewNew product={selected} onClose={handleBack} />
```

### AIImageEnhancer
**Does**: Enhances images in background (denoise, sharpen, color-correct)
**Usage**: Auto-runs when ProductDetailView opens
```typescript
const enhanced = await enhancer.enhanceImage(url, 'high');
```

---

## 🎨 Visual Flow

```
                    Empty State
                         ↓
                    User Types "r"
                         ↓
        ┌─ 500 Ghost Cards (tiny dots) ◄─ SNIFFING
        │  Display: "512 products"
        │         ↓
        │   Type "ro" (200)
        │         ↓
        │   Type "rol" (50)
        │         ↓
        │   Type "roland" (5)
        │  Display: "5 products"
        │         ↓
        │   Cards become large & visible
        │         ↓
        └─ User taps card
                  ↓
    ProductDetailViewNew ◄─ LOCKED
    ├─ Left: Image Gallery
    │  ├─ Pinch to zoom
    │  ├─ Tap to zoom 2x
    │  └─ Thumbnails
    │
    └─ Right: Info Panel
       ├─ Stock status
       ├─ AI confidence
       ├─ Specs
       ├─ Description
       └─ Accessories
                  ↓
             Back button
                  ↓
             Return to Search (IDLE)
```

---

## 🔧 Customization Examples

### Change Card Sizes
Edit `GhostCardGrid.tsx`:
```typescript
ghost_3: {
  size: 'w-32 h-44',    // ← Adjust these
  opacity: 0.5,
}
```

### Adjust Image Enhancement
Edit `AIImageEnhancer.ts`:
```typescript
applySharpen(ctx, width, height, 0.3) // ← 0.3 = strength
//                                        (0.1 subtle, 0.5 strong)
```

### Change Layout Proportions
Edit `ProductDetailViewNew.tsx`:
```tsx
{/* Left: Image Gallery */}
<div className="w-full md:w-[45%]"> {/* ← Adjust % */}
```

### Update Colors
Edit any component:
```tsx
<div className="bg-blue-500/20"> {/* ← Change blue-500 */}
```

---

## ✅ Testing Checklist

- [ ] Can search and see ghost cards
- [ ] Cards grow as I type more
- [ ] Cards become clickable at medium size
- [ ] Tapping card opens product detail
- [ ] Image shows and can zoom
- [ ] Can drag image when zoomed
- [ ] Can pinch to zoom on mobile
- [ ] Back button returns to search
- [ ] Can search again with fresh results
- [ ] Image quality looks enhanced
- [ ] All text is readable
- [ ] No console errors

---

## 📊 Architecture Overview

```
User Input (Search)
       ↓
App.tsx (State Management)
       ↓
WebSocket → Backend Predictions
       ↓
GhostCardGrid (Renders Cards)
       ↓
User Taps Card
       ↓
ProductDetailViewNew
├─ ImageGallery (with AIImageEnhancer)
└─ Info Panel
```

---

## 🎬 Common Tasks

### To view a specific product
1. Type its name in search
2. Cards will narrow down
3. Tap the card
4. Detail view opens

### To zoom an image
**Desktop**: Click image (2x zoom), click again to reset
**Mobile**: Pinch with 2 fingers, or tap to zoom

### To reset search
1. Click back button
2. Clear search box
3. Type new search

### To enhance images
- Automatic when product view opens
- Enhancement runs in background
- Original displays while enhancing
- Graceful fallback if enhancement fails

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Cards not showing | Check network tab for predictions |
| Cards not animating | Verify Framer Motion loaded |
| Image zoom not working | Check browser DevTools console |
| Enhancement taking long | Check if many images queued |
| Layout broken on mobile | Check responsive classes in Tailwind |

---

## 📈 Performance Tips

- ✅ Load one card and test
- ✅ Monitor Chrome DevTools → Performance tab
- ✅ Check memory usage (should stay <500MB)
- ✅ Test on slower network (DevTools throttle)

---

## 🔗 Important Links

**Documentation**:
- Full Guide: `docs/PROGRESSIVE_DISCOVERY_GUIDE.md`
- API Reference: `docs/PROGRESSIVE_DISCOVERY_API.md`
- Implementation Summary: `PROGRESSIVE_DISCOVERY_COMPLETE.md`

**Code**:
- Main App: `frontend/src/App.tsx`
- Ghost Cards: `frontend/src/components/GhostCardGrid.tsx`
- Image Gallery: `frontend/src/components/ImageGallery.tsx`
- Product View: `frontend/src/components/ProductDetailViewNew.tsx`
- Enhancer: `frontend/src/services/AIImageEnhancer.ts`

---

## 💡 Key Concepts

**Ghost Cards**: Cards that evolve from invisible (small results) to dominant (exact match)

**Progressive Search**: As user types more, cards physically grow in size

**AI Confidence**: Match score (0-1) determines card size and visibility

**Image Enhancement**: Canvas-based filters (denoise, sharpen, color-correct)

**Responsive Layout**: Images left, info right on desktop; stacked on mobile

---

## 🎉 You're All Set!

Everything is ready to go. Just run `npm install` and `npm run dev` to see it in action!

Questions? Check the detailed documentation files in `/docs/` folder.

