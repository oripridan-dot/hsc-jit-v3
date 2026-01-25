# Developer Guide - HSC-JIT v3.9.1

## Architecture Overview

### "Static First" Design Philosophy

```
Data Sources → Scrapers → forge_backbone.py → Static JSON Files → Frontend
                                                       ↓
                                            catalogLoader loads
                                                       ↓
                                            React components render
```

**Key Principle**: All data is pre-built offline. Frontend has zero runtime API dependencies.

---

## Frontend Architecture

### Layer 1: Data Access (`frontend/src/lib/`)

| Module                    | Purpose                             | Key Methods                                                    |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| `catalogLoader.ts`        | Load products and catalogs          | `loadBrand()`, `loadProductsByCategory()`, `findProductById()` |
| `dataNormalizer.ts`       | Cross-brand schema consistency      | `normalizeProduct()`, `normalizeProducts()`                    |
| `priceFormatter.ts`       | Price extraction and formatting     | `getPrice()`, `getPriceValue()`, `formatPrice()`               |
| `imageResolver.ts`        | Image URL resolution with fallbacks | `resolveProductImage()`                                        |
| `instantSearch.ts`        | Full-text search (Fuse.js)          | `search()`                                                     |
| `categoryConsolidator.ts` | Brand → UI category mapping         | `consolidateCategory()`, `getConsolidatedCategory()`           |

### Layer 2: State Management (`frontend/src/store/`)

**Zustand** global state (not Redux/Context):

```typescript
import { useNavigationStore } from "./store/navigationStore";

const { selectProduct, currentPath, products } = useNavigationStore();
```

**Store includes**:

- Current product selection
- Navigation history
- UI state (modals, filters)
- Search results

### Layer 3: Components (`frontend/src/components/`)

| Component                 | Purpose                  | Data Source                            |
| ------------------------- | ------------------------ | -------------------------------------- |
| `App.tsx`                 | Entry point, routing     | navigationStore                        |
| `GalaxyDashboard.tsx`     | Category grid display    | catalogLoader (master index)           |
| `SpectrumModule.tsx`      | Product list by category | catalogLoader.loadProductsByCategory() |
| `ProductPopInterface.tsx` | Product detail modal     | catalogLoader.findProductById()        |
| `Navigator.tsx`           | Tree navigation sidebar  | navigationStore                        |

### Layer 4: Hooks (`frontend/src/hooks/`)

| Hook                   | Purpose                            |
| ---------------------- | ---------------------------------- |
| `useBrandCatalog.ts`   | Load brand data with caching       |
| `useBrandTheme.ts`     | Apply brand-specific CSS variables |
| `useRealtimeSearch.ts` | Real-time search with Fuse.js      |

---

## Data Flow Examples

### Example 1: Load Products by Category

```typescript
// User clicks "Keys & Pianos" category

// GalaxyDashboard.tsx
onClick={() => selectCategory('keys')}

// SpectrumModule.tsx receives 'keys'
useEffect(() => {
  const products = await catalogLoader.loadProductsByCategory('keys');
  // Loads from ALL brands, filters where category consolidates to 'keys'
  // Results: Roland Pianos + Nord Keyboards + Moog Synths matching category
}, [activeTribeId])

// Component displays products in grid
products.map(p => <ProductCard key={p.id} product={p} />)
```

**Data sources consulted**:

1. `frontend/public/data/index.json` (master index)
2. `frontend/public/data/roland.json` (Roland products)
3. `frontend/public/data/boss.json` (Boss products)
4. `frontend/public/data/nord.json` (Nord products)
5. - All other brand JSON files

### Example 2: Display Product Details

```typescript
// User clicks on a product card
onClick={() => selectProduct('ROLAND-DP990F')}

// ProductPopInterface.tsx
useEffect(() => {
  const product = await catalogLoader.findProductById('ROLAND-DP990F');
  // Searches across all brands
  const normalized = dataNormalizer.normalizeProduct(product);
  setProductData({
    name: normalized.name,
    category: normalizeCategory(normalized.category),
    price: getPrice(normalized),
    images: resolveProductImage(normalized),
    specs: normalized.specifications
  });
}, [productId])
```

### Example 3: Extract Price from Product

