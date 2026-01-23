# Spectrum Layer Integration Guide

## Quick Start

### 1. Basic Integration in Any Component

```tsx
import { SpectrumMiddleLayer } from "@/components/smart-views";
import { catalogLoader } from "@/lib/catalogLoader";

function MyProductView() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    catalogLoader.loadBrand("roland").then((catalog) => {
      setProducts(catalog.products || []);
    });
  }, []);

  return <SpectrumMiddleLayer products={products} />;
}
```

### 2. Integration with Existing Category Views

Add to [UniversalCategoryView.tsx](../UniversalCategoryView.tsx):

```tsx
import { SpectrumMiddleLayer } from "./smart-views";

// Add view mode state
const [viewMode, setViewMode] = useState<"rack" | "spectrum" | "list">("rack");

// In your render:
{
  viewMode === "spectrum" && (
    <SpectrumMiddleLayer
      products={filteredProducts}
      categoryName={category.label}
    />
  );
}

{
  viewMode === "rack" && (
    <ModularRack categoryName={category.label} subcategories={subcategories} />
  );
}
```

### 3. Add View Switcher Buttons

```tsx
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setViewMode("rack")}
    className={viewMode === "rack" ? "active" : ""}
  >
    Rack View
  </button>
  <button
    onClick={() => setViewMode("spectrum")}
    className={viewMode === "spectrum" ? "active" : ""}
  >
    Spectrum View
  </button>
</div>
```

## Advanced Usage

### Custom Subcategory Filtering

```tsx
const CUSTOM_FILTERS = [
  { id: "all", label: "All" },
  { id: "flagship", label: "Flagship Models" },
  { id: "portable", label: "Portable" },
];

function filterProducts(products: Product[], filterId: string) {
  if (filterId === "all") return products;
  if (filterId === "flagship") {
    return products.filter((p) => getProductPrice(p) > 2000);
  }
  if (filterId === "portable") {
    return products.filter((p) =>
      p.features?.some((f) => f.toLowerCase().includes("portable")),
    );
  }
  return products;
}

// Use with controlled filtering
const [activeFilter, setActiveFilter] = useState("all");
const filtered = useMemo(
  () => filterProducts(products, activeFilter),
  [products, activeFilter],
);

<SpectrumMiddleLayer products={filtered} subcategories={CUSTOM_FILTERS} />;
```

### Brand-Specific Configurations

```tsx
const BRAND_CONFIGS = {
  roland: {
    subcategories: [
      { id: "all", label: "All Products" },
      { id: "fantom", label: "FANTOM Series" },
      { id: "jupiter", label: "JUPITER-X" },
      { id: "juno", label: "JUNO Series" },
    ],
  },
  nord: {
    subcategories: [
      { id: "all", label: "All Nord" },
      { id: "stage", label: "Stage" },
      { id: "piano", label: "Piano" },
      { id: "electro", label: "Electro" },
    ],
  },
};

function BrandSpectrumView({ brand }: { brand: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const config = BRAND_CONFIGS[brand] || {
    subcategories: DEFAULT_SUBCATEGORIES,
  };

  useEffect(() => {
    catalogLoader.loadBrand(brand).then((catalog) => {
      setProducts(catalog.products || []);
    });
  }, [brand]);

  return (
    <SpectrumMiddleLayer
      products={products}
      categoryName={brand}
      subcategories={config.subcategories}
    />
  );
}
```

### Loading States & Error Handling

```tsx
function SafeSpectrumView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    catalogLoader
      .loadBrand("roland")
      .then((catalog) => {
        setProducts(catalog.products || []);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load products");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  return <SpectrumMiddleLayer products={products} />;
}
```

## Styling Customizations

### Override Brand Colors

Edit [SpectrumLayer.tsx](./SpectrumLayer.tsx):

```tsx
const BRAND_COLORS: Record<string, string> = {
  roland: "#ff6b00", // Existing
  myBrand: "#ff00ff", // Add your brand
  // ...
};
```

### Adjust Grid Appearance

```tsx
// In SpectrumGrid component
<div
  className="absolute inset-0 opacity-20 pointer-events-none"
  style={{
    backgroundImage: `
      linear-gradient(to right, #10b981 1px, transparent 1px),  // Change color
      linear-gradient(to bottom, #10b981 1px, transparent 1px)
    `,
    backgroundSize: "50px 50px", // Change grid density
  }}
/>
```

### Custom Popup Styling

```tsx
// In ProductPopup component, modify the main container:
<motion.div
  // ...existing props
  className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
>
```

## Performance Tips

### 1. Limit Product Count

```tsx
const displayProducts = useMemo(
  () =>
    products
      .filter((p) => getProductPrice(p) > 0) // Only with pricing
      .slice(0, 50), // Limit to 50
  [products],
);
```

### 2. Debounce Filtering

```tsx
import { useMemo } from "react";
import { debounce } from "lodash"; // or implement your own

const debouncedFilter = useMemo(
  () =>
    debounce((query: string) => {
      // Filter logic
    }, 300),
  [],
);
```

### 3. Memoize Expensive Calculations

```tsx
const productStats = useMemo(
  () => ({
    totalProducts: products.length,
    withPricing: products.filter((p) => getProductPrice(p) > 0).length,
    avgPrice:
      products.reduce((sum, p) => sum + getProductPrice(p), 0) /
      products.length,
  }),
  [products],
);
```

## Accessibility

The component includes:

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels on interactive elements
- ✅ Focus indicators
- ✅ Screen reader friendly structure

To enhance:

```tsx
// Add keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && selectedProduct) {
      setSelectedProduct(null);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedProduct]);
```

## Testing

### Unit Test Example

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SpectrumMiddleLayer } from "./SpectrumLayer";

describe("SpectrumMiddleLayer", () => {
  const mockProducts = [
    { id: "1", name: "Test Product", brand: "roland" /* ... */ },
  ];

  it("renders without crashing", () => {
    render(<SpectrumMiddleLayer products={mockProducts} />);
    expect(screen.getByText(/Awaiting Signal/i)).toBeInTheDocument();
  });

  it("shows product details on hover", async () => {
    render(<SpectrumMiddleLayer products={mockProducts} />);
    const dot = screen.getByLabelText(/View Test Product/i);
    fireEvent.mouseEnter(dot);
    // Assert details appear
  });
});
```

## Roadmap & Future Enhancements

- [ ] Export visualization as PNG/SVG
- [ ] Zoom and pan controls
- [ ] Multi-product comparison mode
- [ ] Custom axis configurations
- [ ] Animated transitions between data sets
- [ ] Keyboard-only navigation
- [ ] Touch gesture support (pinch to zoom)

## Troubleshooting

### Issue: Products not appearing in grid

**Solution**: Check that products have valid pricing data:

```tsx
console.log(
  "Products with pricing:",
  products.filter((p) => getProductPrice(p) > 0).length,
);
```

### Issue: Colors not matching brand

**Solution**: Verify brand name matches keys in `BRAND_COLORS`:

```tsx
console.log("Brand:", product.brand.toLowerCase());
```

### Issue: Performance lag with many products

**Solution**: Implement virtual scrolling or limit visible products:

```tsx
const visibleProducts = products.slice(0, 30);
```

## Support

For issues or questions:

1. Check [SPECTRUM_LAYER.md](./SPECTRUM_LAYER.md) for full documentation
2. Review [SpectrumDemo.tsx](./SpectrumDemo.tsx) for working example
3. Search for similar patterns in existing smart-views components
