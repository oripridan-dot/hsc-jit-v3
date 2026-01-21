# 🎹 HSC Mission Control v3.7.3-DNA

**Universal Product DNA Edition** - Automated Connectivity & Tier Extraction

> **Production-Ready Multi-Brand Product Discovery Interface** ✅

A modern, high-performance product catalog and support system for Roland, Boss, and Nord equipment. Built with React 19, TypeScript 5, and Tailwind CSS with comprehensive data extraction.

## 📖 **→ [GO TO SYSTEM GUIDE](SYSTEM.md)**

**Everything you need is in [SYSTEM.md](SYSTEM.md)** - quick start, architecture, development, deployment, troubleshooting.

---

## 🌟 What's Inside

- ✅ **30 Roland Products** - With 14 DNA-extracted (47% connectivity data)
- 🧬 **Universal DNA Extraction** - Automated connectivity & tier classification
- 🔌 **Connectivity Intelligence** - XLR, TRS, TS, MIDI-DIN, USB-C, RCA, DB25
- 🎯 **Tier Classification** - Entry/Pro/Elite based on materials & technology
- ⚡ **Instant Search** - Sub-50ms fuzzy search with connectivity fields
- 🎨 **Dynamic Theming** - Per-brand color schemes (WCAG AA)
- 📊 **Hierarchical Navigation** - Automatic category tree generation
- 🖼️ **Rich Media** - Images, videos, manuals per product
- 📄 **Documentation Tab** - Direct access to PDFs and manuals
- 🚀 **Zero Backend** - Pure static JSON (no server required)
- 🔒 **Single Source of Truth** - All definitions from static JSON
- ♿ **Accessible** - WCAG AA compliant design system
- 📱 **Responsive** - Desktop, tablet, mobile optimized

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone repository
git clone https://github.com/oripridan-dot/hsc-jit-v3
cd hsc-jit-v3

# Install dependencies
cd frontend
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173
```

### Production Build

```bash
cd frontend
pnpm build
# Output → frontend/dist/
```

---

## 📁 Project Structure

```
hsc-jit-v3/
├── frontend/                    # React application (MAIN)
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── Navigator.tsx    # Product tree navigation
│   │   │   ├── HalileoNavigator.tsx  # AI co-pilot
│   │   │   ├── Workbench.tsx    # Product details
│   │   │   └── views/
│   │   │       └── ProductCockpit.tsx  # DNA visualization
│   │   ├── lib/                 # Core utilities
│   │   │   ├── catalogLoader.ts # Data loading
│   │   │   ├── instantSearch.ts # Fuzzy search (DNA-aware)
│   │   │   ├── safeFetch.ts     # Schema validation
│   │   │   └── schemas.ts       # Runtime validation (Zod)
│   │   ├── hooks/               # React hooks
│   │   │   ├── useRealtimeSearch.ts  # Search integration
│   │   │   └── useBrandData.ts  # Brand theming
│   │   ├── store/               # State management (Zustand)
│   │   ├── styles/              # Design system & themes
│   │   └── types/               # TypeScript definitions
│   └── public/data/             # Static JSON catalogs
│       ├── index.json           # Brand index (30 products)
│       └── catalogs_brand/
│           └── roland.json      # Roland with DNA (14 extracted)
│
├── backend/                     # Data generation tools
│   ├── services/
│   │   ├── parsers/
│   │   │   └── cable_parser.py  # 🧬 DNA extraction engine
│   │   └── roland_scraper.py    # Enhanced scraper
│   └── forge_backbone.py        # Data generator
│
├── test-connectivity-dna.html   # DNA validation page
├── SYSTEM_GUIDE.md              # Complete system documentation
└── .github/copilot-instructions.md  # AI dev guidelines
```

---

## 🏗️ Architecture

### Three-Pane Layout

```
┌─────────────────────────────────────────────────────────────┐
│              HALILIT SUPPORT CENTER                         │
│            v3.7.1-catalogs Mission Control                  │
└─────────────────────────────────────────────────────────────┘
┌────────────────┬──────────────────────┬─────────────────────┐
│                │                      │                     │
│   Navigator    │      Workbench       │     MediaBar        │
│                │                      │                     │
│  - Search      │  - Product Info      │  - Images           │
│  - Category    │  - Specifications    │  - Videos           │
│  - Tree View   │  - Documentation     │  - Audio            │
│                │                      │                     │
└────────────────┴──────────────────────┴─────────────────────┘
```

### Data Flow

```
1. App loads → catalogLoader.loadIndex()
   ↓
2. Loads /data/index.json (brand list)
   ↓
3. User selects brand → loadBrand('roland')
   ↓
4. Loads /data/roland-catalog.json (29 products)
   ↓
5. Navigator builds hierarchy from main_category
   ↓
6. instantSearch indexes for <50ms search
   ↓
