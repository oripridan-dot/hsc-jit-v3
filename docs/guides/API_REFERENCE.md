# API Reference - HSC-JIT v3.9.1

## catalogLoader.ts

Main singleton for loading products and catalogs. All data operations go through this module.

### Methods

#### `loadBrand(brandName: string): Promise<Catalog>`

Load all products from a specific brand.

```typescript
import { catalogLoader } from "./lib/catalogLoader";

// Load all Roland products
const rolandCatalog = await catalogLoader.loadBrand("roland");
console.log(rolandCatalog.products.length); // 500
console.log(rolandCatalog.brand); // "Roland"
console.log(rolandCatalog.logo_url); // "https://..."
```

**Returns**:

```typescript
interface Catalog {
  brand: string;
  logo_url?: string;
  products: Product[];
  lastUpdated?: string;
}
```

---

#### `loadAllProducts(): Promise<Product[]>`

Load all products from all brands (full index).

```typescript
const allProducts = await catalogLoader.loadAllProducts();
console.log(allProducts.length); // 5,268
```

**Performance**: ~500ms on first call, cached after

---

#### `loadProductsByCategory(categoryId: string): Promise<Product[]>`

Load products matching a category across all brands.

```typescript
// Load all "Keys & Pianos" products
const keysProducts = await catalogLoader.loadProductsByCategory("keys");
// Returns: Roland Pianos + Nord Keyboards + Moog Synths + etc.

// Category IDs:
// - 'keys' → Keys & Pianos
// - 'drums' → Drums & Percussion
// - 'guitars' → Guitars & Amps
// - 'studio' → Studio & Recording
// - 'live' → Live Sound
// - 'dj' → DJ & Production
// - 'software' → Software & Cloud
// - 'accessories' → Accessories
```

**Returns**: Array of `Product` objects with normalized fields

---

#### `findProductById(productId: string): Promise<Product | null>`

Find a specific product by its ID across all brands.

```typescript
const product = await catalogLoader.findProductById("ROLAND-DP990F");
if (product) {
  console.log(product.name); // "Roland DP-990F"
  console.log(product.price); // 1000
  console.log(product.image_url); // "https://..."
} else {
  console.log("Product not found");
}
```

**Returns**: `Product` object or `null` if not found

---

## dataNormalizer.ts

Normalize products from different data schemas into a consistent format.

### Methods

#### `normalizeProduct(rawProduct: any): Product`

Convert a product from any schema (Roland, Boss, Nord, etc.) to standard format.

```typescript
import { dataNormalizer } from "./lib/dataNormalizer";

// Roland format
const rolandProduct = {
  id: "ROLAND-DP990F",
  name: "DP-990F",
  category: "Pianos",
  pricing: { regular_price: 1000, sale_price: 800 },
  image_url: "https://...",
};

// Boss format
const bossProduct = {
  id: "BOSS-DD500",
  name: "DD-500",
  category: "Effects",
  commercial: { price: 500 },
  media: { thumbnail: "https://..." },
};

// Both normalize to same structure
const normalized1 = dataNormalizer.normalizeProduct(rolandProduct);
const normalized2 = dataNormalizer.normalizeProduct(bossProduct);

// Both now have consistent fields:
// - id, name, brand, category
// - pricing (numeric), image_url
// - specifications, description
```

**Returns**:

```typescript
interface NormalizedProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  pricing?: number;
  description?: string;
  image_url?: string;
  images?: string[];
  specifications?: Record<string, string>;
  inStock?: boolean;
}
```

---

#### `normalizeProducts(rawProducts: any[]): Product[]`

Batch normalize multiple products with error handling.

```typescript
import { dataNormalizer } from "./lib/dataNormalizer";

const rolandCatalog = await fetch("/data/roland.json").then((r) => r.json());
const normalized = dataNormalizer.normalizeProducts(rolandCatalog.products);

// Skips any products that fail to normalize
// Returns only successfully normalized products
```

---

#### `extractPrice(product: any): number | undefined`

Extract numeric price from product (tries multiple locations).

```typescript
import { dataNormalizer } from "./lib/dataNormalizer";

const rolandPrice = extractPrice({ pricing: { regular_price: 1000 } }); // 1000
const bossPrice = extractPrice({ commercial: { price: 500 } }); // 500
const nordPrice = extractPrice({ price: 750 }); // 750
const unknownPrice = extractPrice({}); // undefined
```

**Fallback order**:

