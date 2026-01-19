# HSC JIT v3.7 - Phase 3 Implementation Plan: Lazy Loading Strategy

**Status:** Phase 3 Planning Document  
**Version:** 3.7  
**Date:** January 19, 2026

---

## Executive Summary

As the application scales to support multiple brands (Roland, Yamaha, Korg, Moog, Nord, RCF, etc.), loading **all** catalogs on app initialization will cause performance degradation, especially on mobile networks. This document outlines the **Lazy Loading Strategy** to keep initial load times under 2 seconds.

---

## Current State (v3.7 - Single Brand)

```
App Load Flow:
├─ Load index.json (1.2 KB) ✅ Fast
├─ Load roland.json (606 KB) ✅ Acceptable for single brand
├─ Initialize state management ✅ <100ms
└─ Render UI ✅ Complete in ~500ms
```

**Current Performance Metrics:**

- Initial page load: ~800ms
- Search activation: <50ms
- Navigation: <5ms
- Master index load: ~20ms

---

## Problem: Multi-Brand Scalability

### Issue 1: Bundle Size Explosion

| Scenario   | Brands | Est. Total Size | Initial Load Time |
| ---------- | ------ | --------------- | ----------------- |
| Current    | 1      | 607.2 KB        | ~800ms            |
| 5 brands   | 5      | 3.0 MB          | ~2.5s             |
| 10 brands  | 10     | 6.0 MB          | ~5s ❌            |
| All brands | 15+    | 9+ MB           | >8s ❌            |

### Issue 2: Memory Pressure

- 10 fully-loaded brands = ~8-10MB of JavaScript objects
- Mobile devices with <512MB available RAM would struggle
- Search index (Fuse.js) grows linearly with product count

### Issue 3: Network Unreliability

- Single 5MB bundle = one failure point
- Mobile networks have 20-30% packet loss at edges
- Recovery requires full page reload

---

## Solution: Lazy Loading with Progressive Enhancement

### Architecture: "Hub & Spoke" Pattern

```
App Initialization
├─ Phase 1 (CRITICAL - <500ms)
│  ├─ Load master index.json (lists all brands) ✅ 1.2 KB
│  └─ Render brand selector UI
│
├─ Phase 2 (ON-DEMAND)
│  ├─ User clicks on "Roland"
│  ├─ Fetch roland.json (606 KB)
│  ├─ Validate with Zod ✅ (Phase 2 improvement)
│  ├─ Cache in memory + localStorage
│  └─ Render Navigator tree
│
└─ Phase 3 (BACKGROUND)
   ├─ Preload next 2 likely brands (ML-based)
   ├─ Prefetch without blocking UI
   └─ Cache as user navigates
```

### Implementation Details

#### 1. Master Index Only at Startup

**File:** `/frontend/public/data/index.json`

```json
{
  "version": "3.7",
  "build_timestamp": "2026-01-19T12:00:00Z",
  "total_products": 1200,
  "total_verified": 950,
  "brands": [
    {
      "id": "roland",
      "name": "Roland",
      "product_count": 29,
      "verified_count": 29,
      "logo_url": "https://cdn.example.com/roland-logo.png",
      "brand_color": "#ef4444",
      "data_file": "catalogs_brand/roland.json",
      "preview_url": "catalogs_brand/roland.thumbnail.json"
    },
    {
      "id": "yamaha",
      "name": "Yamaha",
      "product_count": 45,
      "verified_count": 42,
      "logo_url": "https://cdn.example.com/yamaha-logo.png",
      "brand_color": "#a855f7",
      "data_file": "catalogs_brand/yamaha.json",
      "preview_url": "catalogs_brand/yamaha.thumbnail.json"
    }
    // ... more brands
  ]
}
```

#### 2. Catalog Loader with Lazy Loading

**File:** `/frontend/src/lib/catalogLoader.ts`

Add these methods (pseudocode):

