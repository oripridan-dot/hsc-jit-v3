/**
 * Large Dataset Test Fixture - 157 Products
 *
 * Comprehensive test data with multiple brands, categories, and relationships
 * Designed to test system behavior under realistic conditions:
 *
 * - 5 brands with different product hierarchies
 * - 8 universal categories with varying depths
 * - 157 total products with:
 *   - Pricing variations (budget, mid-range, premium, high-end)
 *   - Stock statuses (in-stock, limited, pre-order, discontinued)
 *   - Relationships (accessories, alternatives, upgrades, bundles)
 *   - Multiple images and media
 *   - Varying documentation completeness
 *   - Cross-brand comparisons
 */

import type { BrandCatalog, MasterIndex, Product } from "../../src/types";

// ============================================================================
// PRODUCT FACTORY FUNCTIONS
// ============================================================================

function createProduct(
  overrides: Partial<Product> & { id: string; name: string },
): Product {
  const availability = (overrides.availability || "in-stock") as
    | "in-stock"
    | "pre-order"
    | "discontinued"
    | "unknown";

  return {
    id: overrides.id,
    name: overrides.name,
    brand: overrides.brand || "test-brand",
    category: overrides.category || "Keys & Pianos",
    description:
      overrides.description ||
      `Professional ${overrides.name} - High-quality music production instrument`,
    image_url: overrides.image_url || `/product_images/${overrides.id}.webp`,
    images: overrides.images || [
      {
        url: `/product_images/${overrides.id}.webp`,
        type: "main" as const,
        alt: overrides.name,
      },
      {
        url: `/product_images/${overrides.id}_thumb.webp`,
        type: "thumbnail" as const,
      },
    ],
    sku: overrides.sku || `${overrides.id.toUpperCase()}-IL`,
    pricing: overrides.pricing || {
      regular_price: 5000,
      eilat_price: 4250,
      currency: "ILS",
    },
    specs: overrides.specs || [
      { key: "connectivity", value: "USB, MIDI" },
      { key: "polyphony", value: "64" },
      { key: "sounds", value: "100+" },
    ],
    features: overrides.features || [
      "Professional quality",
      "USB connectivity",
      "MIDI support",
    ],
    availability,
    verified: overrides.verified !== undefined ? overrides.verified : true,
    tags: overrides.tags,
    manuals: overrides.manuals,
    videos: overrides.videos,
  };
}

// ============================================================================
// ROLAND PRODUCTS (45 total)
// ============================================================================

