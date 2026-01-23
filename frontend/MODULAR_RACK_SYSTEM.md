# Modular Rack System v3.8

## 🎛️ Architecture Overview

The Modular Rack System is a redesigned UI/UX paradigm that treats each subcategory as a **rack-mounted module** in a familiar synthesizer-style rack. This is optimized for musicians, producers, and audio engineers who are familiar with modular/rack-mounted synthesizers and equipment.

### Core Concept

Instead of traditional flat lists or grids, each subcategory becomes:

- **A physical rack module** with a sleek, professional design
- **Hotspots** that represent individual products
- **Wide hover screens** that appear above modules to display rich product data

This creates a consistent, intuitive interface that mirrors the user's real-world workflow.

---

## 📦 Components

### 1. **RackModule** (`src/components/smart-views/RackModule.tsx`)

The core building block representing a single subcategory.

```tsx
interface RackModuleProps {
  subcategoryName: string;
  products: Product[];
  icon?: React.ReactNode;
  color?: string; // Brand or category color
  className?: string;
}
```

#### Features:

**Module Header**

- Subcategory name with icon
- Product count indicator
- Professional branding

**Hotspot Row**

- Visual slots for each product (● indicators)
- Animated frequency visualization in background
- Cyan glow on active hotspot
- Smooth scale animations on hover
- Tooltips showing product names

**Module Footer**

- Module ID (RK-MOD-XXX)
- Slot count
- Status indicators

**HoverScreen** (appears when hovering hotspots)

- Product image (best available)
- Key specs in 2x2 grid:
  - Price (₪ currency)
  - Category (purple highlight)
  - Brand (white)
  - Model number (green mono)
- Description snippet
- Rich animations and transitions

---

### 2. **ModularRack** (`src/components/smart-views/ModularRack.tsx`)

Container component that organizes multiple RackModules into a cohesive system.

```tsx
interface ModularRackProps {
  categoryName: string;
  subcategories: Array<{
    name: string;
    products: Product[];
    icon?: React.ReactNode;
    color?: string;
  }>;
  className?: string;
}
```

#### Features:

- **Stacked vertical layout** - Modules stack like a synthesizer rack
- **Slot indicators** - Left-side numbering [01], [02], etc.
- **Connection lines** - Visual separator between modules
- **Rack header/footer** - Professional framing
- **Staggered animations** - Modules animate in sequence

---

## 🎨 Design Language

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  WIDE HOVER SCREEN (appears above on hover)        │
│  ┌────────────────────────────────────────────────┐ │
│  │ [Product Image] │ Category │ Price │ Model    │ │
│  │                 │ Brand    │ Specs │ Details  │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
           ↓ (hovers)
