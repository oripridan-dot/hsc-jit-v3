/**
 * Universal Categories - The "Musician Mindset" Taxonomy
 *
 * Defines the 10 "Halilit Categories" that organize instruments by function
 * instead of brand. Reduces cognitive load by grouping similar instruments together.
 *
 * Architecture: Translator between complex backend data and simple frontend buttons
 */

import type { Product } from "../types";

export interface SubcategoryDef {
  id: string;
  label: string;
  image: string;
}

export interface UniversalCategoryDef {
  id: string;
  label: string;
  iconName: string; // Maps to Lucide icon names dynamically
  description: string;
  subcategories: SubcategoryDef[];
  color: string; // Cognitive color anchor for each category
}

/**
 * The "Universal 10" - Core instrument categories organized by musician perspective
 */
export const UNIVERSAL_CATEGORIES: UniversalCategoryDef[] = [
  {
    id: "keys",
    label: "Keys & Pianos",
    iconName: "Piano",
    description: "Synths, Stage Pianos, Controllers",
    subcategories: [
      {
        id: "synths",
        label: "Synthesizers",
        image: "/data/product_images/nord/nord-nord-lead-a1_thumb.webp",
      },
      {
        id: "stage-pianos",
        label: "Stage Pianos",
        image: "/data/product_images/nord/nord-nord-electro-7_thumb.webp",
      },
      {
        id: "controllers",
        label: "MIDI Controllers",
        image: "/data/product_images/roland/roland-a-88mk2_thumb.webp",
      },
      {
        id: "arrangers",
        label: "Arrangers",
        image: "/data/product_images/roland/roland-e-x50_thumb.webp",
      },
      {
        id: "organs",
        label: "Organs",
        image: "/data/product_images/nord/nord-prod-2_thumb.webp",
      },
    ],
    color: "#f59e0b", // Amber
  },
  {
    id: "drums",
    label: "Drums & Percussion",
    iconName: "Music",
    description: "V-Drums, Acoustic, Cymbals",
    subcategories: [
      {
        id: "electronic-drums",
        label: "Electronic Drum Kits",
        image: "/data/product_images/roland/roland-prod-1_thumb.webp",
      },
      {
        id: "acoustic-drums",
        label: "Acoustic Drums",
        image: "/data/product_images/roland/roland-prod-2_thumb.webp",
      },
      {
        id: "cymbals",
        label: "Cymbals",
        image: "/data/product_images/nord/nord-nord-drum-3p_thumb.webp",
      },
      {
        id: "percussion",
        label: "Percussion",
        image: "/data/product_images/nord/nord-nord-drum-3p_thumb.webp",
      },
      {
        id: "drum-machines",
        label: "Drum Machines",
        image: "/data/product_images/roland/roland-prod-5_thumb.webp",
      },
    ],
    color: "#ef4444", // Red
  },
  {
    id: "guitars",
    label: "Guitars & Amps",
    iconName: "Zap",
    description: "Pedals, Amps, Effects",
    subcategories: [
      {
        id: "electric-guitars",
        label: "Electric Guitars",
        image: "/data/product_images/boss/boss-eurus_gs-1_thumb.webp",
      },
      {
        id: "bass-guitars",
        label: "Bass Guitars",
        image: "/data/product_images/boss/boss-prod-3_thumb.webp",
      },
      {
        id: "amplifiers",
        label: "Amplifiers",
        image: "/data/product_images/boss/boss-prod-1_thumb.webp",
      },
      {
        id: "effects",
        label: "Effects Pedals",
        image: "/data/product_images/boss/boss-gx-10_thumb.webp",
      },
      {
        id: "accessories",
        label: "Accessories",
        image: "/data/product_images/boss/boss-prod-5_thumb.webp",
      },
    ],
    color: "#3b82f6", // Blue
  },
  {
    id: "studio",
    label: "Studio & Recording",
    iconName: "Mic2",
    description: "Monitors, Interfaces, Mics",
    subcategories: [
      {
        id: "interfaces",
        label: "Audio Interfaces",
        image:
          "/data/product_images/universal-audio/universal-audio-prod-1_thumb.webp",
      },
      {
        id: "monitors",
        label: "Studio Monitors",
        image: "/data/product_images/adam-audio/adam-audio-prod-1_thumb.webp",
      },
      {
        id: "microphones",
        label: "Microphones",
        image: "/data/product_images/warm-audio/warm-audio-prod-1_thumb.webp",
      },
      {
        id: "outboard",
        label: "Outboard Gear",
        image: "/data/product_images/focusrite/focusrite-prod-3_thumb.webp",
      },
      {
        id: "software",
        label: "Software",
        image:
          "/data/product_images/universal-audio/universal-audio-prod-5_thumb.webp",
      },
    ],
    color: "#10b981", // Emerald
  },
  {
    id: "live",
    label: "Live Sound",
    iconName: "Speaker",
    description: "PA Systems, Mixers, Subwoofers",
    subcategories: [
      {
        id: "pa-speakers",
        label: "PA Speakers",
        image: "/data/product_images/mackie/mackie-prod-1_thumb.webp",
      },
      {
        id: "mixers",
        label: "Mixers",
        image: "/data/product_images/mackie/mackie-prod-2_thumb.webp",
      },
      {
        id: "wireless",
        label: "Wireless Systems",
        image: "/data/product_images/roland/roland-prod-4_thumb.webp",
      },
      {
        id: "iem",
        label: "In-Ear Monitoring",
        image: "/data/product_images/mackie/mackie-prod-5_thumb.webp",
      },
      {
        id: "stage-boxes",
        label: "Stage Boxes",
        image: "/data/product_images/roland/roland-bridge_cast_thumb.webp",
      },
    ],
    color: "#8b5cf6", // Violet
  },
  {
    id: "dj",
    label: "DJ & Production",
    iconName: "Disc3",
    description: "Controllers, Turntables",
    subcategories: [
      {
        id: "controllers",
        label: "DJ Controllers",
        image: "/data/product_images/roland/roland-gokeys_3_thumb.webp",
      },
      {
        id: "grooveboxes",
        label: "Grooveboxes",
        image: "/data/product_images/roland/roland-cb-404_thumb.webp",
      },
      {
        id: "headphones",
        label: "DJ Headphones",
        image: "/data/product_images/roland/roland-rh-5_thumb.webp",
      },
      {
        id: "production",
        label: "Production",
        image:
          "/data/product_images/teenage-engineering/teenage-engineering-prod-1_thumb.webp",
      },
      {
        id: "accessories",
        label: "Accessories",
        image:
          "/data/product_images/teenage-engineering/teenage-engineering-prod-3_thumb.webp",
      },
    ],
    color: "#ec4899", // Pink
  },
  {
    id: "headphones",
    label: "Headphones",
    iconName: "Headphones",
    description: "Studio, DJ, Consumer",
    subcategories: [
      {
        id: "studio-headphones",
        label: "Studio Headphones",
        image: "/data/product_images/roland/roland-rh-5_thumb.webp",
      },
      {
        id: "dj-headphones",
        label: "DJ Headphones",
        image: "/data/product_images/roland/roland-rh-5_thumb.webp",
      },
      {
        id: "hifi-headphones",
        label: "Hi-Fi Headphones",
        image: "/data/product_images/roland/roland-rh-5_thumb.webp",
      },
      {
        id: "iem",
        label: "In-Ear Monitors",
        image: "/data/product_images/mackie/mackie-prod-5_thumb.webp",
      },
    ],
    color: "#6366f1", // Indigo
  },
  {
    id: "accessories",
    label: "Accessories",
    iconName: "Wrench",
    description: "Stands, Cases, Cables",
    subcategories: [
      {
        id: "cables",
        label: "Cables",
        image: "/data/product_images/roland/roland-rcc-5-3528_thumb.webp",
      },
      {
        id: "stands",
        label: "Stands",
        image: "/data/product_images/roland/roland-ks-11z_thumb.webp",
      },
      {
        id: "cases",
        label: "Cases & Bags",
        image: "/data/product_images/roland/roland-cb-b88s_thumb.webp",
      },
      {
        id: "power",
        label: "Power Supplies",
        image: "/data/product_images/roland/roland-prod-4_thumb.webp",
      },
    ],
    color: "#64748b", // Slate
  },
];

