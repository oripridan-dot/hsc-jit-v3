# Development Guide

Complete guide for developing and extending Halilit Support Center v3.7.

## Environment Setup

### Prerequisites
```bash
Node.js >= 18.0.0
pnpm >= 8.0.0  (or npm >= 9.0.0)
Git >= 2.30.0
```

### Installation
```bash
# Clone repository
git clone https://github.com/oripridan-dot/hsc-jit-v3.git
cd hsc-jit-v3/frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Server runs at `http://localhost:5175` (or next available port)

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── App.tsx          # Main app wrapper
│   │   ├── HalileoNavigator.tsx
│   │   ├── Navigator.tsx
│   │   ├── Workbench.tsx
│   │   ├── MediaBar.tsx
│   │   ├── MediaViewer.tsx
│   │   └── SystemHealthBadge.tsx
│   │
│   ├── lib/                 # Utilities
│   │   ├── catalogLoader.ts     # Load product JSON
│   │   └── instantSearch.ts     # Fuse.js wrapper
│   │
│   ├── store/               # State management (Zustand)
│   │   ├── navigationStore.ts
│   │   └── useWebSocketStore.ts
│   │
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   │
│   ├── services/            # API & external services
│   │   └── websocket.ts
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useBrandTheme.ts
│   │   └── useHalileoTheme.ts
│   │
│   ├── styles/              # Global styles
│   │   ├── tokens.css
│   │   └── brandThemes.ts
│   │
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
│
├── public/
│   └── data/
│       ├── index.json
│       └── catalogs_brand/
│           └── roland_catalog.json
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── performance/
│
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── README.md
```

## Code Style & Standards

### TypeScript
```typescript
// Always use explicit types
interface Product {
  id: string;
  name: string;
  main_category: string;
  description?: string;
  images?: string[];
}

// Use type safety
const product: Product = loadProduct(id);
```

### React Components
```typescript
// Use functional components with hooks
interface ComponentProps {
  product: Product;
  onSelect?: (id: string) => void;
}

export const MyComponent: React.FC<ComponentProps> = ({
  product,
  onSelect
}) => {
  // Component logic
  return <div>{product.name}</div>;
};
```

### Styling
```typescript
// Use Tailwind CSS + CSS variables
<div className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
  Content
</div>

// For brand-specific colors
<div className="bg-[#ef4444]">Roland Red</div>
```

## Development Workflow

### 1. Starting Development
```bash
cd frontend
pnpm dev
```

### 2. Making Changes
```bash
# Edit files in src/
# Hot reload happens automatically
# TypeScript errors shown in terminal
```

### 3. Type Checking
```bash
# Check for TypeScript errors
pnpm typecheck
# or
npx tsc --noEmit
```

### 4. Linting & Formatting
```bash
# Run ESLint
pnpm lint

# Fix formatting
pnpm format
```

### 5. Building
```bash
# Build for production
pnpm build

# Preview build
pnpm preview
```

### 6. Testing
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test catalogLoader.test.ts

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

## Common Development Tasks

### Adding a New Component
```typescript
// 1. Create file: src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  // Define props
}

export const MyComponent: React.FC<MyComponentProps> = (props) => {
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};

// 2. Export from App.tsx
import { MyComponent } from './components/MyComponent';

export function App() {
  return <MyComponent />;
}

// 3. Add tests: tests/unit/MyComponent.test.ts
```

### Adding a New Route/View
```typescript
// Update navigationStore with new "level"
// Create corresponding component
// Add to navigator tree
```

### Updating Product Data
```typescript
// 1. Edit: frontend/public/data/catalogs_brand/roland_catalog.json
// 2. Restart dev server
// 3. Test with: pnpm dev
```

### Styling a Component
```typescript
// Option 1: Tailwind classes
<div className="p-4 bg-slate-900 rounded-lg">

// Option 2: CSS variables (theme-aware)
<div className="bg-[var(--bg-panel)] text-[var(--text-primary)]">

