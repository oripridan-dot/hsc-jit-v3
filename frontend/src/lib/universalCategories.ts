/**
 * Universal Categories - Real Product Thumbnails
 *
 * All subcategory images are REAL product thumbnails processed through VisualFactory.
 * Images are WebP format, 400x400, with transparent backgrounds.
 *
 * REFACTOR NOTE (v3.13.0):
 * This file now derives "The 8 Categories" from `categoryConsolidator.ts`
 * to ensure a Single Source of Truth for ID, Label, Color, and Sort Order.
 * It strictly adds the UI-specific layer (Thumbnails, Icons, Subcategories).
 */

import type { Product } from "../types";
import {
  type ConsolidatedCategory,
  CONSOLIDATED_CATEGORIES,
  productMatchesConsolidatedCategory,
} from "./categoryConsolidator";

export interface SubcategoryDef {
  id: string;
  label: string;
  image: string;
  brands?: string[];
}

export interface UniversalCategoryDef extends Omit<
  ConsolidatedCategory,
  "icon"
> {
  // We override 'icon' with 'iconName' for Lucide compatibility
  // The original 'icon' (emoji) is ignored here or could be used as fallback
  iconName: string;
  subcategories: SubcategoryDef[];
}

// Map of purely UI definitions (Subcategories + Images + Icon Names)
const UI_DEFINITIONS: Record<
  string,
  { iconName: string; subcategories: SubcategoryDef[] }