```typescript
// Different brands store prices differently
const product1 = { pricing: { regular_price: 1000 } }; // Roland
const product2 = { commercial: { price: 500 } }; // Boss
const product3 = { price: 750 }; // Nord

// priceFormatter handles all formats
import { getPrice, getPriceValue } from "./lib/priceFormatter";

getPrice(product1); // Returns: "₪1,000"
getPrice(product2); // Returns: "₪500"
getPrice(product3); // Returns: "₪750"

getPriceValue(product1); // Returns: 1000 (for sorting/comparison)
```

### Example 4: Resolve Image URLs

```typescript
// Products have images in different locations
const product = {
  image_url: null,
  image: null,
  media: {
    thumbnail: "https://...",
    gallery: ["https://...", "https://..."],
  },
};

import { resolveProductImage } from "./lib/imageResolver";

// Fallback chain:
// 1. product.image_url
// 2. product.image
// 3. product.media.thumbnail ← FOUND
// 4. product.media.gallery[0]
// 5. product.logo_url
// 6. SVG placeholder

const imageUrl = resolveProductImage(product);
// Returns: "https://..." (from media.thumbnail)
```

---

## Common Development Patterns

### Pattern 1: Add a New Search Filter

```typescript
// frontend/src/components/SearchFilter.tsx
import { useNavigationStore } from '../store/navigationStore';
import { instantSearch } from '../lib/instantSearch';

export function SearchFilter() {
  const { products } = useNavigationStore();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query) return products;
    return instantSearch.search(query, {
      keys: ['name', 'category', 'description', 'brand'],
      limit: 50
    });
  }, [query, products]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      {results.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

### Pattern 2: Add a New Component Using Data

```typescript
// frontend/src/components/BrandShowcase.tsx
import { catalogLoader } from '../lib/catalogLoader';

