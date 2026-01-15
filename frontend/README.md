# HSC JIT v3.4 - Frontend

Modern React + TypeScript frontend with **Studio-Grade Hardware Aesthetic** design system.

## 🎨 Design System

This project features a custom design system inspired by professional audio hardware:

- **Color Palette:** Zinc (neutral metal) + Amber (analog warmth)
- **Components:** Type-safe, accessible, with hardware-style interactions
- **Audio Feedback:** Synthesized UI sounds using Web Audio API
- **Documentation:** Comprehensive style guide and migration docs

### Design System Files

- [`DESIGN_SYSTEM_V2.md`](./DESIGN_SYSTEM_V2.md) - Complete migration guide
- [`STYLE_GUIDE.md`](./STYLE_GUIDE.md) - Visual specifications & usage
- [`DESIGN_REFINEMENT_COMPLETE.md`](./DESIGN_REFINEMENT_COMPLETE.md) - Implementation summary

### Quick Start with Design System

```tsx
import {
  BrandCard,
  StatusLED,
  Button,
  audioFeedback
} from '@/design-system';

// Hardware-style card with audio feedback
<BrandCard
  name="Moog"
  status="active"
  onClick={() => {
    audioFeedback.click(); // Automatic in BrandCard
    handleSelect();
  }}
/>

// Status indicator with LED glow
<StatusLED color="amber" size="md" pulse />
```

### Demo Component

See [`DesignSystemDemo.tsx`](./src/components/DesignSystemDemo.tsx) for interactive examples.

---

## 🚀 Tech Stack

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