┌─────────────────────────────────────────────────────┐
│ [01] ░ Module Name                    "RK-MOD-XYZ" ░│
│      BRAND/CATEGORY HEADER            [3 units]     │
├─────────────────────────────────────────────────────┤
│      ◇ Frequency Visualization...                   │
│      ●   ●   ●   ●   ●   ●   ●   ●                │
│      (hotspot dots - click to select)               │
│      ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔           │
├─────────────────────────────────────────────────────┤
│  ◆ RK-MOD-ABC • SLOTS: 3                            │
└─────────────────────────────────────────────────────┘
```

### Color Scheme

- **Active Hotspot**: Cyan (from-cyan-500 to cyan-300)
- **Inactive Hotspot**: Zinc gradient
- **Module Background**: Gradient (brand/category color)
- **Text**: White (primary), Zinc/Gray (secondary)
- **Accents**: Purple (categories), Green (model numbers)

### Animations

| Element            | Animation                        | Duration |
| ------------------ | -------------------------------- | -------- |
| Module hover       | glow + shadow expand             | 300ms    |
| Hotspot hover      | scale 1.0 → 1.2 + ring expansion | 150ms    |
| Hotspot active     | breathing glow + cyan pulse      | 2s loop  |
| HoverScreen appear | opacity + scale + slide          | 250ms    |
| Frequency bars     | height oscillation               | 2s loop  |
| Status indicator   | pulse glow                       | 2s loop  |

---

## 🔄 Integration with UniversalCategoryView

The rack view is now available as a 4th view mode:

```tsx
type ViewMode = "shelves" | "grid" | "compact" | "rack";
```

### Usage:

Users can toggle between view modes with buttons in the header:

- 📚 **Shelves** - Original TierBar view
- ▦ **Grid** - Product grid layout
- ▤ **Compact** - Compact grid
- 🎛️ **Rack** - New modular rack system (purple button)

When selecting "Rack" view:

```tsx
{
  viewMode === "rack" && shelfNames.length > 0 && (
    <div className="pt-48">
      <ModularRack
        categoryName={activeCategory}
        subcategories={shelfNames.map((name) => ({
          name,
          products: shelves[name],
        }))}
      />
    </div>
  );
}
```

---

## 🎯 User Workflow

### 1. **Initial Discovery**

- User selects a category (e.g., "Keys & Pianos")
- View switches to "Rack" mode
- Multiple modules appear (e.g., "Digital Pianos", "Synthesizers", "Keyboards")

### 2. **Hover Exploration**

- User hovers over a hotspot (●)
- Wide screen appears above showing:
  - Product image
  - Price in ₪ currency
  - Category, brand, model
  - Description snippet
- Hotspot glows cyan and pulses

### 3. **Selection**

- Click on hotspot to select product
- Product details appear in workbench/detail view
- Module provides feedback with animations

### 4. **Comparative Browsing**

- User can explore multiple hotspots in a module without clicking
- Data-rich hover screens enable quick comparison
- Familiar rack aesthetic feels natural for musicians

---

## 📊 Data Flow

```
UniversalCategoryView
├─ Loads products by category
├─ Groups by subcategory → shelves
└─ Maps to ModularRack
   ├─ Creates ModularRack component
   ├─ Passes each shelf as a subcategory
   └─ Each subcategory → RackModule
      ├─ Extracts products
      ├─ Creates hotspots (● dots)
      ├─ On hover: renders HoverScreen
      └─ On click: calls selectProduct()
