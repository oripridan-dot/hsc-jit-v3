# 🔧 Progressive Discovery Component API Reference

## GhostCardGrid Component

### Import
```typescript
import { GhostCardGrid } from './components/GhostCardGrid';
```

### Props
```typescript
interface GhostCardGridProps {
  products: Product[];              // Array of products to display
  query: string;                    // Current search query
  onCardSelect: (product: Product) => void;  // Callback on card tap
  isLoading?: boolean;              // Show loading state
}

interface Product {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  price?: number;
  matchScore: number;  // 0 to 1, determines card size
}
```

### Usage Example
```tsx
<GhostCardGrid
  products={filteredProducts}
  query="roland"
  onCardSelect={(product) => {
    // Handle card selection
    selectProduct(product);
  }}
  isLoading={isSearching}
/>
```

### Card State Mapping
```typescript
matchScore → State → Size → Opacity → Clickable
0.0-0.3  → ghost_5 → 60×80    → 15%  → ❌
0.3-0.5  → ghost_4 → 100×140  → 30%  → ❌
0.5-0.7  → ghost_3 → 160×220  → 50%  → ✅
0.7-0.9  → ghost_2 → 240×320  → 75%  → ✅
0.9-1.0  → ghost_1 → 320×440  → 95%  → ✅
```

---

## ImageGallery Component

### Import
```typescript
import { ImageGallery } from './components/ImageGallery';
```

### Props
```typescript
interface ImageGalleryProps {
  images: string[];           // Array of image URLs
  mainImage?: string;         // Initial main image
  onImageSelect?: (url: string) => void;  // Callback on thumbnail tap
  enhanced?: boolean;         // Show enhancement badge
}
```

### Usage Example
```tsx
<ImageGallery
  images={product.images}
  mainImage={product.images[0]}
  onImageSelect={(url) => console.log('Selected:', url)}
  enhanced={true}
/>
```

### Interactions
```typescript
// Single Tap
- If zoom === 1 → zoom to 2x at tap point
- If zoom > 1 → reset to 1x

// Pinch Gesture
- Multitouch zoom with min=1x, max=4x
- Smooth animation between zoom levels

// Drag
- Only works when zoomed (zoom > 1)
- Constrained panning within bounds

// Thumbnail Selection
- Tap thumbnail → switch main image
- Reset zoom to 1x
- Call onImageSelect callback
```

---

## ProductDetailViewNew Component

### Import
```typescript
import { ProductDetailViewNew } from './components/ProductDetailViewNew';
```

### Props
```typescript
interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    image: string;
    images?: string[];
    price: number;
    description: string;
    brand: string;
    brand_identity?: {
      logo_url: string;
      hq: string;
      name: string;
      website?: string;
    };
    production_country?: string;
    category?: string;
    family?: string;
    manual_url?: string;
    score: number;           // 0 to 1 (AI confidence)
    specs: Record<string, string | number>;
    accessories?: Array<{ name: string; match?: number }>;
    related?: Array<{ name: string }>;
    full_description?: string;
  };
  onClose?: () => void;
}
```

### Usage Example
```tsx
<ProductDetailViewNew
  product={selectedProduct}
  onClose={() => {
    setSelectedProduct(null);
    resetSearch();
  }}
/>
```

### Layout Structure
```
┌─ Header ────────────────────────────────────┐
│ Back | Logo | Name | Category | Price Score │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  ImageGallery    │  • Availability          │
│                  │  • AI Confidence (bar)   │
│  Thumbnails      │  • Core Specs (grid)     │
│                  │  • Description (collaps) │
│                  │  • Accessories (horiz)   │
│                  │                          │
└──────────────────┴──────────────────────────┘
                   ↓
        [Dock with Links]
```

### Features
- Image enhancement in background (auto-starts)
- Expandable description section
- Horizontal accessories carousel
- Stock status with live indicator
- AI confidence progress bar
- Back button for navigation

---

## AIImageEnhancer Service