export function BrandShowcase({ brandName }: { brandName: string }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    (async () => {
      const catalog = await catalogLoader.loadBrand(brandName);
      setProducts(catalog.products || []);
    })();
  }, [brandName]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map(p => (
        <div key={p.id} className="border p-4">
          <h3>{p.name}</h3>
          <p className="text-sm text-gray-600">{p.category}</p>
          <p className="font-semibold">{getPrice(p)}</p>
          <img src={resolveProductImage(p)} alt={p.name} />
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Filter Products by Price Range

```typescript
// frontend/src/hooks/usePriceFilter.ts
import { useMemo } from "react";
import { getPriceValue } from "../lib/priceFormatter";

export function usePriceFilter(
  products: Product[],
  minPrice: number,
  maxPrice: number,
) {
  return useMemo(() => {
    return products.filter((p) => {
      const price = getPriceValue(p);
      return price >= minPrice && price <= maxPrice;
    });
  }, [products, minPrice, maxPrice]);
}

// Usage in component
const filtered = usePriceFilter(products, 500, 2000);
```

### Pattern 4: Apply Brand Theming

```typescript
// frontend/src/components/BrandedPanel.tsx
import { useBrandTheme } from '../hooks/useBrandTheme';

export function BrandedPanel({ brand, children }: Props) {
  const theme = useBrandTheme(brand);

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderColor: theme.accentColor,
      color: 'var(--text-primary)'
    }}>
      {children}
    </div>
  );
}
```

---

## Type Definitions

### Product Type

```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  pricing?: number | string | Record<string, any>;
  price?: number | string;
  image_url?: string;
  image?: string;
  media?: {
    thumbnail?: string;
    gallery?: string[];
  };
  specifications?: Record<string, string>;
  logo_url?: string;
  inStock?: boolean;
  sku?: string;
  [key: string]: any;
}

interface Catalog {
  brand: string;
  logo_url?: string;
  products: Product[];
  lastUpdated?: string;
}
```

### Category Types

```typescript
type UICategory =
  | "keys"
  | "drums"
  | "guitars"
  | "studio"
  | "live"
  | "dj"
  | "software"
  | "accessories";

interface ConsolidatedCategory {
  id: UICategory;
  label: string;
  icon: string;
  color: string;
}
```

---

## Building and Deployment

### Build for Production

```bash
cd frontend
pnpm install
pnpm build
```

**Output**: `frontend/dist/` (ready for static hosting)

**Size**:

- JavaScript: 948 KB
- Minified + gzipped: 270 KB
- Total assets: < 2 MB

### Deployment Options

1. **Vercel** (Recommended for static sites)

   ```bash
   vercel --prod
   ```

2. **GitHub Pages**
   - Push to `gh-pages` branch
   - Enable in repo settings

3. **AWS S3 + CloudFront**
   - Upload `dist/` to S3
   - Configure CloudFront for CDN

4. **Docker**
   ```dockerfile
   FROM node:20
   WORKDIR /app
   COPY frontend .
   RUN pnpm install && pnpm build
   FROM nginx:latest
   COPY --from=0 /app/dist /usr/share/nginx/html
   ```

---

## Testing

### Unit Tests

```typescript
// frontend/tests/lib/priceFormatter.test.ts
import { getPrice, getPriceValue } from "../../src/lib/priceFormatter";

describe("priceFormatter", () => {
  it("should extract price from Roland format", () => {
    const product = { pricing: { regular_price: 1000 } };
    expect(getPrice(product)).toBe("₪1,000");
    expect(getPriceValue(product)).toBe(1000);
  });

  it("should handle null prices gracefully", () => {
    const product = {};
    expect(getPrice(product)).toBe("N/A");
  });
});
```

### E2E Tests (with Playwright)

```typescript
// frontend/tests/e2e/navigation.spec.ts
import { test, expect } from "@playwright/test";

test("should load category and display products", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Click "Keys & Pianos"
  await page.click('[data-category="keys"]');

  // Wait for products to load
  await page.waitForSelector("[data-product-card]");

  // Verify product count
  const products = await page.locator("[data-product-card]").count();
  expect(products).toBeGreaterThan(0);

  // Verify pricing displays
  const prices = await page.locator("[data-product-price]").allTextContents();
  expect(prices.some((p) => p.includes("₪"))).toBe(true);
});
```

---

## Performance Tips

1. **Lazy Load Brands**: Don't load all brands on startup

   ```typescript
   const catalog = await catalogLoader.loadBrand("roland"); // Load on-demand
   ```

2. **Memoize Expensive Calculations**

   ```typescript
   const filteredProducts = useMemo(() => {
     return products.filter((p) => getPriceValue(p) > 500);
   }, [products]); // Only re-calculate when products change
   ```

3. **Use Zustand for State** (lighter than Redux)

   ```typescript
   const { products } = useNavigationStore(); // Selector hook
   ```

4. **Optimize Images**: Keep images under 200KB each
   - Use WebP format
   - Lazy load with `loading="lazy"`
   - Use CDN with image compression

---

## Troubleshooting

### Issue: Products not loading

**Check**: Is `catalogLoader.loadProductsByCategory()` being called?

```typescript
useEffect(() => {
  console.log("Loading category:", activeTribeId);
  catalogLoader
    .loadProductsByCategory(activeTribeId)
    .then((products) => {
      console.log("Loaded products:", products.length);
      setProducts(products);
    })
    .catch((err) => console.error("Load error:", err));
}, [activeTribeId]);
```

### Issue: Prices showing "N/A"

**Check**: Is the product data normalized?

```typescript
// Debug: Log raw product structure
console.log("Raw product:", rawProduct);

// Then check what priceFormatter extracts
import { getPrice, getPriceValue } from "./lib/priceFormatter";
console.log("Formatted price:", getPrice(rawProduct));
```

### Issue: Images not loading

**Check**: Is `resolveProductImage()` returning valid URL?

```typescript
import { resolveProductImage } from "./lib/imageResolver";
const imageUrl = resolveProductImage(product);
console.log("Image URL:", imageUrl); // Should be https://...

// Verify in browser
fetch(imageUrl).then((r) => console.log("Status:", r.status)); // Should be 200
```

---

## Next Steps

- **Add a new brand**: Follow "Adding New Brands" in [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md)
- **Implement search**: Use `instantSearch.search()` from `lib/instantSearch.ts`
- **Add filtering**: Use `useMemo()` with `getPriceValue()` to filter by price
- **Extend schemas**: Update types in `frontend/src/types/index.ts`

**Questions?** Review the code comments in `frontend/src/lib/` or check the [API_REFERENCE.md](API_REFERENCE.md).

---

**Status**: ✅ Production Ready | v3.9.1 | Last Updated: January 2026