```typescript
class CatalogLoader {
  private loadQueue: Map<string, Promise<BrandCatalog>> = new Map();
  private preloadQueue: string[] = [];

  /**
   * Load brand with request deduplication
   * Prevents multiple simultaneous requests for same brand
   */
  async loadBrandLazy(brandId: string): Promise<BrandCatalog> {
    // Check cache first
    if (this.brandCatalogs.has(brandId)) {
      return this.brandCatalogs.get(brandId)!;
    }

    // Deduplicate in-flight requests
    if (this.loadQueue.has(brandId)) {
      return this.loadQueue.get(brandId)!;
    }

    // Start loading
    const promise = this._fetchAndValidateBrand(brandId);
    this.loadQueue.set(brandId, promise);

    try {
      const catalog = await promise;
      this.brandCatalogs.set(brandId, catalog);
      return catalog;
    } finally {
      this.loadQueue.delete(brandId);
    }
  }

  /**
   * Preload next-likely brands in background
   * Uses history + Recency/Frequency heuristics
   */
  preloadBrands(brandIds: string[]): void {
    for (const id of brandIds) {
      if (!this.brandCatalogs.has(id) && !this.loadQueue.has(id)) {
        // Fire & forget - don't await
        this.loadBrandLazy(id).catch((err) =>
          console.warn(`Preload failed for ${id}:`, err),
        );
      }
    }
  }

  /**
   * Get thumbnail preview (fast, small JSON)
   * Shows category/count without full products
   */
  async loadBrandThumbnail(brandId: string): Promise<BrandIndexEntry> {
    const index = await this.loadIndex();
    return index.brands.find((b) => b.id === brandId)!;
  }
}
```

#### 3. Lazy Loading UI Components

**File:** `/frontend/src/components/BrandSelector.tsx`

```tsx
export const BrandSelector: React.FC = () => {
  const [brands, setBrands] = useState<BrandIndexEntry[]>([]);
  const [loadingBrandId, setLoadingBrandId] = useState<string | null>(null);
  const { selectBrand } = useNavigationStore();

  useEffect(() => {
    // Load only index on mount
    catalogLoader.loadIndex().then((index) => {
      setBrands(index.brands);
    });
  }, []);

  const handleSelectBrand = async (brandId: string) => {
    setLoadingBrandId(brandId);
    try {
      // Lazy load the full catalog
      const catalog = await catalogLoader.loadBrandLazy(brandId);

      // Preload next likely brands (based on user history)
      const nextLikely = getNextLikelyBrands(brandId);
      catalogLoader.preloadBrands(nextLikely);

      selectBrand(catalog);
    } finally {
      setLoadingBrandId(null);
    }
  };

  return (
    <div className="brand-selector">
      {brands.map((brand) => (
        <button
          key={brand.id}
          onClick={() => handleSelectBrand(brand.id)}
          disabled={loadingBrandId === brand.id}
        >
          {brand.name}
          {loadingBrandId === brand.id && <Spinner />}
        </button>
      ))}
    </div>
  );
};
```

#### 4. Caching Strategy

**File:** `/frontend/src/lib/cacheManager.ts`

```typescript
export class CacheManager {
  static readonly STORAGE_KEY = "hsc-brand-cache";
  static readonly MAX_BRANDS_IN_CACHE = 3; // Keep 3 brands in localStorage
  static readonly MAX_CACHE_SIZE = 2_000_000; // 2MB max

  /**
   * Save brand to localStorage (with compression)
   */
  static async cacheBrand(
    brandId: string,
    catalog: BrandCatalog,
  ): Promise<void> {
    try {
      const cache = this.getCache();

      // Check size before adding
      const newSize = JSON.stringify(catalog).length;
      if (this.getCacheSize(cache) + newSize > this.MAX_CACHE_SIZE) {
        // Remove least recently accessed brand
        this.evictOldest(cache);
      }

      cache[brandId] = {
        data: catalog,
        timestamp: Date.now(),
        size: newSize,
      };

      // Keep only 3 brands
      while (Object.keys(cache).length > this.MAX_BRANDS_IN_CACHE) {
        this.evictOldest(cache);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.warn("Cache save failed:", err);
    }
  }

  /**
   * Load brand from localStorage
   */
  static getCachedBrand(brandId: string): BrandCatalog | null {
    try {
      const cache = this.getCache();
      const entry = cache[brandId];

      if (!entry) return null;

      // Update access time for eviction algorithm
      entry.timestamp = Date.now();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));

      return entry.data;
    } catch (err) {
      console.warn("Cache read failed:", err);
      return null;
    }
  }

  private static getCache(): Record<
    string,
    { data: BrandCatalog; timestamp: number; size: number }
  > {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  private static evictOldest(cache: any): void {
    let oldest = Object.entries(cache)[0];
    for (const [id, entry] of Object.entries(cache)) {
      if ((entry as any).timestamp < (oldest[1] as any).timestamp) {
        oldest = [id, entry];
      }
    }
    delete cache[oldest[0]];
  }

  private static getCacheSize(cache: any): number {
    return Object.values(cache).reduce(
      (sum: number, entry: any) => sum + entry.size,
      0,
    );
  }
}
```