### Import
```typescript
import { AIImageEnhancer } from '../services/AIImageEnhancer';
```

### Usage Pattern
```typescript
const enhancer = AIImageEnhancer.getInstance();

// Enhance single image
const enhancedUrl = await enhancer.enhanceImage(imageUrl, 'high');

// Or with promise-based approach
enhancer.enhanceImage(imageUrl, 'normal')
  .then(enhanced => {
    setEnhancedImage(enhanced);
  })
  .catch(error => {
    console.warn('Enhancement failed, using original');
  });
```

### API Methods

#### `enhanceImage(url, priority)`
```typescript
/**
 * Enhance an image with AI-based processing
 * @param imageUrl - URL of image to enhance
 * @param priority - 'high' | 'normal' | 'low'
 * @returns Promise<string> - URL of enhanced image
 * 
 * Features:
 * - Async queue processing
 * - Memory-safe caching
 * - Graceful fallback to original
 */
```

**Priority Levels**:
- `high`: Processed first (main product images)
- `normal`: Standard queue (secondary images)
- `low`: Last priority (thumbnails, distant images)

#### `clearCache()`
```typescript
/**
 * Clear image cache to free memory
 * Useful for cleanup or when switching products
 */
enhancer.clearCache();
```

#### `generatePlaceholder(blob)`
```typescript
/**
 * Generate blur placeholder while enhancing
 * Returns data URL of original image
 */
const placeholder = enhancer.generatePlaceholder(blob);
```

### Enhancement Pipeline
```
Original Image
     ↓
[Denoise] → 2-pass bilateral filter
     ↓
[Sharpen] → Unsharp mask (strength: 0.3)
     ↓
[Color Correct] → Auto-levels histogram
     ↓
[Contrast Boost] → CSS filter: contrast(1.1) brightness(1.02)
     ↓
[Export] → JPEG at 0.95 quality
     ↓
Enhanced Image
```

### Performance Characteristics
```
Single Image:     ~200-500ms
Queue of 10:      ~2-5s (parallel processing ready)
Memory per image: ~2-5MB temporary (freed after export)
Cache size:       Unlimited (manual cleanup available)
```

---

## App.tsx Integration

### Search States
```typescript
type AppStatus = 'IDLE' | 'SNIFFING' | 'LOCKED' | 'ANSWERING';

// IDLE
// ├─ No search input
// ├─ Show: Welcome prompt + suggestions
// └─ Components: Header + empty message

// SNIFFING
// ├─ User typing, predictions arriving
// ├─ Show: GhostCardGrid with cards evolving
// └─ Components: GhostCardGrid + live count

// LOCKED
// ├─ Card selected, product detail loading
// ├─ Show: ProductDetailViewNew with image gallery
// └─ Components: Full product view

// ANSWERING
// ├─ Awaiting AI response
// ├─ Show: ChatView with streaming answers
// └─ Components: ChatView + messages
```

### Flow Logic
```typescript
const isChatMode = status === 'LOCKED' || status === 'ANSWERING';
const showDetail = !isChatMode && status === 'LOCKED' && zenResults.length > 0;
const showSearch = !isChatMode && !showDetail && (inputText.length > 0 || predictions.length > 0);
```

### Triggering Product Detail
```typescript
// 1. User taps ghost card
onCardSelect={(selectedProduct) => {
  const fullProduct = zenResults.find(p => p.id === selectedProduct.id);
  if (fullProduct) {
    // 2. Send query to backend
    actions.lockAndQuery(
      fullProduct,
      inputText.trim() || fullProduct.name,
      imageData
    );
    // 3. App transitions to LOCKED state
    // 4. ProductDetailViewNew renders automatically
  }
}}

// 5. User clicks back button
onClose={() => {
  setInputText('');           // Clear input
  actions.reset();            // Reset to IDLE
  // Return to search
}}
```

---

## WebSocket Store Updates