// Option 3: Inline styles
<div style={{ background: 'var(--bg-panel)' }}>
```

### Adding State
```typescript
// 1. Update navigationStore in src/store/navigationStore.ts
import { create } from 'zustand';

interface NavigationState {
  myValue: string;
  setMyValue: (value: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  myValue: '',
  setMyValue: (value) => set({ myValue: value }),
}));

// 2. Use in component
import { useNavigationStore } from '../store/navigationStore';

export const MyComponent = () => {
  const { myValue, setMyValue } = useNavigationStore();
  return <button onClick={() => setMyValue('new')}>{myValue}</button>;
};
```

## Performance Optimization

### Bundle Size
```bash
# Analyze bundle
pnpm build
# Check dist/ folder sizes
```

### Code Splitting
```typescript
// Use React.lazy() for large components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Wrap with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>
```

### Search Performance
- Fuse.js is pre-configured for <50ms queries
- For 1000+ products, consider pagination
- Index only essential fields

### Image Optimization
- Use WebP format (auto-fallback in MediaBar)
- Lazy load images
- Use `loading="lazy"` attribute
- Consider CDN for production

## Testing Guidelines

### Unit Tests
```typescript
// Test pure functions and hooks
describe('catalogLoader', () => {
  it('should load brand catalog', async () => {
    const data = await catalogLoader.loadBrand('roland');
    expect(data.products).toHaveLength(29);
  });
});
```

### Component Tests
```typescript
// Test component rendering and interactions
import { render, screen } from '@testing-library/react';
import { Navigator } from './Navigator';

describe('Navigator', () => {
  it('should render product tree', () => {
    render(<Navigator />);
    expect(screen.getByText('Analog Synthesizers')).toBeInTheDocument();
  });
});
```

### E2E Tests
```typescript
// Test complete user flows
test('user can search and select product', async () => {
  await page.goto('http://localhost:5175');
  await page.fill('[placeholder="Search..."]', 'TR-808');
  await page.click('button:has-text("TR-808")');
  expect(await page.textContent()).toContain('specifications');
});
```

## Debugging

### Console Logging
```typescript
console.log('Debug:', variable);
console.error('Error:', error);
console.table(dataArray);
```

### React DevTools
1. Install React DevTools browser extension
2. Open DevTools (F12)
3. Navigate to "Components" tab
4. Inspect component props and state

### Network Debugging
1. Open DevTools → Network tab
2. Monitor JSON fetch requests
3. Check response payloads
4. Verify Content-Type headers

### Performance Profiling
1. Open DevTools → Performance tab
2. Click record
3. Interact with app
4. Click stop
5. Analyze flamechart

## Git Workflow

### Branches
- `main` - Production-ready code
- `v3.7-dev` - Development branch
- Feature branches: `feature/description`
- Bug fixes: `fix/issue-number`

### Commits
```bash
# Type-based commit messages
git commit -m "feat: Add voice search integration"
git commit -m "fix: Product selection not updating MediaBar"
git commit -m "docs: Update architecture guide"
git commit -m "chore: Update dependencies"
```

### Pull Requests
1. Create feature branch from v3.7-dev
2. Make changes with meaningful commits
3. Push and create PR
4. Add description and test details
5. Request review
6. Merge after approval

## Troubleshooting

### Port Already in Use
```bash
# Find process on 5175
lsof -i :5175

# Kill process
kill -9 <PID>

# Or use different port
VITE_PORT=5176 pnpm dev
```

### Module Not Found Error
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### TypeScript Errors
```bash
# Check all files
npx tsc --noEmit

# Fix auto-fixable errors
npx tsc --noEmit --pretty false | head -20
```

### Build Fails
```bash
# Clean and rebuild
pnpm clean  # if defined
rm -rf dist
pnpm build

# Check for syntax errors
pnpm typecheck
```

## Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Fuse.js](https://fusejs.io)

---

**Last Updated**: January 19, 2026  
**Version**: 3.7 Mission Control  
**Status**: Production Ready
