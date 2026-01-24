# Galaxy Dashboard v3.13.0 Master Documentation

**Status**: ACTIVE | **Role**: Primary Navigation Interface

The Galaxy Dashboard is the definitive entry point for the "Halilit Support Center" application. It provides a visual-first, high-density navigation experience optimized for "See Then Read" discovery.

---

## 🎨 Design Philosophy: "The Infinite Shelf"

The UI mimics a physical display shelf setup where products are:

1.  **Carved In**: Subcategory slots have depth (inset shadows) as if recessed into the category card.
2.  **Backlit**: Each slot emits a soft, ambient glow derived from the _brand's_ identity color, creating subconscious contextual recognition.
3.  **Floating**: Products (images) float within their shelves, perfectly centered and normalized, creating a clean, premium look.

---

## 📐 Layout & Grid System

### Desktop (Standard)

- **Grid**: 4 Columns × 2 Rows
- **Card Aspect**: optimized for screen fitting 16:9
- **Density**: 40 Total Subcategories visible at once

### Responsive Strategy

- **Mobile (< 640px)**: Single Column (Vertical Scroll)
- **Tablet (640px - 1024px)**: 2 Columns
- **Large Desktop (1024px+)**: 4 Columns

---

## 💡 Lighting Engine

The "Shelf Glow" is dynamic, not static. It uses the `SubcategoryDef` to identify associated brands and applies the following logic:

1.  **Source**: `frontend/src/lib/brandColors.ts` contains the hex codes for all major brands.
2.  **Mapping**: Each subcategory checks its `brands[]` array.
3.  **Resolution**: The first valid brand color is used as the ambient backlight.
4.  **Behavior**:
    - **Default**: `opacity-20` (Dim, subconscious hint)
    - **Hover**: `opacity-40`, `blur-2xl` (Active, inviting)
    - **Selected**: `opacity-30` (Stable, confirmed)

---

## 🖼️ Thumbnail Standards (Strict)

All images in `frontend/public/data/category_thumbnails/` MUST adhere to:

| Property       | Value          | Note                                         |
| -------------- | -------------- | -------------------------------------------- |
| **Format**     | WebP           | Lossy, Quality 92                            |
| **Dimensions** | 400x400px      | Square Canvas                                |
| **Background** | Transparent    | **MANDATORY**: Use AI removal (rembg)        |
| **Padding**    | 75% Fill       | Object max width/height = 300px (75% of 400) |
| **Alignment**  | Center-Center  | No bottom weighting                          |
| **Effects**    | Sharpness 1.2x | Subtle boosting for small sizes              |

**Regenaration Command**:

```bash
python3 backend/generate_flagship_thumbnails.py
```

---

## 🧩 Component Architecture

### `GalaxyDashboard.tsx`

The primary view controller.

- **State**: Connects to `useNavigationStore` for selection.
- **Render**: Maps `UNIVERSAL_CATEGORIES`.
- **Interaction**: Handles click events to trigger `selectSubcategory()`.

### `universalCategories.ts`

The configuration spine.

- Defines the 8 Main Categories (Fixed Order).
- Defines the 40 Subcategories (Fixed Order).
- Maps `brands` to subcategories for the lighting engine.

### `brandColors.ts`

The visual identity map.

- Central registry of all brand hex codes.

---

## 🚫 Forbidden Patterns

1.  **NO Text-Only Lists**: Every entry must have a visual representation.
2.  **NO White Backgrounds**: Images must be transparent to float in the shelf.
3.  **NO Alternative Dashboards**: This is the single source of truth. Delete any `GalaxyDashboard_v2`, `_Redesign`, etc.

---

**Last Verified**: January 24, 2026
**Version**: 3.13.0-MASTER
