# Spectrum Middle Layer

**Audio Hardware Inspired Product Visualization System**

The Spectrum Middle Layer is a tactile, equipment-inspired UI component that displays products on a 2D spectrum grid, creating an intuitive "market landscape" view for gear selection.

## 🎨 Design Philosophy

Inspired by:

- Studio audio analyzers with yellow/amber EQ grids
- Vintage synthesizer LCD screens
- Professional rack-mounted equipment
- Oscilloscope displays

## 📐 Architecture

The component consists of 4 distinct sections:

### 1. **Upper Section: Three LCD Screens**

Three independent "hardware displays" that show hovered product details:

- **Identity Screen**: Brand name with brand color
- **Signal Path Screen**: Product name and price
- **Parameters Screen**: Top 3 key features

Features:

- Green/red LED status indicators
- Scanline overlay effect
- Glass reflection gradients
- "Awaiting Signal..." placeholder state

### 2. **Middle Section: Spectrum Analyzer Grid**

Interactive 2D visualization plotting products by:

- **X-Axis**: Price (low → high)
- **Y-Axis**: Popularity score (low → high)

Features:

- Yellow/amber grid lines (40px spacing)
- Brand-colored dots with glow effects
- Hover to preview, click to open detail
- Smooth framer-motion animations
- Empty state handling

### 3. **Bottom Section: Sub-Category Navigation**

Filter buttons with "pressed button" visual feedback:

- Active button: Amber glow with slight translate-down
- Hover state: Smooth color transitions
- Supports custom subcategory lists

### 4. **Overlay: Glassmorphism Product Popup**

Full-screen modal with:

- Backdrop blur effect
- Brand-colored avatar circle
- Popularity progress bar
- Feature list with checkmarks
- CTA buttons (Recommend, View Details)

## 🚀 Usage

### Basic Implementation

```tsx
import { SpectrumMiddleLayer } from "@/components/smart-views";
import type { Product } from "@/types";

function MyCategory() {
  const [products, setProducts] = useState<Product[]>([]);

  // Load your products from catalogLoader
  useEffect(() => {
    catalogLoader.loadBrand("roland").then((catalog) => {
      setProducts(catalog.products || []);
    });
  }, []);

  return (
    <SpectrumMiddleLayer products={products} categoryName="Keys & Pianos" />
  );
}
```

### With Custom Subcategories

```tsx
const KEYS_SUBCATEGORIES = [
  { id: "all", label: "All Keys" },
  { id: "stage", label: "Stage Pianos" },
  { id: "synth", label: "Synthesizers" },
  { id: "workstation", label: "Workstations" },
];

<SpectrumMiddleLayer
  products={products}
  categoryName="Keys & Pianos"
  subcategories={KEYS_SUBCATEGORIES}
/>;
```

### Full Demo Page

See `SpectrumDemo.tsx` for a complete working example that:

- Loads real catalog data
- Handles loading/error states
- Shows stats and legend
- Demonstrates best practices

## 📊 Data Flow

### Input: Product Array

The component accepts standard `Product[]` from your catalog system.

### Price Extraction

```typescript
// Uses multiple fallback sources
product.pricing?.regular_price ||
  product.pricing?.eilat_price ||
  product.halilit_price ||
  0;
```

### Popularity Calculation

Calculated from multiple product signals:

- Verification confidence
- Number of features
- Number of videos
- Manual availability
- Score range: 0-100

### Brand Color Mapping

```typescript
const BRAND_COLORS = {
  roland: "#ff6b00", // Orange
  boss: "#ff6b00",
  nord: "#e31e24", // Red
  yamaha: "#4f46e5", // Indigo
  korg: "#2563eb", // Blue
  moog: "#10b981", // Green
  default: "#64748b", // Slate (fallback)
};
```

## 🎨 Styling

### Tailwind Classes Used

- `slate-*` for dark UI backgrounds
- `amber-*` for highlights and active states
- `cyan-*` for feature indicators
- `green-*` for positive actions

### Custom CSS

- Grid pattern via `linear-gradient`
- Scanline effect via gradient overlay
- Box shadows for glow effects
- Backdrop blur for glassmorphism

### Responsive Design

- Grid adapts from 1 column (mobile) to 3 columns (desktop)
- Font sizes scale with viewport
- Touch-friendly button sizes

## ⚡ Performance

### Optimizations

- `useMemo` for expensive calculations (scales, filters)
- Products filtered client-side (no API calls)
- AnimatePresence for smooth transitions
- Lazy evaluation of popularity scores

### Recommendations

- Limit to ~50 products per view for clarity
- Pre-filter products by category before passing
- Use React.memo for sub-components if re-rendering issues occur

## 🔧 Customization

### Change Grid Color

```tsx
// In SpectrumGrid component, modify:
backgroundImage: `
  linear-gradient(to right, #10b981 1px, transparent 1px),  // Green
  linear-gradient(to bottom, #10b981 1px, transparent 1px)
`;
```

### Change Axis Mapping

```tsx
// Swap axes by reversing xPos/yPos calculations
const xPos = 100 - (product.recommendations / maxRecs) * 100; // Reverse
const yPos = (product.price / maxPrice) * 100;
```

### Add More Info Screens

```tsx
{
  /* Add 4th screen */
}
<InfoScreen title="Status" active={!!hoveredProduct}>
  {hoveredProduct && (
    <div className="text-green-400">{hoveredProduct.availability}</div>
  )}
</InfoScreen>;
```

## 🐛 Troubleshooting

### No Dots Appearing?

- Check that products have valid pricing data
- Verify `getProductPrice()` returns > 0
- Check browser console for errors

### Dots Clustered in Corner?

- Products may have similar price ranges
- Adjust scale multipliers (currently `* 1.1`)
- Consider logarithmic scaling for wide price ranges

### Animation Lag?

- Reduce product count
- Check for excessive re-renders
- Profile with React DevTools

## 🔗 Integration Points

### With Existing Components

```tsx
// In UniversalCategoryView.tsx
import { SpectrumMiddleLayer } from "@/components/smart-views";

// Add as alternative view mode
{
  viewMode === "spectrum" && (
    <SpectrumMiddleLayer
      products={filteredProducts}
      categoryName={category.label}
    />
  );
}
```

### With ModularRack

```tsx
// Can be used alongside or as alternative to ModularRack
<div className="space-y-8">
  <SpectrumMiddleLayer products={products} />
  <ModularRack categoryName="..." subcategories={...} />
</div>
```

## 📦 Dependencies

- `framer-motion`: ^12.25.0 (animations)
- `lucide-react`: ^0.562.0 (icons)
- `react`: ^19.2.0
- Tailwind CSS (styling)

All dependencies are already installed in the project.

## 🎯 Roadmap

Potential enhancements:

- [ ] Zoom/pan controls for large datasets
- [ ] Multiple axis options (price vs. features, price vs. year)
- [ ] Export visualization as image
- [ ] Comparison mode (select multiple products)
- [ ] Keyboard navigation
- [ ] Custom color schemes per brand
- [ ] 3D perspective mode

## 📄 License

Part of HSC-JIT v3 - Halilit Support Center