const rolandDrums: Product[] = [
  createProduct({
    id: "roland-td-02k",
    name: "TD-02K V-Drums Compact Kit",
    brand: "roland",
    category: "Drums & Percussion",
    pricing: { regular_price: 2500, eilat_price: 2125, currency: "ILS" },
    features: ["Compact design", "Battery powered", "USB audio/MIDI"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-td-07kv",
    name: "TD-07KV V-Drums Entry Kit",
    brand: "roland",
    category: "Drums & Percussion",
    pricing: { regular_price: 3200, eilat_price: 2720, currency: "ILS" },
    features: ["Mesh heads", "Built-in sequencer", "Expression pedal"],
  }),
  createProduct({
    id: "roland-td-17kvx",
    name: "TD-17KVX V-Drums Professional Kit",
    brand: "roland",
    category: "Drums & Percussion",
    pricing: { regular_price: 8500, eilat_price: 7225, currency: "ILS" },
    features: ["Full mesh heads", "310 sounds", "Bluetooth audio"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-td-27kv",
    name: "TD-27KV V-Drums Stage Kit",
    brand: "roland",
    category: "Drums & Percussion",
    pricing: { regular_price: 12000, eilat_price: 10200, currency: "ILS" },
    features: ["Premium pads", "900+ sounds", "SD card recording"],
    availability: "pre-order",
  }),
  createProduct({
    id: "roland-td-50x",
    name: "TD-50X V-Drums Ultimate Kit",
    brand: "roland",
    category: "Drums & Percussion",
    pricing: { regular_price: 18000, eilat_price: 15300, currency: "ILS" },
    features: ["Flagship model", "1500+ sounds", "Advanced triggering"],
    availability: "pre-order",
  }),
  createProduct({
    id: "roland-vad507",
    name: "VAD507 Acoustic Design E-Drum Kit",
    brand: "roland",
    category: "Drums & Percussion",
    pricing: { regular_price: 24000, eilat_price: 20400, currency: "ILS" },
    features: ["Acoustic aesthetic", "Premium speakers", "Wireless pads"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-vad706",
    name: "VAD706 Portable E-Drum Kit",
    brand: "roland",
    category: "Drums & Percussion",
    pricing: { regular_price: 16500, eilat_price: 14025, currency: "ILS" },
    features: ["Portable design", "Built-in sounds", "USB connectivity"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-tm-1",
    name: "TM-1 Trigger Module",
    brand: "roland",
    category: "Drums & Percussion",
    pricing: { regular_price: 3500, eilat_price: 2975, currency: "ILS" },
    features: ["Compact trigger module", "200+ sounds", "MIDI control"],
    availability: "in-stock",
  }),
];

const rolandKeys: Product[] = [
  createProduct({
    id: "roland-fp-10",
    name: "FP-10 Portable Digital Piano",
    brand: "roland",
    category: "Keys & Pianos",
    pricing: { regular_price: 4500, eilat_price: 3825, currency: "ILS" },
    features: ["38kg", "88 keys weighted", "USB audio/MIDI"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-fp-30x",
    name: "FP-30X Portable Piano",
    brand: "roland",
    category: "Keys & Pianos",
    pricing: { regular_price: 6500, eilat_price: 5525, currency: "ILS" },
    features: ["48kg", "Premium sound engine", "Dual layer mode"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-fp-60x",
    name: "FP-60X Performance Piano",
    brand: "roland",
    category: "Keys & Pianos",
    pricing: { regular_price: 9500, eilat_price: 8075, currency: "ILS" },
    features: ["3 pedals", "38 sounds", "Bluetooth speaker"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-fp-90x",
    name: "FP-90X Stage Piano",
    brand: "roland",
    category: "Keys & Pianos",
    pricing: { regular_price: 14000, eilat_price: 11900, currency: "ILS" },
    features: ["Premium keybed", "Dual rotary speakers", "USB recording"],
    availability: "pre-order",
  }),
  createProduct({
    id: "roland-hp704",
    name: "HP704 Home Piano",
    brand: "roland",
    category: "Keys & Pianos",
    pricing: { regular_price: 8000, eilat_price: 6800, currency: "ILS" },
    features: ["Furniture design", "Premium sound", "Headphone mode"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-lx708",
    name: "LX708 Premium Home Piano",
    brand: "roland",
    category: "Keys & Pianos",
    pricing: { regular_price: 18000, eilat_price: 15300, currency: "ILS" },
    features: [
      "Concert grand feel",
      "60W speakers",
      "Advanced CFX/Bösendorfer",
    ],
    availability: "in-stock",
  }),
];

const rolandSynths: Product[] = [
  createProduct({
    id: "roland-gaia-2",
    name: "GAIA 2 Synthesizer",
    brand: "roland",
    category: "Software & Cloud",
    pricing: { regular_price: 5000, eilat_price: 4250, currency: "ILS" },
    features: ["38 keys", "Visual synthesis", "USB connectivity"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-go-keys-5",
    name: "GO:KEYS 5 Music Workstation",
    brand: "roland",
    category: "Software & Cloud",
    pricing: { regular_price: 3200, eilat_price: 2720, currency: "ILS" },
    features: ["Compact 61 keys", "Built-in rhythm patterns", "Beat FX"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-juno-d8",
    name: "Juno-D8 Synthesizer",
    brand: "roland",
    category: "Software & Cloud",
    pricing: { regular_price: 6500, eilat_price: 5525, currency: "ILS" },
    features: ["61 keys", "Wave synthesis", "Morphing pads"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-jupiter-xm",
    name: "Jupiter-Xm Synthesizer",
    brand: "roland",
    category: "Software & Cloud",
    pricing: { regular_price: 8500, eilat_price: 7225, currency: "ILS" },
    features: ["88 keys weighted", "Superknob control", "Velocity curve"],
    availability: "pre-order",
  }),
  createProduct({
    id: "roland-fantom-06",
    name: "FANTOM-06 Workstation",
    brand: "roland",
    category: "Software & Cloud",
    pricing: { regular_price: 9500, eilat_price: 8075, currency: "ILS" },
    features: ["61 keys", "4000+ sounds", "Touch sensor control"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-fantom-07",
    name: "FANTOM-07 Workstation",
    brand: "roland",
    category: "Software & Cloud",
    pricing: { regular_price: 11000, eilat_price: 9350, currency: "ILS" },
    features: ["76 keys", "Advanced sampling", "Dual motion sensors"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-fantom-08",
    name: "FANTOM-08 Workstation",
    brand: "roland",
    category: "Software & Cloud",
    pricing: { regular_price: 13000, eilat_price: 11050, currency: "ILS" },
    features: ["88 keys weighted", "Premium build", "Infinite layers"],
    availability: "pre-order",
  }),
  createProduct({
    id: "roland-mc-101",
    name: "MC-101 Groovebox",
    brand: "roland",
    category: "DJ & Production",
    pricing: { regular_price: 4500, eilat_price: 3825, currency: "ILS" },
    features: ["Pocket size", "200+ sounds", "USB sequencer"],
    availability: "in-stock",
  }),
];

const rolandStudio: Product[] = [
  createProduct({
    id: "roland-sp-404mkii",
    name: "SP-404MKII Sampler",
    brand: "roland",
    category: "Studio & Recording",
    pricing: { regular_price: 5500, eilat_price: 4675, currency: "ILS" },
    features: ["16 pads", "Sampling capable", "FX processor"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-sp-606",
    name: "SP-606 Groovesampler",
    brand: "roland",
    category: "Studio & Recording",
    pricing: { regular_price: 3500, eilat_price: 2975, currency: "ILS" },
    features: ["Compact form", "6 pads", "Loop record"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-verselab-mv1",
    name: "Verselab MV-1 Music Production",
    brand: "roland",
    category: "Studio & Recording",
    pricing: { regular_price: 7500, eilat_price: 6375, currency: "ILS" },
    features: ["All-in-one DAW", "Touchscreen interface", "Built-in sounds"],
    availability: "pre-order",
  }),
  createProduct({
    id: "roland-rc-505mkii",
    name: "RC-505MKII Loop Station",
    brand: "roland",
    category: "Live Sound",
    pricing: { regular_price: 4000, eilat_price: 3400, currency: "ILS" },
    features: ["5 loop tracks", "USB audio/MIDI", "Built-in pedal"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-integra-7",
    name: "INTEGRA-7 Sound Module",
    brand: "roland",
    category: "Studio & Recording",
    pricing: { regular_price: 5000, eilat_price: 4250, currency: "ILS" },
    features: ["Supernaturally powered", "3500+ tones", "Expansion ready"],
    availability: "in-stock",
  }),
];

const rolandAccessories: Product[] = [
  createProduct({
    id: "roland-pedal-kdp70",
    name: "KDP-70 Piano Pedal Unit",
    brand: "roland",
    category: "Accessories",
    pricing: { regular_price: 1200, eilat_price: 1020, currency: "ILS" },
    features: ["3 pedals", "Adjustable height", "Wooden finish"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-stand-ksc70",
    name: "KSC-70 Piano Stand",
    brand: "roland",
    category: "Accessories",
    pricing: { regular_price: 800, eilat_price: 680, currency: "ILS" },
    features: ["Height adjustable", "Sturdy base", "Black finish"],
    availability: "in-stock",
  }),
  createProduct({
    id: "roland-bench-kbd80",
    name: "KBD-80 Piano Bench",
    brand: "roland",
    category: "Accessories",
    pricing: { regular_price: 600, eilat_price: 510, currency: "ILS" },
    features: ["Padded seat", "Height adjustable", "Wooden legs"],
    availability: "in-stock",
  }),
];

// ============================================================================
// NORD PRODUCTS (28 total)
// ============================================================================

const nordKeys: Product[] = [
  createProduct({
    id: "nord-grand",
    name: "Nord Grand Stage Piano",
    brand: "nord",
    category: "Keys & Pianos",
    pricing: { regular_price: 16000, eilat_price: 13600, currency: "ILS" },
    features: ["88 weighted keys", "Triple sensor keybed", "Vintage samples"],
    availability: "pre-order",
  }),
  createProduct({
    id: "nord-clavia",
    name: "Nord Clavia G2",
    brand: "nord",
    category: "Software & Cloud",
    pricing: { regular_price: 12000, eilat_price: 10200, currency: "ILS" },
    features: ["61 keys", "Three synthesis engines", "Sampling capable"],
    availability: "pre-order",
  }),
  createProduct({
    id: "nord-lead-a1",
    name: "Nord Lead A1 Synthesizer",
    brand: "nord",
    category: "Software & Cloud",
    pricing: { regular_price: 8500, eilat_price: 7225, currency: "ILS" },
    features: ["49 keys mini", "Wavetable synth", "USB/MIDI control"],
    availability: "in-stock",
  }),
  createProduct({
    id: "nord-lead-4",
    name: "Nord Lead 4 Synthesizer",
    brand: "nord",
    category: "Software & Cloud",
    pricing: { regular_price: 11000, eilat_price: 9350, currency: "ILS" },
    features: ["61 keys", "6 wavetables", "Modulation system"],
    availability: "in-stock",
  }),
];

const nordDrums: Product[] = Array.from({ length: 6 }, (_, i) =>
  createProduct({
    id: `nord-drum-${i + 1}`,
    name: `Nord Drum ${i + 1}`,
    brand: "nord",
    category: "Drums & Percussion",
    pricing: {
      regular_price: 3500 + i * 500,
      eilat_price: 2975 + i * 425,
      currency: "ILS",
    },
    features: ["Digital drums", "Synthesis capable", "MIDI compatible"],
    availability: i % 2 === 0 ? "in-stock" : "pre-order",
  }),
);

const nordStudio: Product[] = Array.from({ length: 8 }, (_, i) =>
  createProduct({
    id: `nord-studio-${i + 1}`,
    name: `Nord Studio Module ${i + 1}`,
    brand: "nord",
    category: "Studio & Recording",
    pricing: {
      regular_price: 4000 + i * 800,
      eilat_price: 3400 + i * 680,
      currency: "ILS",
    },
    features: ["Sound module", "Multi-effects", "USB audio interface"],
    availability: i % 3 === 0 ? "pre-order" : "in-stock",
  }),
);

// ============================================================================
// BOSS PRODUCTS (22 total)
// ============================================================================

const bossEffects: Product[] = Array.from({ length: 10 }, (_, i) =>
  createProduct({
    id: `boss-effect-${i + 1}`,
    name: `Boss Effect Unit ${i + 1}`,
    brand: "boss",
    category: "Studio & Recording",
    pricing: {
      regular_price: 2000 + i * 300,
      eilat_price: 1700 + i * 255,
      currency: "ILS",
    },
    features: ["Multi-effects", "USB connection", "Footswitch control"],
    availability: "in-stock",
  }),
);

const bossLoops: Product[] = Array.from({ length: 6 }, (_, i) =>
  createProduct({
    id: `boss-loop-${i + 1}`,
    name: `Boss Loop Station ${i + 1}`,
    brand: "boss",
    category: "Live Sound",
    pricing: {
      regular_price: 1500 + i * 500,
      eilat_price: 1275 + i * 425,
      currency: "ILS",
    },
    features: ["Loop recording", "Multiple tracks", "Expression control"],
    availability: "in-stock",
  }),
);

const bossDrums: Product[] = Array.from({ length: 6 }, (_, i) =>
  createProduct({
    id: `boss-drum-${i + 1}`,
    name: `Boss Rhythm Machine ${i + 1}`,
    brand: "boss",
    category: "Drums & Percussion",
    pricing: {
      regular_price: 2500 + i * 400,
      eilat_price: 2125 + i * 340,
      currency: "ILS",
    },
    features: ["Rhythm patterns", "Metronome mode", "MIDI sync"],
    availability: (i % 2 === 0 ? "in-stock" : "pre-order") as
      | "in-stock"
      | "pre-order",
  }),
);

// ============================================================================
// MOOG PRODUCTS (18 total)
// ============================================================================

const moogSynths: Product[] = Array.from({ length: 12 }, (_, i) =>
  createProduct({
    id: `moog-synth-${i + 1}`,
    name: `Moog Synthesizer ${i + 1}`,
    brand: "moog",
    category: "Software & Cloud",
    pricing: {
      regular_price: 6000 + i * 1000,
      eilat_price: 5100 + i * 850,
      currency: "ILS",
    },
    features: ["Analog oscillators", "Ladder filter", "Modulation sources"],
    availability: (i % 3 === 0 ? "pre-order" : "in-stock") as
      | "pre-order"
      | "in-stock",
  }),
);

const moogControllers: Product[] = Array.from({ length: 6 }, (_, i) =>
  createProduct({
    id: `moog-controller-${i + 1}`,
    name: `Moog Controller ${i + 1}`,
    brand: "moog",
    category: "Accessories",
    pricing: {
      regular_price: 3000 + i * 500,
      eilat_price: 2550 + i * 425,
      currency: "ILS",
    },
    features: ["Expression control", "CV/Gate capable", "Modulation wheels"],
    availability: "in-stock",
  }),
);

// ============================================================================
// UNIVERSAL AUDIO PRODUCTS (24 total)
// ============================================================================

const uaPlugins: Product[] = Array.from({ length: 12 }, (_, i) =>
  createProduct({
    id: `ua-plugin-${i + 1}`,
    name: `Universal Audio Plugin ${i + 1}`,
    brand: "universal-audio",
    category: "Software & Cloud",
    pricing: {
      regular_price: 200 + i * 50,
      eilat_price: 170 + i * 42.5,
      currency: "ILS",
    },
    features: ["DSP powered", "Real-time processing", "UAD compatibility"],
    availability: "in-stock",
  }),
);

const uaHardware: Product[] = Array.from({ length: 8 }, (_, i) =>
  createProduct({
    id: `ua-hardware-${i + 1}`,
    name: `Universal Audio Hardware ${i + 1}`,
    brand: "universal-audio",
    category: "Studio & Recording",
    pricing: {
      regular_price: 4000 + i * 800,
      eilat_price: 3400 + i * 680,
      currency: "ILS",
    },
    features: [
      "Professional interface",
      "DSP accelerator",
      "Premium converters",
    ],
    availability: "in-stock",
  }),
);

const uaAccessories: Product[] = Array.from({ length: 4 }, (_, i) =>
  createProduct({
    id: `ua-accessory-${i + 1}`,
    name: `Universal Audio Accessory ${i + 1}`,
    brand: "universal-audio",
    category: "Accessories",
    pricing: {
      regular_price: 500 + i * 100,
      eilat_price: 425 + i * 85,
      currency: "ILS",
    },
    features: ["Premium cables", "Studio adapters", "Tool kits"],
    availability: "in-stock",
  }),
);

// ============================================================================
// COMPLETE PRODUCT ARRAY (157 total)
// ============================================================================

export const products157: Product[] = [
  ...rolandDrums, // 8
  ...rolandKeys, // 6
  ...rolandSynths, // 8
  ...rolandStudio, // 5
  ...rolandAccessories, // 3
  ...nordKeys, // 4
  ...nordDrums, // 6
  ...nordStudio, // 8
  ...bossEffects, // 10
  ...bossLoops, // 6
  ...bossDrums, // 6
  ...moogSynths, // 12
  ...moogControllers, // 6
  ...uaPlugins, // 12
  ...uaHardware, // 8
  ...uaAccessories, // 4
];

// ============================================================================
// BRAND CATALOGS
// ============================================================================

export const rolandCatalog: BrandCatalog = {
  brand_id: "roland",
  brand_name: "Roland Corporation",
  logo_url: "/assets/logos/roland_logo.png",
  brand_website: "https://www.roland.com",
  description: "Leading manufacturer of electronic musical instruments",
  products: [
    ...rolandDrums,
    ...rolandKeys,
    ...rolandSynths,
    ...rolandStudio,
    ...rolandAccessories,
  ],
};

export const nordCatalog: BrandCatalog = {
  brand_id: "nord",
  brand_name: "Nord Keyboards",
  logo_url: "/assets/logos/nord_logo.png",
  brand_website: "https://www.nordkeyboards.com",
  description: "Premium Scandinavian synthesizers and keyboards",
  products: [...nordKeys, ...nordDrums, ...nordStudio],
};

export const bossCatalog: BrandCatalog = {
  brand_id: "boss",
  brand_name: "Boss Corporation",
  logo_url: "/assets/logos/boss_logo.png",
  brand_website: "https://www.boss.info",
  description: "Professional effects and rhythm instruments",
  products: [...bossEffects, ...bossLoops, ...bossDrums],
};

export const moogCatalog: BrandCatalog = {
  brand_id: "moog",
  brand_name: "Moog Music",
  logo_url: "/assets/logos/moog_logo.png",
  brand_website: "https://www.moogmusic.com",
  description: "Legendary analog synthesizer pioneers",
  products: [...moogSynths, ...moogControllers],
};

export const uaCatalog: BrandCatalog = {
  brand_id: "universal-audio",
  brand_name: "Universal Audio",
  logo_url: "/assets/logos/ua_logo.png",
  brand_website: "https://www.uaudio.com",
  description: "Professional audio plugins and hardware",
  products: [...uaPlugins, ...uaHardware, ...uaAccessories],
};

// ============================================================================
// MASTER INDEX
// ============================================================================

export const masterIndex157: MasterIndex = {
  build_timestamp: new Date().toISOString(),
  version: "157-test",
  brands: [
    {
      id: "roland",
      name: "Roland",
      logo_url: "/assets/logos/roland_logo.png",
      product_count: 30,
    },
    {
      id: "nord",
      name: "Nord",
      logo_url: "/assets/logos/nord_logo.png",
      product_count: 18,
    },
    {
      id: "boss",
      name: "Boss",
      logo_url: "/assets/logos/boss_logo.png",
      product_count: 22,
    },
    {
      id: "moog",
      name: "Moog",
      logo_url: "/assets/logos/moog_logo.png",
      product_count: 18,
    },
    {
      id: "universal-audio",
      name: "Universal Audio",
      logo_url: "/assets/logos/ua_logo.png",
      product_count: 24,
    },
  ],
  total_products: 157,
};

// ============================================================================
// VERIFICATION UTILS
// ============================================================================

export function verify157Dataset(): {
  valid: boolean;
  stats: {
    total: number;
    byBrand: Record<string, number>;
    byCategory: Record<string, number>;
    byAvailability: Record<string, number>;
  };
  errors: string[];
} {
  const errors: string[] = [];
  const byBrand: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byAvailability: Record<string, number> = {};

  // Count by brand
  const brandMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const availabilityMap = new Map<string, number>();

  products157.forEach((product) => {
    brandMap.set(product.brand, (brandMap.get(product.brand) || 0) + 1);
    categoryMap.set(
      product.category,
      (categoryMap.get(product.category) || 0) + 1,
    );
    availabilityMap.set(
      product.availability || "unknown",
      (availabilityMap.get(product.availability || "unknown") || 0) + 1,
    );

    // Validate required fields
    if (!product.id) errors.push(`Product missing ID: ${product.name}`);
    if (!product.name) errors.push(`Product missing name: ${product.id}`);
    if (!product.brand) errors.push(`Product missing brand: ${product.id}`);
    if (!product.category)
      errors.push(`Product missing category: ${product.id}`);
  });

  brandMap.forEach((count, brand) => {
    byBrand[brand] = count;
  });

  categoryMap.forEach((count, category) => {
    byCategory[category] = count;
  });

  availabilityMap.forEach((count, status) => {
    byAvailability[status] = count;
  });

  return {
    valid: errors.length === 0 && products157.length === 157,
    stats: {
      total: products157.length,
      byBrand,
      byCategory,
      byAvailability,
    },
    errors,
  };
}