/**
 * The "Brain" - Maps product categories to universal categories
 * Uses fuzzy matching on product metadata to intelligently sort items
 */
export function mapProductToUniversal(product: Product): string {
  // Build search string from all product metadata
  const searchStr = (
    (product.category || "") +
    " " +
    (product.subcategory || "") +
    " " +
    (product.name || "") +
    " " +
    ((product.specifications || []).map((s) => s.key).join(" ") || "")
  ).toLowerCase();

  // Multi-level matching: Most specific to least specific
  if (
    searchStr.includes("piano") ||
    searchStr.includes("synth") ||
    searchStr.includes("keyboard") ||
    searchStr.includes("keys")
  ) {
    return "keys";
  }
  if (
    searchStr.includes("drum") ||
    searchStr.includes("percussion") ||
    searchStr.includes("cymbal") ||
    searchStr.includes("v-drum")
  ) {
    return "drums";
  }
  if (
    searchStr.includes("guitar") ||
    searchStr.includes("bass") ||
    searchStr.includes("amp") ||
    searchStr.includes("pedal") ||
    searchStr.includes("effect")
  ) {
    return "guitars";
  }
  if (
    searchStr.includes("monitor") ||
    searchStr.includes("interface") ||
    searchStr.includes("mic") ||
    searchStr.includes("recording")
  ) {
    return "studio";
  }
  if (
    searchStr.includes("speaker") ||
    searchStr.includes("mixer") ||
    searchStr.includes("pa") ||
    searchStr.includes("subwoofer") ||
    searchStr.includes("live")
  ) {
    return "live";
  }
  if (searchStr.includes("dj") || searchStr.includes("turntable")) {
    return "dj";
  }
  if (searchStr.includes("headphone") || searchStr.includes("ear")) {
    return "headphones";
  }

  // Default fallback
  return "accessories";
}

/**
 * Get the category definition by ID
 */
export function getCategoryById(id: string): UniversalCategoryDef | undefined {
  return UNIVERSAL_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get the color associated with a category ID
 */
export function getCategoryColor(categoryId: string): string {
  const cat = getCategoryById(categoryId);
  return cat?.color || "#64748b"; // Default to slate
}
