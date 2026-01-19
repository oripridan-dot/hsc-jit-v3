# HSC Mission Control v3.7 - System Guide

**Version**: 3.7.0  
**Status**: Production Ready ✅  
**Date**: January 19, 2026

---

## 🎯 Overview

Mission Control v3.7 is a production-ready product discovery and support interface for Roland synthesizers and music production equipment. Built with React, TypeScript, and Tailwind CSS.

### Key Features

- **29 Roland Products** across 5 categories (Keyboards, Synthesizers, Guitar Products, Wind Instruments, Musical Instruments)
- **Instant Client-Side Search** with Fuse.js (<50ms response)
- **Hierarchical Navigation** with dynamic category trees
- **Zero Backend Dependency** - Pure static JSON data
- **WCAG AA Compliant** - Accessible design system
- **Dynamic Brand Theming** - Automatic color adaptation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation & Run

```bash
# Install dependencies
cd frontend && pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

Application runs at `http://localhost:5173`

---

## 📁 Project Structure

```
hsc-jit-v3/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── Navigator.tsx    # Product tree navigation
│   │   │   ├── HalileoNavigator.tsx  # AI co-pilot interface
│   │   │   ├── Workbench.tsx    # Product details display
│   │   │   └── MediaBar.tsx     # Media gallery
│   │   ├── lib/                 # Core utilities
│   │   │   ├── catalogLoader.ts # Data loading & caching
│   │   │   ├── instantSearch.ts # Fuzzy search engine
│   │   │   └── schemas.ts       # Runtime validation (Zod)
│   │   ├── store/               # State management (Zustand)
│   │   ├── styles/              # Design system & themes
│   │   └── types/               # TypeScript definitions
│   └── public/data/             # Static JSON catalogs
│       ├── index.json           # Brand index (single source of truth)
│       └── roland-catalog.json  # Roland product catalog (29 products)
│
├── backend/                     # Optional backend utilities
│   └── forge_backbone.py        # Data generation scripts
│
└── .github/
    └── copilot-instructions.md  # AI development guidelines
```

---

## 🏗️ Architecture

### Data Flow

```
1. App loads → catalogLoader fetches /data/index.json
2. User selects brand → loads /data/{brand}-catalog.json
3. Products organized into hierarchy by main_category
4. instantSearch indexes products for <50ms search
5. Navigator displays tree, Workbench shows details
```

### Single Source of Truth

**Primary Data File**: `frontend/public/data/index.json`

```json
{
  "build_timestamp": "2026-01-19T23:42:00.000Z",
  "version": "3.7-Halilit",
  "total_products": 29,
  "total_verified": 29,
  "brands": [
    {
      "id": "roland",
      "name": "Roland Catalog",
      "brand_color": "#ef4444",
      "product_count": 29,
      "verified_count": 29,
      "data_file": "roland-catalog.json"
    }
  ]
}
```

### Component Architecture

- **Navigator.tsx** - Brand catalog browser with hierarchy
- **HalileoNavigator.tsx** - AI-powered product search (text mode)
- **Workbench.tsx** - Product detail view with tabs
- **MediaBar.tsx** - Image/video/audio gallery
- **catalogLoader** - Lazy loads brands on demand with caching
- **instantSearch** - Client-side Fuse.js search (<50ms)

---

## 🎨 Design System

### Color Tokens (WCAG AA Compliant)

```css
--bg-app: #0b0c0f (dark) | #f9fafb (light) --bg-panel: #15171e (dark) | #ffffff
  (light) --text-primary: #f3f4f6 (dark) | #111827 (light)
  --text-secondary: #9ca3af (dark) | #374151 (light) --halileo-primary: #6366f1
  (indigo) --border-subtle: #2d313a (dark) | #e5e7eb (light);
```

### Brand Colors

```javascript
Roland: "#ef4444" (red) - Currently active
Yamaha: "#a855f7" (purple) - Ready
Korg: "#fb923c" (orange) - Ready
Moog: "#22d3ee" (cyan) - Ready
Nord: "#f87171" (red-light) - Ready
```

