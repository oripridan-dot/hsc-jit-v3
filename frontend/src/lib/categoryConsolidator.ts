/**
 * Category Consolidator - The "Translation Layer"
 *
 * ARCHITECTURE PRINCIPLE:
 * "Accept what brands give us exactly, translate to steady UI categories"
 *
 * This module maps diverse brand taxonomies into 8 universal UI categories.
 * The UI always displays the same categories in the same place - no surprises.
 *
 * Data Flow:
 * 1. Brand scraper extracts exact category from brand website
 * 2. Product JSON stores original brand category (source of truth)
 * 3. This consolidator maps to UI category for display
 * 4. UI shows consolidated category, product details show original
 *
 * Benefits:
 * - Steady, predictable UI (same 8 buttons always)
 * - Zero data loss (original category preserved)
 * - No-brainer navigation (musician mental model)
 * - Extensible (add new brands by adding mappings)
 */

import type { Product } from "../types";

// =============================================================================
// THE 8 UNIVERSAL UI CATEGORIES
// These are DISPLAY categories - they never change, never move
// =============================================================================

export interface ConsolidatedCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  sortOrder: number; // Fixed position in UI
}

export const CONSOLIDATED_CATEGORIES: ConsolidatedCategory[] = [
  {
    id: "keys",
    label: "Keys & Pianos",
    icon: "🎹",
    color: "#f59e0b", // Amber
    description: "Synths, Pianos, Controllers, Organs",
    sortOrder: 1,
  },
  {
    id: "drums",
    label: "Drums & Percussion",
    icon: "🥁",
    color: "#ef4444", // Red
    description: "Electronic & Acoustic Drums, Percussion",
    sortOrder: 2,
  },
  {
    id: "guitars",
    label: "Guitars & Amps",
    icon: "🎸",
    color: "#3b82f6", // Blue
    description: "Electric, Bass, Effects, Amplifiers",
    sortOrder: 3,
  },
  {
    id: "studio",
    label: "Studio & Recording",
    icon: "🎙️",
    color: "#10b981", // Emerald
    description: "Interfaces, Monitors, Microphones",
    sortOrder: 4,
  },
  {
    id: "live",
    label: "Live Sound",
    icon: "🔊",
    color: "#8b5cf6", // Violet
    description: "PA Systems, Mixers, Wireless",
    sortOrder: 5,
  },
  {
    id: "dj",
    label: "DJ & Production",
    icon: "🎧",
    color: "#ec4899", // Pink
    description: "Controllers, Samplers, Grooveboxes",
    sortOrder: 6,
  },
  {
    id: "software",
    label: "Software & Cloud",
    icon: "💻",
    color: "#06b6d4", // Cyan
    description: "Plugins, Apps, Cloud Services",
    sortOrder: 7,
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: "🔧",
    color: "#64748b", // Slate
    description: "Cables, Stands, Cases, Pedals",
    sortOrder: 8,
  },
];

// =============================================================================
// BRAND CATEGORY MAPPINGS
// Maps exact brand terminology → consolidated UI category
// =============================================================================

/**
 * Mapping structure: brand → { "brand category" → "consolidated id" }
 *
 * RULES:
 * 1. Keys are EXACT brand category labels (case-insensitive matching)
 * 2. Values are consolidated category IDs
 * 3. Unknown categories fall back to "accessories"
 * 4. Subcategories inherit parent's mapping unless explicitly overridden
 */
