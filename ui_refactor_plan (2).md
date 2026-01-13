# HSC JIT v3 - UI/UX Refactoring Execution Plan
## Complete GitHub Copilot-Friendly Implementation Guide

**Goal:** Transform scattered UI into a polished, information-first support center  
**Timeline:** 3 weeks (60 hours total)  
**Approach:** Incremental refactoring with continuous deployment

---

## 🎯 Executive Summary

### What We're Fixing
1. **Search Flow:** Ghost cards → Standard filterable grid
2. **Product Detail:** Split view → Single column with sticky images
3. **AI Chat:** Hidden → Always-visible bottom sheet
4. **Images:** Complex zoom → Simple lightbox
5. **Navigation:** Unclear → Brand-first empty state

### Success Metrics
- [ ] Search to product in <3 clicks
- [ ] AI response visible in <5 seconds
- [ ] Mobile usable without pinch/zoom
- [ ] Zero 404 image errors
- [ ] Lighthouse score >90

---

## 📅 Week 1: Foundation Rebuild (20 hours)

### Day 1-2: Product Grid Refactor (6 hours)

#### Task 1.1: Create ProductCard Component
**File:** `frontend/src/components/ProductCard.tsx`

```tsx
// NEW FILE - Replace ghost card concept with standard card

import { motion } from 'framer-motion';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  query: string;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, query, onClick }: ProductCardProps) {
  // Highlight matching text in product name
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-blue-500/30 text-blue-200">{part}</mark>
        : part
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group cursor-pointer"
      onClick={() => onClick(product)}
    >
      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-all">
        {/* Image */}
        <div className="aspect-square bg-slate-900 flex items-center justify-center p-4">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="text-slate-600 text-4xl">📦</div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Brand badge */}
          <div className="text-xs text-slate-400 uppercase tracking-wider">
            {product.brand}
          </div>

          {/* Product name with highlighting */}
          <h3 className="text-base font-semibold text-slate-100 line-clamp-2">
            {highlightText(product.name, query)}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {product.category && (
              <span className="flex items-center gap-1">
                🏷️ {product.category}
              </span>
            )}
            {product.price && (
              <span className="flex items-center gap-1">
                💰 ${product.price}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {product.stock !== undefined && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                product.stock > 0 ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-slate-400">
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

#### Task 1.2: Create ProductGrid Component
**File:** `frontend/src/components/ProductGrid.tsx`

```tsx
// NEW FILE - Manages grid layout and filtering

import { AnimatePresence } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  query: string;
  onProductSelect: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductGrid({ 
  products, 
  query, 
  onProductSelect,
  isLoading = false 
}: ProductGridProps) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-lg h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">
          No products found
        </h3>
        <p className="text-slate-400">
          Try adjusting your search or browse by brand
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="text-sm text-slate-400">
        {products.length} product{products.length !== 1 ? 's' : ''} found
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              query={query}
              onClick={onProductSelect}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

#### Task 1.3: Update App.tsx Search Logic
**File:** `frontend/src/App.tsx`

```tsx
// MODIFY EXISTING FILE - Simplify search logic

// Remove: GhostCardGrid, progressive discovery logic
// Add: Simple fuzzy filtering

const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
const [searchQuery, setSearchQuery] = useState('');

// Debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    // Client-side fuzzy match (or use WebSocket predictions)
    const filtered = allProducts.filter(product => {
      const searchLower = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    }).slice(0, 50); // Limit to 50 results

    setFilteredProducts(filtered);
  }, 150); // Debounce 150ms

  return () => clearTimeout(timer);
}, [searchQuery, allProducts]);

// Render
<main>
  <SearchBar 
    value={searchQuery}
    onChange={setSearchQuery}
    placeholder="Search 333 products..."
  />
  
  {searchQuery ? (
    <ProductGrid
      products={filteredProducts}
      query={searchQuery}
      onProductSelect={handleProductSelect}
    />
  ) : (
    <EmptyState /> {/* Brand chips, recent products */}
  )}
</main>
```

---

### Day 3-4: Product Detail Refactor (8 hours)

#### Task 2.1: Create Single-Column Layout
**File:** `frontend/src/components/ProductDetail.tsx`