---

## 📊 Data Structure

### Product Schema

```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  main_category?: string; // Primary grouping
  subcategory?: string; // Secondary grouping
  description?: string;
  short_description?: string;
  image_url?: string;
  images?: Array<{
    url: string;
    type: "main" | "gallery" | "thumbnail";
    alt_text?: string;
  }>;
  specifications?: Specification[];
  pricing?: PricingInfo;
  verified?: boolean;
}
```

### Catalog File Structure

```json
{
  "brand_identity": {
    "id": "roland",
    "name": "Roland Corporation",
    "brand_colors": {
      "primary": "#ef4444",
      "secondary": "#1f2937"
    }
  },
  "products": [
    {
      /* Product objects */
    }
  ]
}
```

---

## 🔧 Development

### Available Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm typecheck    # TypeScript validation
pnpm test         # Run tests
```

### Adding a New Brand

1. Create catalog: `frontend/public/data/{brand}-catalog.json`
2. Update index: Add brand entry to `index.json`
3. Add brand colors to `styles/brandThemes.ts`
4. Test with catalogLoader

### Tech Stack

| Purpose    | Technology    | Version |
| ---------- | ------------- | ------- |
| Frontend   | React         | 19.2    |
| Language   | TypeScript    | 5.9     |
| Build      | Vite          | 7.3.1   |
| State      | Zustand       | 5.0.9   |
| Styling    | Tailwind CSS  | 3.4     |
| Search     | Fuse.js       | 7.1     |
| Animation  | Framer Motion | 12.1    |
| Validation | Zod           | 3.24    |

---

## 🧪 Testing

Test files located in `frontend/tests/`:

- `unit/` - Component & utility tests
- `integration/` - Data flow tests
- `e2e/` - End-to-end scenarios
- `performance/` - Latency benchmarks

```bash
pnpm test         # Run all tests
pnpm test:ui      # Visual test runner
pnpm test:coverage # Coverage report
```

---

## 🚨 Troubleshooting

### Data Not Loading

```bash
# Verify data files exist
ls -la frontend/public/data/*.json

# Check console for errors
# Look for 404s or validation failures
```

### Search Not Working

```typescript
// Ensure catalogLoader initialized
await instantSearch.initialize();

// Check product count
const products = await catalogLoader.loadAllProducts();
console.log(products.length); // Should be 29
```

### Port Already in Use

```bash
# Find process
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different port
VITE_PORT=5174 pnpm dev
```

---

## 📈 Performance Metrics

| Metric          | Target | Current  |
| --------------- | ------ | -------- |
| Initial Load    | <2s    | ~1.5s    |
| Search Response | <50ms  | ~20-40ms |
| Category Switch | <100ms | ~50ms    |
| Memory Usage    | <100MB | ~75MB    |

---

## 🔐 Production Deployment

### Build

```bash
cd frontend
pnpm build
# Output: frontend/dist/
```

### Serve

```bash
# Option 1: Simple HTTP server
npx serve -s dist

# Option 2: Upload to CDN/S3
aws s3 sync dist/ s3://your-bucket/

# Option 3: Netlify/Vercel
# Just connect git repo
```

### Environment Variables

```bash
# Optional - Backend API (if used)
VITE_API_URL=https://api.example.com
```

---

## 📞 Support & Documentation

- **Main README**: `/README.md`
- **GitHub Copilot Instructions**: `/.github/copilot-instructions.md`
- **This Guide**: `/SYSTEM_GUIDE.md`

### Key Files

- **index.json** - Brand catalog index (single source of truth)
- **catalogLoader.ts** - Data loading with caching
- **instantSearch.ts** - Client-side search
- **Navigator.tsx** - Main navigation component
- **schemas.ts** - Runtime validation rules

---

## 🎉 Credits

**Developer**: Ori Pridan  
**Organization**: Halilit Music  
**License**: Proprietary - All rights reserved

---

**Last Updated**: January 19, 2026  
**Version**: 3.7.0  
**Status**: ✅ Production Ready