> = {
  keys: {
    iconName: "Piano",
    subcategories: [
      {
        id: "synths",
        label: "Synthesizers",
        image: "/data/category_thumbnails/keys-synths_thumb.webp",
        brands: ["nord", "moog", "roland"],
      },
      {
        id: "stage-pianos",
        label: "Stage Pianos",
        image: "/data/category_thumbnails/keys-stage-pianos_thumb.webp",
        brands: ["nord", "roland"],
      },
      {
        id: "controllers",
        label: "MIDI Controllers",
        image: "/data/category_thumbnails/keys-controllers_thumb.webp",
        brands: ["roland", "akai-professional"],
      },
      {
        id: "arrangers",
        label: "Arrangers",
        image: "/data/category_thumbnails/keys-arrangers_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "organs",
        label: "Organs",
        image: "/data/category_thumbnails/keys-organs_thumb.webp",
        brands: ["nord"],
      },
      {
        id: "workstations",
        label: "Workstations",
        image: "/data/category_thumbnails/keys-workstations_thumb.webp",
        brands: ["roland"],
      },
    ],
  },
  drums: {
    iconName: "Music",
    subcategories: [
      {
        id: "electronic-drums",
        label: "Electronic Drum Kits",
        image: "/data/category_thumbnails/drums-electronic-drums_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "acoustic-drums",
        label: "Acoustic Drums",
        image: "/data/category_thumbnails/drums-acoustic-drums_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "cymbals",
        label: "Cymbals",
        image: "/data/category_thumbnails/drums-cymbals_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "percussion",
        label: "Percussion",
        image: "/data/category_thumbnails/drums-percussion_thumb.webp",
        brands: ["roland", "nord"],
      },
      {
        id: "drum-machines",
        label: "Drum Machines",
        image: "/data/category_thumbnails/drums-drum-machines_thumb.webp",
        brands: ["roland", "akai-professional"],
      },
      {
        id: "pads",
        label: "Drum Pads",
        image: "/data/category_thumbnails/drums-pads_thumb.webp",
        brands: ["akai-professional"],
      },
    ],
  },
  guitars: {
    iconName: "Zap",
    subcategories: [
      {
        id: "electric-guitars",
        label: "Electric Guitars",
        image: "/data/category_thumbnails/guitars-electric-guitars_thumb.webp",
        brands: ["boss"],
      },
      {
        id: "bass-guitars",
        label: "Bass Guitars",
        image: "/data/category_thumbnails/guitars-bass-guitars_thumb.webp",
        brands: ["boss"],
      },
      {
        id: "amplifiers",
        label: "Amplifiers",
        image: "/data/category_thumbnails/guitars-amplifiers_thumb.webp",
        brands: ["boss"],
      },
      {
        id: "effects",
        label: "Effects Pedals",
        image: "/data/category_thumbnails/guitars-effects-pedals_thumb.webp",
        brands: ["boss"],
      },
      {
        id: "multi-effects",
        label: "Multi-Effects",
        image: "/data/category_thumbnails/guitars-multi-effects_thumb.webp",
        brands: ["boss"],
      },
      {
        id: "accessories",
        label: "Accessories",
        image: "/data/category_thumbnails/guitars-accessories_thumb.webp",
        brands: ["boss"],
      },
    ],
  },
  studio: {
    iconName: "Mic2",
    subcategories: [
      {
        id: "interfaces",
        label: "Audio Interfaces",
        image: "/data/category_thumbnails/studio-audio-interfaces_thumb.webp",
        brands: ["universal-audio"],
      },
      {
        id: "monitors",
        label: "Studio Monitors",
        image: "/data/category_thumbnails/studio-studio-monitors_thumb.webp",
        brands: ["adam-audio", "mackie"],
      },
      {
        id: "microphones",
        label: "Microphones",
        image: "/data/category_thumbnails/studio-microphones_thumb.webp",
        brands: ["warm-audio"],
      },
      {
        id: "outboard",
        label: "Outboard Gear",
        image: "/data/category_thumbnails/studio-outboard-gear_thumb.webp",
        brands: ["warm-audio"],
      },
      {
        id: "preamps",
        label: "Preamps",
        image: "/data/category_thumbnails/studio-preamps_thumb.webp",
        brands: ["warm-audio"],
      },
      {
        id: "software",
        label: "Software",
        image: "/data/category_thumbnails/studio-software_thumb.webp",
        brands: ["universal-audio"],
      },
    ],
  },
  live: {
    iconName: "Speaker",
    subcategories: [
      {
        id: "pa-speakers",
        label: "PA Speakers",
        image: "/data/category_thumbnails/live-pa-speakers_thumb.webp",
        brands: ["mackie"],
      },
      {
        id: "mixers",
        label: "Mixers",
        image: "/data/category_thumbnails/live-mixers_thumb.webp",
        brands: ["mackie"],
      },
      {
        id: "powered-mixers",
        label: "Powered Mixers",
        image: "/data/category_thumbnails/live-mixers_thumb.webp",
        brands: ["mackie"],
      },
      {
        id: "wireless",
        label: "Wireless Systems",
        image: "/data/category_thumbnails/live-wireless-systems_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "iem",
        label: "In-Ear Monitoring",
        image: "/data/category_thumbnails/live-in-ear-monitoring_thumb.webp",
        brands: ["mackie"],
      },
      {
        id: "stage-boxes",
        label: "Stage Boxes",
        image: "/data/category_thumbnails/live-stage-boxes_thumb.webp",
        brands: ["roland"],
      },
    ],
  },
  dj: {
    iconName: "Disc3",
    subcategories: [
      {
        id: "controllers",
        label: "DJ Controllers",
        image: "/data/category_thumbnails/dj-samplers_thumb.webp",
        brands: ["akai-professional"],
      },
      {
        id: "grooveboxes",
        label: "Grooveboxes",
        image: "/data/category_thumbnails/dj-grooveboxes_thumb.webp",
        brands: ["roland", "teenage-engineering"],
      },
      {
        id: "samplers",
        label: "Samplers",
        image: "/data/category_thumbnails/dj-samplers_thumb.webp",
        brands: ["akai-professional"],
      },
      {
        id: "headphones",
        label: "DJ Headphones",
        image: "/data/category_thumbnails/dj-dj-headphones_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "production",
        label: "Production",
        image: "/data/category_thumbnails/dj-production_thumb.webp",
        brands: ["teenage-engineering"],
      },
      {
        id: "accessories",
        label: "Accessories",
        image: "/data/category_thumbnails/dj-accessories_thumb.webp",
        brands: ["teenage-engineering"],
      },
    ],
  },
  software: {
    iconName: "Cloud",
    subcategories: [
      {
        id: "plugins",
        label: "Plugins",
        image: "/data/category_thumbnails/software-plugins_thumb.webp",
        brands: ["universal-audio", "roland"],
      },
      {
        id: "daw",
        label: "DAW Software",
        image: "/data/category_thumbnails/software-daw_thumb.webp",
        brands: ["universal-audio"],
      },
      {
        id: "sound-libraries",
        label: "Sound Libraries",
        image: "/data/category_thumbnails/software-sound-libraries_thumb.webp",
        brands: ["roland"],
      },
    ],
  },
  accessories: {
    iconName: "Wrench",
    subcategories: [
      {
        id: "cables",
        label: "Cables",
        image: "/data/category_thumbnails/accessories-cables_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "stands",
        label: "Stands",
        image: "/data/category_thumbnails/accessories-stands_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "cases",
        label: "Cases & Bags",
        image: "/data/category_thumbnails/accessories-cases_thumb.webp",
        brands: ["roland"],
      },
      {
        id: "pedals",
        label: "Pedals & Footswitches",
        image: "/data/category_thumbnails/accessories-pedals_thumb.webp",
        brands: ["roland", "boss"],
      },
      {
        id: "power",
        label: "Power Supplies",
        image: "/data/category_thumbnails/accessories-power_thumb.webp",
        brands: ["boss"],
      },
    ],
  },
};

/**
 * The "Universal 8" - Generated from Single Source of Truth
 */
export const UNIVERSAL_CATEGORIES: UniversalCategoryDef[] =
  CONSOLIDATED_CATEGORIES.map((cat) => {
    const ui = UI_DEFINITIONS[cat.id] || {
      iconName: "HelpCircle",
      subcategories: [],
    };
    return {
      ...cat, // Inherit id, label, color, description, sortOrder
      iconName: ui.iconName, // Override/Add iconName
      subcategories: ui.subcategories,
    };
  });

export function getCategoryById(id: string): UniversalCategoryDef | undefined {
  return UNIVERSAL_CATEGORIES.find((cat) => cat.id === id);
}

export function getSubcategories(categoryId: string): SubcategoryDef[] {
  const category = getCategoryById(categoryId);
  return category?.subcategories || [];
}

/**
 * Filter products by consolidated category
 * USES: categoryConsolidator.ts logic (Single Source of Truth)
 */
export function filterByCategory(
  products: Product[],
  categoryId: string,
): Product[] {
  if (!categoryId || categoryId === "all") {
    return products;
  }

  return products.filter((p) =>
    productMatchesConsolidatedCategory(p, categoryId),
  );
}