```

---

## 🛠️ Key Implementation Details

### Hotspot Generation

Each product in a subcategory becomes a hotspot:

```tsx
const hotspots: HotspotData[] = products.map((product, index) => ({
  productId: product.id,
  position: (index / Math.max(products.length - 1, 1)) * 100,
  product,
}));
```

Hotspots are distributed evenly across the module width using percentage positioning.

### HoverScreen Data Display

The HoverScreen intelligently displays available product data:

```tsx
- Image: product.images (best available)
- Price: product.halilit_price or pricing.regular_price
- Category: product.category
- Brand: product.brand
- Model: product.model_number
- Description: product.description
```

### Interactive States

**Hotspot States:**

- **Inactive**: Zinc gradient, subtle border
- **Hover**: 20% scale increase, shadow expansion
- **Active**: Cyan glow, 10% scale increase, breathing animation

**Module States:**

- **Base**: Professional gradient with subtle borders
- **Hover**: Enhanced glow, brighter gradient overlay

---

## 🎤 User Experience Enhancements

### For Musicians/Producers

1. **Familiar Layout**: Rack-mounted modules mirror real synthesizer racks
2. **Data-Rich Tooltips**: Hover = immediate product info without navigation
3. **Visual Feedback**: Glows, scales, and animations provide tactile feel
4. **Quick Browsing**: Compare products within a category instantly
5. **Professional Aesthetic**: Dark theme + precision UI matches professional audio tools

### Consistency

- Every subcategory = identical module structure
- Predictable hotspot behavior
- Consistent spacing and alignment
- Unified color/animation language

---

## 📱 Responsive Design

- Modules stack vertically (natural for tall screens)
- Hotspots adapt to module width
- HoverScreen scales appropriately
- Touch support (tap to select instead of hover)
- Mobile: May benefit from additional tap-to-expand interactions

---

## 🚀 Future Enhancements

1. **Module Customization**
   - User can drag/reorder modules
   - Save favorite subcategories
   - Custom module colors/themes

2. **Advanced Hotspot Interaction**
   - Right-click context menu (add to cart, compare, etc.)
   - Multi-select with Shift+click
   - Hotspot search/filter within module

3. **Expanded HoverScreen**
   - Extended specifications
   - Related products carousel
   - Quick-buy button
   - Manual/resource links

4. **Analytics**
   - Track which hotspots are most explored
   - Heatmaps of module interactions
   - Conversion metrics per subcategory

5. **Mobile Optimization**
   - Touch-aware module design
   - Swipe-to-explore hotspots
   - Dedicated mobile layout

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Switch to "Rack" view mode
- [ ] Hover over different hotspots → verify HoverScreen appears
- [ ] Check animations (glow, scale, pulse)
- [ ] Click hotspot → verify selectProduct() called
- [ ] Verify module layout with various product counts
- [ ] Test with different categories
- [ ] Check responsive behavior
- [ ] Verify no console errors

### Component Props

**RackModule:**

- ✅ Renders with products
- ✅ Shows correct hotspot count
- ✅ Hover screens appear correctly
- ✅ Hotspots clickable and functional

**ModularRack:**

- ✅ Multiple modules display
- ✅ Staggered animation works
- ✅ Slot numbers visible
- ✅ Connection lines display

---

## 📝 TypeScript Types

```tsx
interface RackModuleProps {
  subcategoryName: string;
  products: Product[];
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

interface ModularRackProps {
  categoryName: string;
  subcategories: Array<{
    name: string;
    products: Product[];
    icon?: React.ReactNode;
    color?: string;
  }>;
  className?: string;
}

interface HotspotData {
  productId: string;
  position: number; // 0-100 percentage
  product: Product;
}

interface HoverScreenProps {
  product: Product;
}
```

---

## 🎬 Example Workflow

### Step 1: User navigates to "Keys & Pianos"

```
UniversalCategoryView loads all products in "keys" category
Groups them: "Digital Pianos", "Synthesizers", "Workstations", "Portable"
```

### Step 2: User switches to "Rack" view

```
Button: 🎛️ Rack (purple, highlighted)
ModularRack renders 4 modules:
  [01] Digital Pianos (8 products → 8 hotspots)
  [02] Synthesizers (12 products → 12 hotspots)
  [03] Workstations (5 products → 5 hotspots)
  [04] Portable (3 products → 3 hotspots)
```

### Step 3: User hovers over hotspot in "Synthesizers" module

```
Hotspot scales 1.0 → 1.2
Cyan glow activates, pulsing
HoverScreen appears above showing:
  - Product image
  - Price: ₪ 12,500
  - Category: Synthesizers
  - Brand: Roland
  - Model: Juno-106
  - Description: "6-voice analog synthesizer..."
```

### Step 4: User clicks hotspot

```
selectProduct(product) called
Navigation store updated
Workbench/detail view shows full product information
```

---

## 🔗 File References

- **Components**:
  - [RackModule.tsx](../src/components/smart-views/RackModule.tsx)
  - [ModularRack.tsx](../src/components/smart-views/ModularRack.tsx)
  - [UniversalCategoryView.tsx](../src/components/views/UniversalCategoryView.tsx)

- **Types**: [types/index.ts](../src/types/index.ts)
- **Store**: [store/navigationStore.ts](../src/store/navigationStore.ts)

---

## 📊 Version History

| Version | Date       | Changes                                           |
| ------- | ---------- | ------------------------------------------------- |
| 3.8.0   | 2026-01-23 | Initial modular rack system implementation        |
| -       | -          | Rack view mode, HoverScreen, hotspots, animations |

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-01-23
**Maintained By**: HSC-JIT v3.7 Development Team