1. `product.pricing.regular_price`
2. `product.pricing.price`
3. `product.commercial.price`
4. `product.price`
5. `undefined` (if not found)

---

## priceFormatter.ts

Extract, format, and compare prices.

### Methods

#### `getPrice(product: Product): string`

Get formatted price string with ₪ currency symbol.

```typescript
import { getPrice } from "./lib/priceFormatter";

const product = { pricing: { regular_price: 1500 } };
const priceStr = getPrice(product); // "₪1,500"

// Handles various formats
getPrice({ price: 999 }); // "₪999"
getPrice({ pricing: { regular_price: 1234567 } }); // "₪1,234,567"
getPrice({}); // "N/A" (graceful fallback)
getPrice({ pricing: { regular_price: null } }); // "N/A"
```

---

#### `getPriceValue(product: Product): number`

Get numeric price value for sorting and comparison.

```typescript
import { getPriceValue } from "./lib/priceFormatter";

const products = [
  { pricing: { regular_price: 1500 } },
  { price: 500 },
  { pricing: { regular_price: 2000 } },
];

// Sort by price ascending
products.sort((a, b) => getPriceValue(a) - getPriceValue(b));
// Result: 500, 1500, 2000

// Filter products under ₪1000
const budget = products.filter((p) => getPriceValue(p) < 1000);
```

**Returns**: `number` or `0` if price cannot be extracted

---

#### `formatPrice(price: number | string | null): string`

Format a numeric price with commas and ₪ symbol.

```typescript
import { formatPrice } from "./lib/priceFormatter";

formatPrice(1500); // "₪1,500"
formatPrice("2000"); // "₪2,000"
formatPrice(1234567); // "₪1,234,567"
formatPrice(0); // "₪0"
formatPrice(null); // "N/A"
```

---

## imageResolver.ts

Resolve product images with intelligent fallback chain.

### Methods

#### `resolveProductImage(product: Product, defaultImage?: string): string`

Get valid image URL for a product, trying multiple locations.

```typescript
import { resolveProductImage } from "./lib/imageResolver";

const product = {
  // image_url is null
  // image is null
  media: {
    thumbnail: "https://images.example.com/product.jpg",
  },
};

const imageUrl = resolveProductImage(product);
// Returns: "https://images.example.com/product.jpg"

// With fallback
const fallback = resolveProductImage(product, "/images/placeholder.png");
// Uses fallback if no image found
```

**Fallback chain**:

1. `product.image_url` (Roland format)
2. `product.image` (Alternative format)
3. `product.media.thumbnail` (Boss/Nord nested)
4. `product.media.gallery[0]` (First gallery image)
5. `product.logo_url` (Brand logo)
6. Generated SVG placeholder (last resort)

**Returns**: Valid HTTPS URL or SVG data URI

---

#### `isValidImageUrl(url: string): boolean`

Check if image URL is valid and accessible.

```typescript
import { isValidImageUrl } from "./lib/imageResolver";

isValidImageUrl("https://example.com/image.jpg"); // true
isValidImageUrl("https://example.com/broken.jpg"); // false (invalid)
isValidImageUrl(""); // false
isValidImageUrl(null); // false
```

---

## instantSearch.ts (Fuse.js)

Full-text search across products.

### Methods

#### `search(query: string, options?: SearchOptions): Product[]`

Search products by name, description, category, etc.

```typescript
import { instantSearch } from "./lib/instantSearch";

const results = instantSearch.search("keyboard", {
  keys: ["name", "category", "description"],
  limit: 20,
});

// Returns top 20 results matching "keyboard"
console.log(results.length); // Up to 20
console.log(results[0].name); // Best match
```

**Options**:

```typescript
interface SearchOptions {
  keys?: string[]; // Fields to search ('name', 'category', 'description')
  limit?: number; // Max results (default: 10)
  threshold?: number; // Fuzzy match threshold (0.0-1.0, default: 0.6)
}
```

**Returns**: Array of matching `Product` objects, sorted by relevance

---

#### `searchWithFilters(query: string, filters: Filters): Product[]`

Search with additional filters.

```typescript
const results = instantSearch.searchWithFilters("keyboard", {
  category: "keys",
  minPrice: 500,
  maxPrice: 2000,
  brand: "roland",
});
```

---

## categoryConsolidator.ts

Map brand-specific categories to universal UI categories.

### Methods

#### `consolidateCategory(brand: string, brandCategory: string): UICategory`

Convert brand category to UI category.