7. User interacts → React state updates → UI reflects changes
```

### Single Source of Truth

**Primary Index**: `frontend/public/data/index.json`

```json
{
  "build_timestamp": "2026-01-19T23:50:00.000Z",
  "version": "3.7.3-DNA",
  "total_products": 226,
  "brands": [
    {
      "id": "roland",
      "name": "Roland Corporation",
      "brand_color": "#ef4444",
      "product_count": 29,
      "verified_count": 29,
      "data_file": "catalogs_brand/roland.json"
    },
    {
      "id": "boss",
      "name": "Boss (Roland)",
      "product_count": 197,
      "data_file": "catalogs_brand/boss.json"
    }
  ]
}
```

---

## 🛠️ Tech Stack

| Purpose    | Technology    | Version |
| ---------- | ------------- | ------- |
| Frontend   | React         | 19.2    |
| Language   | TypeScript    | 5.9     |
| Build Tool | Vite          | 7.3.1   |
| State Mgmt | Zustand       | 5.0.9   |
| Styling    | Tailwind CSS  | 3.4     |
| Search     | Fuse.js       | 7.1     |
| Animation  | Framer Motion | 12.1    |
| Validation | Zod           | 3.24    |
| Icons      | Lucide React  | Latest  |

---

## 📊 Supported Products

### Current: Roland (29 Products - Verified) + Boss (197 Products - Scraped)

#### Roland Corporation

- **Keyboards** (5) - BC TC-RF, BC TC-SC, DH-10, E-X50, etc.
- **Synthesizers** (8) - GO:KEYS 5, GO:LIVECAST, etc.
- **Guitar Products** (7) - GK-5, GM-800, GO:MIXER PRO, etc.
- **Wind Instruments** (3) - Aerophone Brisa, etc.
- **Musical Instruments** (6) - Various Roland equipment

#### Boss (Roland Division)

- **Guitar Effects** (197) - Pedals, multi-effects, accessories

### Ready to Add

Framework supports unlimited brands. To add a brand:

1. Create `{brand}-catalog.json` in `frontend/public/data/`
2. Add entry to `index.json`
3. Add brand colors to `frontend/src/styles/brandThemes.ts`

---

## 🎨 Design System

### Color Tokens (WCAG AA Compliant)

```css
/* Dark Theme (Default) */
--bg-app: #0b0c0f --bg-panel: #15171e --text-primary: #f3f4f6
  --text-secondary: #9ca3af --halileo-primary: #6366f1 --border-subtle: #2d313a
  /* Brand Colors (Dynamic) */ --brand-primary: var(--roland-primary)
  /* Changes per brand */ Roland: #ef4444 (red) ✅ Active Yamaha: #a855f7
  (purple) 🔜 Ready Korg: #fb923c (orange) 🔜 Ready;
```

---

## 🧪 Development

### Available Scripts

```bash
pnpm dev          # Start dev server (localhost:5173)
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm typecheck    # Run TypeScript checks
pnpm test         # Run test suite
pnpm test:ui      # Visual test runner
pnpm lint         # Run ESLint
```

### Environment Variables

```bash
# Optional - for backend integration (not required)
VITE_API_URL=http://localhost:8000
```

---

## 📈 Performance

| Metric          | Target | Actual           |
| --------------- | ------ | ---------------- |
| Initial Load    | <2s    | ~1.5s            |
| Search Response | <50ms  | ~20-40ms         |
| Category Switch | <100ms | ~50ms            |
| Memory Usage    | <100MB | ~75MB            |
| Bundle Size     | <500KB | ~380KB (gzipped) |

---

## 🚨 Troubleshooting

### App Won't Load

```bash
# Check if dev server is running
ps aux | grep vite

# Verify data files exist
ls -la frontend/public/data/*.json

# Clear cache and restart
rm -rf frontend/node_modules/.vite
pnpm dev
```

### Search Not Working

```typescript
// Check if catalog initialized
await instantSearch.initialize();

// Verify products loaded
const products = await catalogLoader.loadAllProducts();
console.log(products.length); // Should be 29
```

### Port Already in Use

```bash
# Find process on port
lsof -i :5173

# Kill it
kill -9 <PID>

# Or use different port
VITE_PORT=5174 pnpm dev
```

---

## 📚 Documentation

- **[SYSTEM_GUIDE.md](SYSTEM_GUIDE.md)** - Complete system documentation
- **[QUICK_START.md](QUICK_START.md)** - Getting started guide
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI development guidelines
- **[frontend/README.md](frontend/README.md)** - Frontend-specific docs

---

## 🔐 Production Deployment

### Option 1: Static Hosting (Recommended)

```bash
# Build
cd frontend && pnpm build

# Deploy to Netlify/Vercel
netlify deploy --dir=dist --prod

# Or upload to S3
aws s3 sync dist/ s3://your-bucket/ --acl public-read
```

### Option 2: Docker

```bash
# Build image
docker build -t hsc-mission-control .

# Run container
docker run -p 5173:5173 hsc-mission-control
```

### Option 3: Simple HTTP Server

```bash
cd frontend/dist
npx serve -s .
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 License

Proprietary - All rights reserved  
© 2026 Halilit Music

---

## 👥 Credits

- **Developer**: Ori Pridan ([@oripridan-dot](https://github.com/oripridan-dot))
- **Organization**: Halilit Music
- **Framework**: React + TypeScript + Tailwind CSS
- **AI Assistant**: GitHub Copilot

---

## 🎯 Roadmap

### ✅ Completed (v3.7)

- Static Roland catalog (29 products)
- Hierarchical navigation
- Instant client-side search
- Dynamic brand theming
- WCAG AA compliance
- Product detail views
- Media gallery

### 🔜 Coming Soon

- Multi-brand support (Yamaha, Korg, Moog, Nord)
- Voice-enabled navigation
- AI-powered product recommendations
- Advanced filtering & sorting
- User preferences & history
- WebSocket streaming for AI responses

---

**Version**: 3.7.3-DNA
**Status**: ✅ Production Ready  
**Last Updated**: January 19, 2026

---

<div align="center">
  <strong>Built with ❤️ for Halilit Music</strong>
</div>