### New Reset Action
```typescript
actions.reset()
// Clears:
// - status → 'IDLE'
// - predictions → []
// - lastPrediction → null
// - messages → []
// - relatedItems → []
// - attachedImage → null
```

### Product Object Schema
```typescript
interface Prediction {
  id: string;
  name: string;
  images?: { main: string };
  img?: string;
  brand?: string;
  production_country?: string;
  brand_identity?: BrandIdentity;
  price?: number;
  score?: number;
  specs?: Record<string, string | number>;
  accessories?: any[];
  related?: any[];
  full_description?: string;
}
```

---

## CSS Utilities & Classes

### New Animations
```css
.animate-fade-in-up    /* Fade in + slide up */
.animate-scale-in      /* Scale from 0.95 to 1 */
.animate-pulse-gentle  /* Subtle pulsing */
.animate-shimmer       /* Shimmer effect */
```

### New Components
```css
.glass                 /* Glassmorphism background */
.perspective-1000      /* 3D perspective */
.custom-scrollbar      /* Styled scrollbars */
.hide-scrollbar        /* Hide scrollbar */
```

### Usage
```tsx
<div className="animate-fade-in-up">Fades in and slides up</div>
<div className="glass p-4 rounded-lg">Glassmorphic panel</div>
<div className="perspective-1000">3D transformed content</div>
```

---

## Type Safety

### Full TypeScript Support
All components are fully typed with:
- ✅ Strict prop typing
- ✅ Return type annotations
- ✅ Generic type parameters where applicable
- ✅ No `any` type usage (except where necessary)

### Type Imports
```typescript
import type { GhostCardGridProps } from './components/GhostCardGrid';
import type { ProductDetailProps } from './components/ProductDetailViewNew';
```

---

## Performance Tips

### For Large Product Lists (100+)
```typescript
// Use memoization
const memoizedProducts = useMemo(
  () => products.map(p => ({ ...p, matchScore: calculateScore(p) })),
  [products]
);

<GhostCardGrid products={memoizedProducts} />
```

### For Image Enhancement
```typescript
// Use priority levels strategically
enhancer.enhanceImage(mainImage, 'high');
enhancer.enhanceImage(thumbs[0], 'normal');
enhancer.enhanceImage(thumbs[1], 'low');

// Clean up when done
return () => enhancer.clearCache();
```

### For Smooth Animations
```typescript
// Use layout animations for reflows
<motion.div layout>
  {cards.map(card => (
    <motion.div
      key={card.id}
      layout
      animate={{ opacity: config.opacity }}
    />
  ))}
</motion.div>
```

---

## Error Handling

### Image Enhancement Failures
```typescript
try {
  const enhanced = await enhancer.enhanceImage(url, priority);
  setEnhancedImage(enhanced);
} catch (error) {
  console.warn('Enhancement failed:', error);
  // Fallback to original image
  setEnhancedImage(url);
}
```

### Product Selection
```typescript
const fullProduct = zenResults.find(p => p.id === selectedId);
if (!fullProduct) {
  console.error('Product not found');
  return; // Don't proceed
}
// Safe to use fullProduct now
```

---

## Browser Support

### Required Features
- ✅ CSS Grid & Flexbox
- ✅ CSS Transforms
- ✅ Canvas API
- ✅ Touch Events (for mobile)
- ✅ Promise/async-await
- ✅ Fetch API
- ✅ WebSocket

### Tested Browsers
- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+

---

## Debugging

### React DevTools
```javascript
// In browser console
// Find component tree for GhostCardGrid
// Watch matchScore changes
// Monitor animation states
```

### Chrome DevTools
```javascript
// Performance: Record during card evolution
// Memory: Monitor image cache size
// Network: Check image fetch timing
// Animations: Inspect Framer Motion smoothness
```

### Console Logging
```typescript
console.log('Cards:', cardsWithStates);
console.log('Current state:', status);
console.log('Match score:', product.matchScore);
console.log('Cache size:', enhancer.imageCache.size);
```

---

**API Version**: 1.0  
**Last Updated**: January 12, 2026