```tsx
// REPLACE ProductDetailViewNew.tsx - New single-column approach

import { useState } from 'react';
import { Product } from '../types';
import { ImageCarousel } from './ImageCarousel';
import { AIChat } from './AIChat';
import { SpecificationsPanel } from './SpecificationsPanel';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetail({ product, onClose }: ProductDetailProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'specs'>('chat');

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
      {/* Header - sticky */}
      <header className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200"
          >
            <span className="text-xl">←</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Stock badge */}
            {product.stock !== undefined && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                product.stock > 0 
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Image Carousel - Sticky on scroll */}
        <div className="sticky top-20 z-0">
          <ImageCarousel images={product.images} />
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">
              {product.brand}
            </p>
            <h1 className="text-3xl font-bold text-slate-100">
              {product.name}
            </h1>
          </div>

          {/* Quick Facts */}
          <div className="flex flex-wrap gap-4 text-sm">
            {product.price && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Price:</span>
                <span className="text-slate-100 font-semibold">${product.price}</span>
              </div>
            )}
            {product.category && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Category:</span>
                <span className="text-slate-100">{product.category}</span>
              </div>
            )}
            {product.manual?.status && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Manual:</span>
                <span className={`${
                  product.manual.status === 'available' 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}>
                  {product.manual.status === 'available' ? '✓ Available' : '⚠ Loading'}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-slate-300 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              💬 Ask AI
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'specs'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              📋 Specifications
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'chat' ? (
            <AIChat product={product} />
          ) : (
            <SpecificationsPanel product={product} />
          )}
        </div>

      </div>
    </div>
  );
}
```

#### Task 2.2: Simplified Image Carousel
**File:** `frontend/src/components/ImageCarousel.tsx`

```tsx
// REPLACE existing ImageGallery - Simpler version

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <>
      {/* Carousel */}
      <div className="space-y-4">
        {/* Main image */}
        <div 
          className="aspect-video bg-slate-800 rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={currentImage}
            alt={`Product ${currentIndex + 1}`}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-blue-500'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white text-4xl hover:text-slate-300"
              onClick={() => setIsLightboxOpen(false)}
            >
              ×
            </button>
            <img
              src={currentImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

#### Task 2.3: AI Chat Component (Bottom Sheet Style)
**File:** `frontend/src/components/AIChat.tsx`

```tsx
// NEW FILE - Always-visible chat interface

import { useState, useRef, useEffect } from 'react';
import { Product } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  markers?: {
    suggestions?: string[];
    proTips?: string[];
    manualRefs?: string[];
  };
}

interface AIChatProps {
  product: Product;
}

export function AIChat({ product }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // TODO: Connect to WebSocket for streaming response
    // For now, placeholder:
    setTimeout(() => {
      const aiMessage: Message = {
        role: 'assistant',
        content: 'AI response will stream here...',
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsStreaming(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-800/50 rounded-lg">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="mb-4">👋 Ask me anything about this product!</p>
            <div className="text-sm space-y-2">
              <p>Try asking:</p>
              <ul className="space-y-1 text-slate-500">
                <li>"What are the key specifications?"</li>
                <li>"How do I connect this to my setup?"</li>
                <li>"What accessories are compatible?"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                {msg.content}
                
                {/* Render markers if present */}
                {msg.markers?.suggestions && (
                  <div className="mt-2 pt-2 border-t border-slate-600">
                    <p className="text-xs text-slate-400 mb-1">💡 Suggestions:</p>
                    <ul className="text-sm space-y-1">
                      {msg.markers.suggestions.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about specs, setup, compatibility..."
            className="flex-1 bg-slate-900 text-slate-100 rounded-lg px-4 py-3 border border-slate-700 focus:border-blue-500 focus:outline-none"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

### Day 5: Empty State & Navigation (6 hours)

#### Task 3.1: Brand Chip Navigation
**File:** `frontend/src/components/EmptyState.tsx`

```tsx
// NEW FILE - Home screen with brand exploration

import { Brand, Product } from '../types';

interface EmptyStateProps {
  brands: Brand[];
  recentProducts?: Product[];
  onBrandSelect: (brand: Brand) => void;
  onProductSelect: (product: Product) => void;
}

export function EmptyState({ 
  brands, 
  recentProducts, 
  onBrandSelect,
  onProductSelect 
}: EmptyStateProps) {
  
  // Show top 12 brands by product count
  const popularBrands = brands
    .sort((a, b) => (b.products?.length || 0) - (a.products?.length || 0))
    .slice(0, 12);

  return (
    <div className="space-y-12 py-8">
      
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-100">
          Halilit Support Center
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Search 333 products from 90 brands. Get instant AI-powered support.
        </p>
      </div>

      {/* Popular Brands */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-200 mb-4">
          Popular Brands
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularBrands.map(brand => (
            <button
              key={brand.id}
              onClick={() => onBrandSelect(brand)}
              className="group bg-slate-800 hover:bg-slate-700 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition-all"
            >
              {/* Brand Logo */}
              <div className="aspect-square mb-3 flex items-center justify-center">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <span className="text-4xl">🏷️</span>
                )}
              </div>

              {/* Brand Name */}
              <h3 className="font-semibold text-slate-100 text-center mb-1">
                {brand.name}
              </h3>

              {/* Product Count */}
              <p className="text-xs text-slate-400 text-center">
                {brand.products?.length || 0} products
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Products (if available) */}
      {recentProducts && recentProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-slate-200 mb-4">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentProducts.map(product => (
              <button
                key={product.id}
                onClick={() => onProductSelect(product)}
                className="bg-slate-800 hover:bg-slate-700 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-all"
              >
                <div className="aspect-square bg-slate-900 p-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs text-slate-400 mb-1">{product.brand}</p>
                  <p className="text-sm text-slate-200 line-clamp-2">{product.name}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="flex justify-center gap-8 text-center">
        <div>
          <p className="text-3xl font-bold text-blue-400">{brands.length}</p>
          <p className="text-sm text-slate-400">Brands</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-blue-400">333</p>
          <p className="text-sm text-slate-400">Products</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-blue-400">24/7</p>
          <p className="text-sm text-slate-400">AI Support</p>
        </div>
      </div>

    </div>
  );
}
```

#### Task 3.2: Update App.tsx Navigation
**File:** `frontend/src/App.tsx`

```tsx
// MODIFY - Add brand filtering and empty state

const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
const [recentProducts, setRecentProducts] = useState<Product[]>([]);

const handleBrandSelect = (brand: Brand) => {
  setSelectedBrand(brand);
  setSearchQuery(brand.name); // Pre-fill search
};

const handleProductSelect = (product: Product) => {
  // Save to recent
  setRecentProducts(prev => {
    const filtered = prev.filter(p => p.id !== product.id);
    return [product, ...filtered].slice(0, 6);
  });
  
  // Open product detail
  setSelectedProduct(product);
};

// Render
{!searchQuery && !selectedProduct ? (
  <EmptyState
    brands={allBrands}
    recentProducts={recentProducts}
    onBrandSelect={handleBrandSelect}
    onProductSelect={handleProductSelect}
  />
) : searchQuery ? (
  <ProductGrid
    products={filteredProducts}
    query={searchQuery}
    onProductSelect={handleProductSelect}
  />
) : null}

{selectedProduct && (
  <ProductDetail
    product={selectedProduct}
    onClose={() => setSelectedProduct(null)}
  />
)}
```

---

## 📅 Week 2: Polish & Refinement (20 hours)

### Day 6-7: Visual Design System (8 hours)

#### Task 4.1: Design Tokens
**File:** `frontend/src/styles/tokens.css`

```css
/* NEW FILE - Single source of truth for design system */

:root {
  /* Colors - Semantic naming */
  --color-primary: rgb(59 130 246);       /* Blue-500 */
  --color-primary-hover: rgb(37 99 235);  /* Blue-600 */
  --color-primary-light: rgba(59 130 246 / 0.1);
  
  --color-success: rgb(34 197 94);        /* Green-500 */
  --color-warning: rgb(234 179 8);        /* Yellow-500 */
  --color-error: rgb(239 68 68);          /* Red-500 */
  
  --color-bg-base: rgb(15 23 42);         /* Slate-900 */
  --color-bg-elevated: rgb(30 41 59);     /* Slate-800 */
  --color-bg-overlay: rgb(51 65 85);      /* Slate-700 */
  
  --color-text-primary: rgb(241 245 249);    /* Slate-100 */
  --color-text-secondary: rgb(148 163 184);  /* Slate-400 */
  --color-text-tertiary: rgb(71 85 105);     /* Slate-600 */
  
  --color-border: rgb(51 65 85);          /* Slate-700 */
  --color-border-hover: rgb(71 85 105);   /* Slate-600 */
  --color-border-focus: var(--color-primary);
  
  /* Spacing - 4px base unit */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  
  /* Borders */
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-full: 9999px;
  
  /* Transitions */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Utility Classes */
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary { color: var(--color-text-tertiary); }

.bg-base { background-color: var(--color-bg-base); }
.bg-elevated { background-color: var(--color-bg-elevated); }
.bg-overlay { background-color: var(--color-bg-overlay); }

.border-default { border-color: var(--color-border); }

.transition-default {
  transition: all var(--duration-base) var(--easing-default);
}
```

#### Task 4.2: Typography Component System
**File:** `frontend/src/components/Typography.tsx`

```tsx
// NEW FILE - Consistent text rendering

import { ReactNode } from 'react';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';
type TextVariant = 'body' | 'caption' | 'overline';

interface HeadingProps {
  level: HeadingLevel;
  children: ReactNode;
  className?: string;
}

export function Heading({ level, children, className = '' }: HeadingProps) {
  const baseStyles = 'font-bold text-primary';
  
  const sizeStyles = {
    h1: 'text-4xl leading-tight',
    h2: 'text-3xl leading-tight',
    h3: 'text-2xl leading-tight',
    h4: 'text-xl leading-normal',
  };

  const Component = level;
  
  return (
    <Component className={`${baseStyles} ${sizeStyles[level]} ${className}`}>
      {children}
    </Component>
  );
}

interface TextProps {
  variant?: TextVariant;
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export function Text({ 
  variant = 'body', 
  children, 
  className = '',
  as: Component = 'p' 
}: TextProps) {
  const variantStyles = {
    body: 'text-base text-primary leading-relaxed',
    caption: 'text-sm text-secondary leading-normal',
    overline: 'text-xs text-tertiary uppercase tracking-wider',
  };

  return (
    <Component className={`${variantStyles[variant]} ${className}`}>
      {children}
    </Component>
  );
}

// Badge Component
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error';
  children: ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const variants = {
    default: 'bg-overlay text-secondary',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
```

#### Task 4.3: Button Component System
**File:** `frontend/src/components/Button.tsx`

```tsx
// NEW FILE - Consistent button styles

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({ 
  variant = 'primary',
  size = 'md',
  children,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-default focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-base';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white disabled:bg-overlay disabled:text-tertiary',
    secondary: 'bg-elevated hover:bg-overlay text-primary border border-default disabled:text-tertiary',
    ghost: 'hover:bg-elevated text-secondary hover:text-primary disabled:text-tertiary',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span>{leftIcon}</span>}
      {children}
      {rightIcon && <span>{rightIcon}</span>}
    </button>
  );
}
```

#### Task 4.4: Input Component System
**File:** `frontend/src/components/Input.tsx`

```tsx
// NEW FILE - Consistent form inputs

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-secondary">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary">
              {leftIcon}
            </span>
          )}
          
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 bg-elevated text-primary rounded-lg
              border border-default
              focus:border-focus focus:outline-none focus:ring-2 focus:ring-primary/20
              disabled:bg-overlay disabled:text-tertiary disabled:cursor-not-allowed
              transition-default
              ${leftIcon ? 'pl-10' : ''}
              ${error ? 'border-error' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

---

### Day 8-9: Component Polish (8 hours)

#### Task 5.1: SearchBar Component
**File:** `frontend/src/components/SearchBar.tsx`

```tsx
// NEW FILE - Dedicated search component

import { useState, useRef, useEffect } from 'react';
import { Input } from './Input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search products...',
  autoFocus = false 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: CMD+K or CTRL+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className={`relative transition-default ${
        isFocused ? 'scale-105' : ''
      }`}>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          leftIcon="🔍"
          autoFocus={autoFocus}
          className="text-lg pr-24"
        />
        
        {/* Clear button */}
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-default"
          >
            ✕
          </button>
        )}
        
        {/* Keyboard hint */}
        <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-tertiary bg-overlay rounded border border-default">
          ⌘K
        </kbd>
      </div>

      {/* Search hint */}
      {!value && !isFocused && (
        <p className="text-center text-sm text-tertiary mt-2">
          Press <kbd className="px-1.5 py-0.5 bg-overlay rounded text-xs">⌘K</kbd> to search
        </p>
      )}
    </div>
  );
}
```

#### Task 5.2: LoadingStates Component
**File:** `frontend/src/components/LoadingStates.tsx`

```tsx
// NEW FILE - Consistent loading patterns

export function SkeletonCard() {
  return (
    <div className="bg-elevated rounded-lg overflow-hidden border border-default">
      <div className="aspect-square bg-overlay animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-overlay rounded animate-pulse w-1/3" />
        <div className="h-4 bg-overlay rounded animate-pulse" />
        <div className="h-3 bg-overlay rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-video bg-overlay rounded-lg" />
      
      {/* Text skeletons */}
      <div className="space-y-4">
        <div className="h-3 bg-overlay rounded w-1/4" />
        <div className="h-8 bg-overlay rounded w-3/4" />
        <div className="h-4 bg-overlay rounded w-full" />
        <div className="h-4 bg-overlay rounded w-5/6" />
      </div>
    </div>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`${sizes[size]} border-overlay border-t-primary rounded-full animate-spin`} />
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-secondary">Loading...</p>
      </div>
    </div>
  );
}
```

#### Task 5.3: SpecificationsPanel Component
**File:** `frontend/src/components/SpecificationsPanel.tsx`

```tsx
// NEW FILE - Expandable specs view

import { useState } from 'react';
import { Product } from '../types';
import { Text } from './Typography';

interface SpecificationsPanelProps {
  product: Product;
}

export function SpecificationsPanel({ product }: SpecificationsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['general']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Group specs into sections
  const specs = product.specifications || {};
  const sections = {
    general: ['brand', 'category', 'model', 'sku'],
    physical: ['dimensions', 'weight', 'color', 'material'],
    technical: ['power', 'connectivity', 'interface', 'compatibility'],
    other: Object.keys(specs).filter(
      key => !['brand', 'category', 'model', 'sku', 'dimensions', 'weight', 'color', 'material', 'power', 'connectivity', 'interface', 'compatibility'].includes(key)
    ),
  };

  const renderSection = (title: string, keys: string[]) => {
    const sectionSpecs = keys
      .filter(key => specs[key])
      .map(key => ({ key, value: specs[key] }));

    if (sectionSpecs.length === 0) return null;

    const isExpanded = expandedSections.includes(title.toLowerCase());

    return (
      <div key={title} className="border-b border-default last:border-0">
        <button
          onClick={() => toggleSection(title.toLowerCase())}
          className="w-full flex items-center justify-between p-4 hover:bg-elevated transition-default"
        >
          <Text variant="overline">{title}</Text>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {sectionSpecs.map(({ key, value }) => (
              <div key={key} className="flex justify-between gap-4">
                <Text variant="caption" className="capitalize">
                  {key.replace(/_/g, ' ')}
                </Text>
                <Text variant="body" className="text-right font-medium">
                  {value}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-elevated rounded-lg overflow-hidden border border-default">
      {renderSection('General', sections.general)}
      {renderSection('Physical', sections.physical)}
      {renderSection('Technical', sections.technical)}
      {renderSection('Other', sections.other)}

      {Object.keys(specs).length === 0 && (
        <div className="p-8 text-center">
          <Text variant="caption">No specifications available</Text>
        </div>
      )}
    </div>
  );
}
```

#### Task 5.4: ErrorBoundary Component
**File:** `frontend/src/components/ErrorBoundary.tsx`

```tsx
// NEW FILE - Graceful error handling

import { Component, ReactNode } from 'react';
import { Button } from './Button';
import { Heading, Text } from './Typography';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-6">
            <div className="text-6xl">😵</div>
            
            <div className="space-y-2">
              <Heading level="h2">Something went wrong</Heading>
              <Text variant="caption">
                We encountered an unexpected error. Don't worry, your data is safe.
              </Text>
            </div>

            {this.state.error && (
              <details className="text-left bg-elevated p-4 rounded-lg border border-default">
                <summary className="cursor-pointer text-sm text-secondary mb-2">
                  Technical details
                </summary>
                <pre className="text-xs text-tertiary overflow-x-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button
                variant="secondary"
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Day 10: Responsive Design (4 hours)

#### Task 6.1: Mobile Optimization
**File:** `frontend/src/styles/responsive.css`

```css
/* NEW FILE - Mobile-first responsive utilities */

/* Mobile navigation */
@media (max-width: 768px) {
  /* Stack product detail vertically */
  .product-detail-layout {
    flex-direction: column;
  }

  /* Full-width search on mobile */
  .search-bar {
    max-width: 100%;
  }

  /* Adjust grid columns */
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Smaller text on mobile */
  .mobile-text-sm {
    font-size: 0.875rem;
  }

  /* Bottom sheet AI chat */
  .ai-chat-mobile {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 60vh;
    border-radius: 1rem 1rem 0 0;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Large desktop */
@media (min-width: 1280px) {
  .product-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Touch-friendly targets */
@media (hover: none) and (pointer: coarse) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## 📅 Week 3: Testing & Deployment (20 hours)

### Day 11-12: Integration & Testing (8 hours)

#### Task 7.1: Update Main App Integration
**File:** `frontend/src/App.tsx`

```tsx
// MAJOR REFACTOR - Clean integration of all new components

import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { EmptyState } from './components/EmptyState';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetail } from './components/ProductDetail';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingOverlay } from './components/LoadingStates';
import { Product, Brand } from './types';

export default function App() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: Fetch from backend
        const products = await fetchProducts();
        const brands = await fetchBrands();
        
        setAllProducts(products);
        setAllBrands(brands);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    const timer = setTimeout(() => {
      const filtered = allProducts.filter(product => {
        const searchLower = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower)
        );
      }).slice(0, 50);

      setFilteredProducts(filtered);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, allProducts]);

  // Handlers
  const handleProductSelect = (product: Product) => {
    // Add to recent
    setRecentProducts(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 6);
    });

    setSelectedProduct(product);
  };

  const handleBrandSelect = (brand: Brand) => {
    setSearchQuery(brand.name);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-base text-primary">
        
        {/* Header */}
        <header className="sticky top-0 bg-base/95 backdrop-blur border-b border-default z-40">
          <div className="container mx-auto px-4 py-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search 333 products from 90 brands..."
              autoFocus={false}
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {!searchQuery ? (
            <EmptyState
              brands={allBrands}
              recentProducts={recentProducts}
              onBrandSelect={handleBrandSelect}
              onProductSelect={handleProductSelect}
            />
          ) : (
            <ProductGrid
              products={filteredProducts}
              query={searchQuery}
              onProductSelect={handleProductSelect}
              isLoading={false}
            />
          )}
        </main>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onClose={handleCloseDetail}
          />
        )}

      </div>
    </ErrorBoundary>
  );
}

// Placeholder fetch functions
async function fetchProducts(): Promise<Product[]> {
  // TODO: Implement actual API call
  return [];
}

async function fetchBrands(): Promise<Brand[]> {
  // TODO: Implement actual API call
  return [];
}
```

#### Task 7.2: WebSocket Integration for AI Chat
**File:** `frontend/src/services/websocket.ts`

```typescript
// NEW FILE - WebSocket service for AI streaming

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  connect(url: string = 'ws://localhost:8000/ws') {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = this.messageHandlers.get(data.type);
        if (handler) {
          handler(data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.attemptReconnect(url);
    };
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(url);
      }, 1000 * this.reconnectAttempts);
    }
  }

  on(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    } else {
      console.error('WebSocket not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
```

#### Task 7.3: Update AIChat with WebSocket
**File:** `frontend/src/components/AIChat.tsx` (update existing)

```tsx
// ADD to existing AIChat component

import { useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';

// Inside AIChat component, add WebSocket connection
useEffect(() => {
  // Connect WebSocket
  wsService.connect();

  // Listen for AI responses
  wsService.on('ai_response_chunk', (data) => {
    if (data.product_id === product.id) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          // Append to existing message
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + data.chunk }
          ];
        } else {
          // New message
          return [...prev, { role: 'assistant', content: data.chunk }];
        }
      });
    }
  });

  wsService.on('ai_response_complete', (data) => {
    setIsStreaming(false);
  });

  return () => {
    wsService.disconnect();
  };
}, [product.id]);

// Update handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isStreaming) return;

  const userMessage: Message = { role: 'user', content: input };
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsStreaming(true);

  // Send via WebSocket
  wsService.send('query', {
    product_id: product.id,
    question: userMessage.content,
    scenario: 'general' // TODO: Get from context
  });
};
```

---

### Day 13-14: Performance Optimization (6 hours)

#### Task 8.1: Image Optimization
**File:** `frontend/src/utils/imageOptimization.ts`

```typescript
// NEW FILE - Image loading optimization

export function generateImageSrcSet(baseUrl: string, sizes: number[]): string {
  return sizes
    .map(size => `${baseUrl}?w=${size} ${size}w`)
    .join(', ');
}

export function getOptimalImageSize(containerWidth: number): number {
  // Round up to nearest standard size
  const standardSizes = [320, 640, 768, 1024, 1280, 1536];
  return standardSizes.find(size => size >= containerWidth) || 1536;
}

export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

export function lazyLoadImage(
  element: HTMLImageElement,
  src: string,
  placeholder: string = 'data:image/svg+xml,...'
) {
  // Use Intersection Observer for lazy loading
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        element.src = src;
        observer.unobserve(element);
      }
    });
  });

  element.src = placeholder;
  observer.observe(element);
}
```

#### Task 8.2: Virtual Scrolling for Large Lists
**File:** `frontend/src/components/VirtualProductGrid.tsx`

```tsx
// NEW FILE - Virtualized grid for performance

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

interface VirtualProductGridProps {
  products: Product[];
  query: string;
  onProductSelect: (product: Product) => void;
}

export function VirtualProductGrid({ 
  products, 
  query, 
  onProductSelect 
}: VirtualProductGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate columns based on screen width
  const columns = window.innerWidth < 768 ? 2 : 
                  window.innerWidth < 1024 ? 3 : 
                  window.innerWidth < 1280 ? 4 : 5;

  const rows = Math.ceil(products.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 350, // Estimated row height
    overscan: 2,
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowProducts = products.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid gap-4" style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`
              }}>
                {rowProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    query={query}
                    onClick={onProductSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### Task 8.3: Code Splitting & Lazy Loading
**File:** `frontend/src/App.tsx` (update imports)

```tsx
// REPLACE static imports with lazy loading

import { lazy, Suspense } from 'react';
import { LoadingOverlay } from './components/LoadingStates';

// Lazy load heavy components
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const EmptyState = lazy(() => import('./components/EmptyState'));
const ProductGrid = lazy(() => import('./components/ProductGrid'));

// Wrap in Suspense
{selectedProduct && (
  <Suspense fallback={<LoadingOverlay />}>
    <ProductDetail
      product={selectedProduct}
      onClose={handleCloseDetail}
    />
  </Suspense>
)}
```

---

### Day 15: Final Testing & Documentation (6 hours)

#### Task 9.1: E2E Test Suite
**File:** `frontend/tests/e2e/user-flows.spec.ts`

```typescript
// NEW FILE - Playwright E2E tests

import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test('should search and select product', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Search for product
    await page.fill('input[type="text"]', 'roland');
    
    // Wait for results
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Verify results shown
    const results = await page.locator('[data-testid="product-card"]').count();
    expect(results).toBeGreaterThan(0);
    
    // Click first result
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Verify detail view opened
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
  });
});

test.describe('AI Chat', () => {
  test('should send message and receive response', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Search and select product
    await page.fill('input[type="text"]', 'roland td-17');
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Click AI Chat tab
    await page.click('button:has-text("Ask AI")');
    
    // Type question
    await page.fill('[data-testid="chat-input"]', 'What are the specs?');
    await page.click('[data-testid="chat-submit"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="ai-message"]');
    
    // Verify response exists
    const response = await page.locator('[data-testid="ai-message"]').textContent();
    expect(response).toBeTruthy();
  });
});

test.describe('Brand Navigation', () => {
  test('should filter by brand from empty state', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Click brand chip
    await page.click('[data-testid="brand-chip"]:has-text("Roland")');
    
    // Verify search populated
    const searchValue = await page.inputValue('input[type="text"]');
    expect(searchValue).toBe('Roland');
    
    // Verify results shown
    await page.waitForSelector('[data-testid="product-card"]');
  });
});

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('should work on mobile', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Verify mobile layout
    const grid = page.locator('[data-testid="product-grid"]');
    await expect(grid).toHaveCSS('grid-template-columns', 'repeat(2, 1fr)');
  });
});
```

#### Task 9.2: Accessibility Audit
**File:** `frontend/tests/a11y/accessibility.spec.ts`

```typescript
// NEW FILE - Accessibility tests

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should not have accessibility violations on home', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Tab to search
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="text"]')).toBeFocused();
    
    // Type search
    await page.keyboard.type('roland');
    
    // Tab to first result
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Enter to select
    await page.keyboard.press('Enter');
    
    // Verify detail opened
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Search input
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toHaveAttribute('aria-label');
    
    // Buttons
    const buttons = page.locator('button');
    for (const button of await buttons.all()) {
      const hasLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      expect(hasLabel || hasText).toBeTruthy();
    }
  });
});
```

#### Task 9.3: Performance Benchmarks
**File:** `frontend/tests/performance/lighthouse.spec.ts`

```typescript
// NEW FILE - Performance tests

import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test('should meet Lighthouse performance thresholds', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  await playAudit({
    page,
    thresholds: {
      performance: 90,
      accessibility: 90,
      'best-practices': 90,
      seo: 90,
    },
    port: 9222,
  });
});

test('should load under 3 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000);
});
```

---

## 📋 Deployment Checklist

### Pre-Deployment (Complete all before pushing)

#### Code Quality
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings fixed
- [ ] All components have proper TypeScript types
- [ ] No console.log statements in production code
- [ ] All TODO comments addressed or documented

#### Testing
- [ ] All unit tests passing (`npm test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Accessibility tests passing (`npm run test:a11y`)
- [ ] Performance tests meeting thresholds (`npm run test:perf`)
- [ ] Manual testing on Chrome, Firefox, Safari
- [ ] Manual testing on iOS Safari, Android Chrome
- [ ] Manual testing with keyboard only
- [ ] Manual testing with screen reader

#### Performance
- [ ] Lighthouse score >90 on all metrics
- [ ] Images optimized (WebP format, proper sizes)
- [ ] Code splitting implemented
- [ ] Lazy loading implemented
- [ ] Virtual scrolling tested with 100+ products
- [ ] Bundle size <500KB gzipped
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s

#### UI/UX
- [ ] All interactions feel responsive (<100ms feedback)
- [ ] No layout shift during loading
- [ ] Smooth animations (60fps)
- [ ] Touch targets ≥44x44px on mobile
- [ ] Text readable at all viewport sizes
- [ ] Focus states visible on all interactive elements
- [ ] Error states handled gracefully
- [ ] Loading states consistent throughout

#### Documentation
- [ ] Component API documented
- [ ] Design system documented
- [ ] Deployment guide updated
- [ ] Changelog updated
- [ ] README updated with new features

---

## 🎯 Success Metrics

### Week 1 Goals
- [ ] Ghost cards removed, standard grid implemented
- [ ] Product detail is single column
- [ ] Image gallery simplified (click → lightbox)
- [ ] AI chat always visible
- [ ] Empty state with brand navigation

### Week 2 Goals
- [ ] Design tokens implemented
- [ ] Typography system consistent
- [ ] Button/Input components standardized
- [ ] Loading states unified
- [ ] Specifications panel working
- [ ] Mobile responsive at all breakpoints

### Week 3 Goals
- [ ] All tests passing
- [ ] Lighthouse score >90
- [ ] WebSocket AI streaming working
- [ ] Performance optimized (virtual scrolling)
- [ ] Documentation complete
- [ ] Ready for production deployment

---

## 🚀 Deployment Process

### Step 1: Build Production Bundle
```bash
cd frontend
npm run build
```

### Step 2: Test Production Build Locally
```bash
npm run preview
# Open http://localhost:4173
# Verify all features working
```

### Step 3: Deploy to Staging
```bash
# Backend
cd backend
docker build -t hsc-backend:v3.2-refactor .
kubectl set image deployment/backend backend=hsc-backend:v3.2-refactor -n staging

# Frontend
cd frontend
docker build -t hsc-frontend:v3.2-refactor .
kubectl set image deployment/frontend frontend=hsc-frontend:v3.2-refactor -n staging
```

### Step 4: Smoke Test Staging
```bash
# Run automated tests against staging
npm run test:e2e -- --base-url=https://staging.halilit.com

# Manual verification
# - Search works
# - Product detail loads
# - AI chat responds
# - Images display
# - Mobile works
```

### Step 5: Deploy to Production
```bash
# Tag release
git tag v3.2.0-ui-refactor
git push origin v3.2.0-ui-refactor

# Deploy
kubectl set image deployment/backend backend=hsc-backend:v3.2-refactor -n production
kubectl set image deployment/frontend frontend=hsc-frontend:v3.2-refactor -n production

# Monitor
kubectl rollout status deployment/backend -n production
kubectl rollout status deployment/frontend -n production
```

### Step 6: Post-Deployment Monitoring
```bash
# Watch error rates
kubectl logs -f deployment/backend -n production | grep ERROR

# Monitor performance
# Open Grafana dashboard
# Check for:
# - Response time <3s p95
# - Error rate <0.1%
# - Memory usage stable
```

---

## 🆘 Rollback Plan

If issues occur after deployment:

```bash
# Immediate rollback
kubectl rollout undo deployment/backend -n production
kubectl rollout undo deployment/frontend -n production

# Verify rollback
kubectl rollout status deployment/backend -n production

# Alternative: Roll back to specific version
kubectl set image deployment/frontend frontend=hsc-frontend:v3.1 -n production
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Watch

**Frontend Metrics:**
- Page load time (target: <3s)
- Time to Interactive (target: <3s)
- Bundle size (target: <500KB gzipped)
- Error rate (target: <0.1%)
- User engagement (time on site, searches per session)

**Backend Metrics:**
- API response time (target: <500ms p95)
- WebSocket connection stability (target: >99%)
- AI response time (target: <12s p95)
- Cache hit rate (target: >60%)
- Memory usage (target: <1.5GB per pod)

### Alert Conditions

**Critical (Page immediately):**
- Error rate >5% for 5 minutes
- API response time >2s p95 for 5 minutes
- Memory usage >90% for 5 minutes
- Zero successful health checks for 2 minutes

**Warning (Slack notification):**
- Error rate >1% for 10 minutes
- API response time >1s p95 for 10 minutes
- Memory usage >75% for 10 minutes
- Cache hit rate <40% for 15 minutes

---

## 🎓 Team Training

### For Frontend Developers

**Required Reading:**
1. Design system documentation (`docs/design-system.md`)
2. Component API reference (`docs/components.md`)
3. State management guide (`docs/state-management.md`)

**Hands-on Training:**
1. Create a new component using design tokens (30 min)
2. Add a new feature to EmptyState (1 hour)
3. Write tests for a component (30 min)

### For Backend Developers

**Integration Points:**
1. WebSocket message format
2. Product API response format
3. AI streaming protocol
4. Error handling conventions

### For QA Team

**Test Scenarios:**
1. Search → Select → Ask AI (happy path)
2. Search with no results (edge case)
3. Product with missing images (error handling)
4. AI response with manual unavailable (fallback)
5. Network disconnection recovery (resilience)

---

## 📝 Post-Launch Review

### Week 1 After Launch

**Metrics to Review:**
- User session duration (target: +20%)
- Search-to-product-view rate (target: >50%)
- AI question rate (target: >30% of product views)
- Error rate (target: <0.1%)
- Performance scores (target: >90 Lighthouse)

**User Feedback:**
- Conduct 5-10 user interviews
- Review support tickets for UI confusion
- Analyze funnel drop-off points
- Gather team feedback

**Action Items:**
- Document lessons learned
- Create backlog for improvements
- Update roadmap based on feedback
- Plan next iteration

---

## 🎉 Success Criteria

### The UI Refactor is Complete When:

1. ✅ All 68 files removed/consolidated (Week 1)
2. ✅ Design system implemented (Week 2)
3. ✅ All tests passing (Week 3)
4. ✅ Lighthouse score >90 (Week 3)
5. ✅ Deployed to production (Week 3)
6. ✅ User feedback positive (Post-launch)
7. ✅ Team trained on new architecture (Post-launch)
8. ✅ Documentation complete (Post-launch)

---

## 📞 Support Contacts

**Technical Issues:**
- Frontend Lead: [Name]
- Backend Lead: [Name]
- DevOps: [Name]

**Escalation Path:**
1. Check runbook for known issues
2. Check Slack #engineering channel
3. Page on-call engineer if critical
4. Escalate to CTO if unresolved >1 hour

---

**Timeline:** 3 weeks (60 hours total)  
**Owner:** Frontend Team  
**Status:** Ready for Execution  
**Last Updated:** January 13, 2026

---

This plan is designed to be executed incrementally with continuous deployment. Each task can be completed, tested, and deployed independently without blocking other work.

**GitHub Copilot Integration:** This plan uses clear file paths, explicit code blocks, and detailed TypeScript types that Copilot can understand and assist with. Each task is scoped to 2-4 hours for realistic estimation.
```