const BRAND_MAPPINGS: Record<string, Record<string, string>> = {
  // ─────────────────────────────────────────────────────────────────────────
  // ROLAND
  // Source: https://www.roland.com/global/categories/
  // ─────────────────────────────────────────────────────────────────────────
  roland: {
    // Main categories
    pianos: "keys",
    synthesizers: "keys",
    keyboards: "keys",
    organs: "keys",
    drums_percussion: "drums",
    "drums & percussion": "drums",
    guitar_bass: "guitars",
    "guitar & bass": "guitars",
    amplifiers: "guitars",
    production: "studio",
    aira: "dj",
    wind_instruments: "studio", // Aerophone → unique, put in studio
    roland_cloud: "software",
    accessories: "accessories",
    // Subcategories (explicit overrides)
    grand_pianos: "keys",
    portable_pianos: "keys",
    stage_pianos: "keys",
    upright_pianos: "keys",
    v_drums: "drums",
    electronic_percussion: "drums",
    hybrid_drums: "drums",
    keyboard_amplifiers: "guitars",
    guitar_amplifiers: "guitars",
    bass_amplifiers: "guitars",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BOSS
  // Source: https://www.boss.info/global/categories/
  // ─────────────────────────────────────────────────────────────────────────
  boss: {
    effects_pedals: "guitars",
    "effects pedals": "guitars",
    multi_effects: "guitars",
    "multi-effects": "guitars",
    guitar_synthesizers: "guitars",
    "guitar synthesizers": "guitars",
    amplifiers: "guitars",
    acoustic: "guitars",
    loop_station: "dj",
    "loop station": "dj",
    vocal_effects: "studio",
    "vocal effects": "studio",
    mixers_audio_solutions: "live",
    "mixers & audio solutions": "live",
    tuners_metronomes: "accessories",
    "tuners & metronomes": "accessories",
    wireless: "live",
    accessories: "accessories",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NORD
  // Source: https://www.nordkeyboards.com/products
  // ─────────────────────────────────────────────────────────────────────────
  nord: {
    stage: "keys",
    piano: "keys",
    electro: "keys",
    lead: "keys",
    wave: "keys",
    drum: "drums",
    c2d_organ: "keys",
    "c2d organ": "keys",
    accessories: "accessories",
    software: "software",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MOOG
  // Source: https://www.moogmusic.com/products
  // ─────────────────────────────────────────────────────────────────────────
  moog: {
    synthesizers: "keys",
    effects: "guitars",
    keyboards: "keys",
    controllers: "keys",
    accessories: "accessories",
    apps: "software",
    // Subcategories
    semi_modular: "keys",
    "semi-modular": "keys",
    polyphonic: "keys",
    monophonic: "keys",
    modular: "keys",
    moogerfooger: "guitars",
    minifooger: "guitars",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UNIVERSAL AUDIO
  // ─────────────────────────────────────────────────────────────────────────
  "universal-audio": {
    interfaces: "studio",
    "audio interfaces": "studio",
    preamps: "studio",
    plugins: "software",
    uad: "software",
    apollo: "studio",
    volt: "studio",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ADAM AUDIO
  // ─────────────────────────────────────────────────────────────────────────
  "adam-audio": {
    monitors: "studio",
    "studio monitors": "studio",
    subwoofers: "studio",
    accessories: "accessories",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MACKIE
  // ─────────────────────────────────────────────────────────────────────────
  mackie: {
    monitors: "studio",
    mixers: "live",
    speakers: "live",
    "pa speakers": "live",
    "powered speakers": "live",
    headphones: "accessories",
    accessories: "accessories",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // AKAI PROFESSIONAL
  // ─────────────────────────────────────────────────────────────────────────
  "akai-professional": {
    controllers: "dj",
    "midi controllers": "dj",
    mpc: "dj",
    samplers: "dj",
    keyboards: "keys",
    "keyboard controllers": "keys",
    accessories: "accessories",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WARM AUDIO
  // ─────────────────────────────────────────────────────────────────────────
  "warm-audio": {
    microphones: "studio",
    preamps: "studio",
    compressors: "studio",
    eq: "studio",
    outboard: "studio",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TEENAGE ENGINEERING
  // ─────────────────────────────────────────────────────────────────────────
  "teenage-engineering": {
    synthesizers: "keys",
    "pocket operators": "dj",
    op: "keys",
    "op-1": "keys",
    "op-z": "dj",
    accessories: "accessories",
    audio: "dj",
  },
};

// =============================================================================
// CONSOLIDATION FUNCTIONS
// =============================================================================

/**
 * Get the consolidated UI category for a brand's category label
 *
 * @param brandId - The brand identifier (e.g., "roland", "boss")
 * @param brandCategory - The original category from brand taxonomy
 * @returns The consolidated category ID (e.g., "keys", "drums")
 */
export function consolidateCategory(
  brandId: string,
  brandCategory: string,
): string {
  const normalizedBrand = brandId.toLowerCase().trim();
  const normalizedCategory = brandCategory
    .toLowerCase()
    .trim()
    .replace(/_/g, " ");

  // Look up the brand's mappings
  const brandMapping = BRAND_MAPPINGS[normalizedBrand];
  if (brandMapping) {
    // Try exact match first
    const exactMatch = brandMapping[normalizedCategory];
    if (exactMatch) return exactMatch;

    // Try with underscores replaced
    const underscoreKey = normalizedCategory.replace(/ /g, "_");
    const underscoreMatch = brandMapping[underscoreKey];
    if (underscoreMatch) return underscoreMatch;

    // Try fuzzy matching on keywords
    for (const [key, value] of Object.entries(brandMapping)) {
      if (
        normalizedCategory.includes(key) ||
        key.includes(normalizedCategory)
      ) {
        return value;
      }
    }
  }

  // Fallback: Try to infer from category name using keywords
  return inferCategoryFromLabel(normalizedCategory);
}

/**
 * Infer consolidated category from category label keywords
 * Used as fallback when no explicit mapping exists
 */
function inferCategoryFromLabel(label: string): string {
  const lower = label.toLowerCase();

  // Keys & Pianos
  if (
    lower.includes("piano") ||
    lower.includes("synth") ||
    lower.includes("keyboard") ||
    lower.includes("organ") ||
    lower.includes("keys") ||
    lower.includes("workstation")
  ) {
    return "keys";
  }

  // Drums & Percussion
  if (
    lower.includes("drum") ||
    lower.includes("percussion") ||
    lower.includes("cymbal") ||
    lower.includes("v-drum")
  ) {
    return "drums";
  }

  // Guitars & Amps
  if (
    lower.includes("guitar") ||
    lower.includes("bass") ||
    lower.includes("amp") ||
    lower.includes("pedal") ||
    lower.includes("effect") ||
    lower.includes("stomp")
  ) {
    return "guitars";
  }

  // Studio & Recording
  if (
    lower.includes("monitor") ||
    lower.includes("interface") ||
    lower.includes("mic") ||
    lower.includes("recording") ||
    lower.includes("preamp") ||
    lower.includes("compressor")
  ) {
    return "studio";
  }

  // Live Sound
  if (
    lower.includes("speaker") ||
    lower.includes("mixer") ||
    lower.includes("pa") ||
    lower.includes("subwoofer") ||
    lower.includes("live") ||
    lower.includes("wireless")
  ) {
    return "live";
  }

  // DJ & Production
  if (
    lower.includes("dj") ||
    lower.includes("turntable") ||
    lower.includes("sampler") ||
    lower.includes("mpc") ||
    lower.includes("loop") ||
    lower.includes("groovebox")
  ) {
    return "dj";
  }

  // Software & Cloud
  if (
    lower.includes("software") ||
    lower.includes("cloud") ||
    lower.includes("plugin") ||
    lower.includes("app")
  ) {
    return "software";
  }

  // Default: Accessories
  return "accessories";
}

/**
 * Get the consolidated category definition by ID
 */
export function getConsolidatedCategory(
  id: string,
): ConsolidatedCategory | undefined {
  return CONSOLIDATED_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get all consolidated categories in display order
 */
export function getAllConsolidatedCategories(): ConsolidatedCategory[] {
  return [...CONSOLIDATED_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Consolidate a product's category for UI display
 * Returns the consolidated category while preserving original in product data
 */
export function consolidateProductCategory(product: Product): {
  consolidatedId: string;
  consolidatedLabel: string;
  originalCategory: string;
  brandId: string;
} {
  // brand is a string in our type system
  const brandId =
    typeof product.brand === "string"
      ? product.brand
      : product.id?.split("-")[0] || "unknown";
  const originalCategory = product.category || "Uncategorized";
  const consolidatedId = consolidateCategory(brandId, originalCategory);
  const consolidated = getConsolidatedCategory(consolidatedId);

  return {
    consolidatedId,
    consolidatedLabel: consolidated?.label || "Accessories",
    originalCategory,
    brandId,
  };
}

/**
 * Group products by consolidated category
 * Useful for building category-based navigation
 */
export function groupProductsByConsolidatedCategory(
  products: Product[],
): Map<string, Product[]> {
  const groups = new Map<string, Product[]>();

  // Initialize all categories with empty arrays
  for (const cat of CONSOLIDATED_CATEGORIES) {
    groups.set(cat.id, []);
  }

  // Group products
  for (const product of products) {
    const { consolidatedId } = consolidateProductCategory(product);
    const existing = groups.get(consolidatedId) || [];
    existing.push(product);
    groups.set(consolidatedId, existing);
  }

  return groups;
}

/**
 * Get category color for a brand's category
 * Used for consistent visual coding in UI
 */
export function getCategoryColorForBrandCategory(
  brandId: string,
  brandCategory: string,
): string {
  const consolidatedId = consolidateCategory(brandId, brandCategory);
  const cat = getConsolidatedCategory(consolidatedId);
  return cat?.color || "#64748b";
}

/**
 * Get category icon for a brand's category
 */
export function getCategoryIconForBrandCategory(
  brandId: string,
  brandCategory: string,
): string {
  const consolidatedId = consolidateCategory(brandId, brandCategory);
  const cat = getConsolidatedCategory(consolidatedId);
  return cat?.icon || "🔧";
}

// =============================================================================
// REVERSE MAPPING (UI → Brand Categories)
// For filtering products when user selects a consolidated category
// =============================================================================

/**
 * Get all brand categories that map to a consolidated category
 * Useful for filtering products across brands
 */
export function getBrandCategoriesForConsolidated(
  consolidatedId: string,
): { brandId: string; categories: string[] }[] {
  const result: { brandId: string; categories: string[] }[] = [];

  for (const [brandId, mappings] of Object.entries(BRAND_MAPPINGS)) {
    const matchingCategories: string[] = [];

    for (const [brandCat, consolidatedCat] of Object.entries(mappings)) {
      if (consolidatedCat === consolidatedId) {
        matchingCategories.push(brandCat);
      }
    }

    if (matchingCategories.length > 0) {
      result.push({ brandId, categories: matchingCategories });
    }
  }

  return result;
}

/**
 * Check if a product belongs to a consolidated category
 */
export function productMatchesConsolidatedCategory(
  product: Product,
  consolidatedId: string,
): boolean {
  const { consolidatedId: productConsolidated } =
    consolidateProductCategory(product);
  return productConsolidated === consolidatedId;
}