```typescript
import { consolidateCategory } from "./lib/categoryConsolidator";

// Roland says "Pianos", UI shows "keys"
consolidateCategory("roland", "Pianos"); // 'keys'

// Moog says "Synthesizers", UI shows "keys"
consolidateCategory("moog", "Synthesizers"); // 'keys'

// Boss says "Pedals", UI shows "accessories"
consolidateCategory("boss", "Pedals"); // 'accessories'
```

**UI Categories**:

- `'keys'` - Keys & Pianos
- `'drums'` - Drums & Percussion
- `'guitars'` - Guitars & Amps
- `'studio'` - Studio & Recording
- `'live'` - Live Sound
- `'dj'` - DJ & Production
- `'software'` - Software & Cloud
- `'accessories'` - Accessories

---

#### `getConsolidatedCategory(categoryId: UICategory): ConsolidatedCategory`

Get category metadata.

```typescript
import { getConsolidatedCategory } from "./lib/categoryConsolidator";

const category = getConsolidatedCategory("keys");
// Returns:
// {
//   id: 'keys',
//   label: 'Keys & Pianos',
//   icon: '🎹',
//   color: '#f59e0b'
// }
```

---

## Zustand Store (navigationStore.ts)

Global state management for navigation and UI.

### Store Structure

```typescript
import { useNavigationStore } from "./store/navigationStore";

const {
  // State
  selectedProduct,
  currentPath,
  products,
  isLoading,

  // Actions
  selectProduct,
  selectCategory,
  goBack,
  clearSelection,
  setProducts,
  setLoading,
} = useNavigationStore();
```

### Example Usage

```typescript
// In a component
function ProductCard({ product }: Props) {
  const { selectProduct } = useNavigationStore();

  return (
    <div
      onClick={() => selectProduct(product)}
      className="border p-4 cursor-pointer"
    >
      <h3>{product.name}</h3>
      <p>{product.category}</p>
      <button onClick={() => selectProduct(product)}>
        View Details
      </button>
    </div>
  );
}

// In another component
function ProductDetailModal() {
  const { selectedProduct, clearSelection } = useNavigationStore();

  if (!selectedProduct) return null;

  return (
    <div className="modal">
      <h1>{selectedProduct.name}</h1>
      <p>{selectedProduct.description}</p>
      <button onClick={() => clearSelection()}>Close</button>
    </div>
  );
}
```

---

## Type Definitions

### Product

```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;

  // Pricing (normalized to single number)
  pricing?: number | string;
  price?: number | string;

  // Images
  image_url?: string;
  image?: string;
  media?: {
    thumbnail?: string;
    gallery?: string[];
  };
  logo_url?: string;

  // Details
  specifications?: Record<string, string>;
  inStock?: boolean;
  sku?: string;

  // Flex fields
  [key: string]: any;
}
```

### Catalog

```typescript
interface Catalog {
  brand: string;
  logo_url?: string;
  products: Product[];
  lastUpdated?: string;
}
```

### ConsolidatedCategory

```typescript
interface ConsolidatedCategory {
  id: UICategory;
  label: string;
  icon: string;
  color: string;
}

type UICategory =
  | "keys"
  | "drums"
  | "guitars"
  | "studio"
  | "live"
  | "dj"
  | "software"
  | "accessories";
```

---

## Common Patterns

### Pattern 1: Load and Display Category Products

```typescript
import { useEffect, useState } from 'react';
import { catalogLoader } from '../lib/catalogLoader';
import { getPrice } from '../lib/priceFormatter';
import { resolveProductImage } from '../lib/imageResolver';

function CategoryView({ categoryId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    catalogLoader.loadProductsByCategory(categoryId)
      .then(setProducts);
  }, [categoryId]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map(p => (
        <div key={p.id}>
          <img src={resolveProductImage(p)} alt={p.name} />
          <h3>{p.name}</h3>
          <p>{getPrice(p)}</p>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Search and Filter

```typescript
import { instantSearch } from '../lib/instantSearch';
import { getPriceValue } from '../lib/priceFormatter';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const found = instantSearch.search(query, {
      keys: ['name', 'category', 'description'],
      limit: 50
    });

    // Filter by price
    const filtered = found.filter(p => getPriceValue(p) < 2000);
    setResults(filtered);
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <ul>
        {results.map(p => (
          <li key={p.id}>{p.name} - {getPrice(p)}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

**Status**: ✅ Production Ready | v3.9.1 | Last Updated: January 2026