---

## Implementation Roadmap

### Week 1: Architecture & Testing

- [ ] Create `BrandSelector` component with skeleton loading
- [ ] Implement lazy loading in `catalogLoader`
- [ ] Write integration tests for preload scenarios
- [ ] Test on mobile networks (throttle to 3G)

### Week 2: Caching & Offline

- [ ] Implement localStorage caching with eviction
- [ ] Add IndexedDB for larger catalogs (>10MB)
- [ ] Test offline browsing of cached brands
- [ ] Document cache invalidation strategy

### Week 3: Analytics & Optimization

- [ ] Track "Time to Interactive" metrics
- [ ] Measure cache hit rate
- [ ] Implement ML-based preload suggestions
- [ ] A/B test preload vs. on-demand loading

### Week 4: Production Deployment

- [ ] Deploy with feature flag for lazy loading
- [ ] Monitor performance in production
- [ ] Gradually increase brands (5 → 10 → 15)
- [ ] Gather user feedback

---

## Performance Targets (Post-Lazy-Loading)

| Metric                       | Current | Target | Status |
| ---------------------------- | ------- | ------ | ------ |
| Initial page load            | 800ms   | <500ms | 🔄     |
| Brand selection → display    | 500ms   | <1s    | 🔄     |
| Search <50ms on 10k products | ✅      | ✅     | ✅     |
| Cache hit ratio              | N/A     | >80%   | 🔄     |
| Mobile 3G load time          | N/A     | <2s    | 🔄     |

---

## Risk Mitigation

### Risk 1: Network Failure During Brand Load

**Solution:** Graceful degradation

- Show skeleton UI while loading
- Display cached version if available
- Show error boundary with retry button

### Risk 2: User Navigates Away During Preload

**Solution:** Request cancellation

- Use AbortController to cancel in-flight requests
- Resume when user selects brand again

### Risk 3: stale Cache Data

**Solution:** Versioning + TTL

- Include build timestamp in index.json
- Invalidate cache if version mismatch
- Auto-refresh if data >7 days old

---

## Success Criteria

✅ **Phase 3 Complete When:**

1. Initial page load <500ms (all networks)
2. Brand switch <1s (from cache or network)
3. 80%+ cache hit rate in analytics
4. Zero regressions in existing tests
5. E2E tests pass on mobile simulation (iPhone 12)

---

## Related Files to Modify

1. **Frontend**
   - `src/lib/catalogLoader.ts` - Add lazy loading methods
   - `src/lib/cacheManager.ts` - NEW - Implement caching
   - `src/components/BrandSelector.tsx` - NEW - Brand selection UI
   - `src/App.tsx` - Replace auto-load with BrandSelector
   - `tests/integration/lazyLoading.test.ts` - NEW - Test lazy loading

2. **Backend**
   - `backend/orchestrate_brand.py` - Add thumbnail generation
   - `backend/app/main.py` - Serve thumbnail previews

3. **Data**
   - `frontend/public/data/index.json` - Already has `preview_url` field

---

## Next Steps

1. **Implement BrandSelector component** with loading states
2. **Update catalogLoader** with deduplication & preload
3. **Create cacheManager** for localStorage persistence
4. **Write integration tests** for lazy loading scenarios
5. **Deploy with feature flag** for gradual rollout
6. **Monitor metrics** and adjust preload strategy

---

**Owner:** Architecture Team  
**Reviews:** @oripridan-dot, Tech Lead  
**Target Completion:** February 2026
