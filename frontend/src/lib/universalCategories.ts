/**
 * Universal Categories - Real Product Thumbnails
 *
 * All subcategory images are REAL product thumbnails processed through VisualFactory.
 * Images are WebP format, 400x400, with transparent backgrounds.
 */

import type { Product } from "../types";

export interface SubcategoryDef {
  id: string;
  label: string;
  image: string;
  brands?: string[];
}

export interface UniversalCategoryDef {
  id: string;
  label: string;
  iconName: string;
  description: string;
  subcategories: SubcategoryDef[];
  color: string;
}

/**
 * The "Universal 8" - Real product thumbnails from VisualFactory
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
    color: "#f59e0b",
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
    color: "#ef4444",
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
    color: "#a855f7",
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
    color: "#06b6d4",
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
    color: "#22c55e",
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
    color: "#ec4899",
  },
  {
    id: "software",
    label: "Software & Cloud",
    iconName: "Cloud",
    description: "Plugins, Cloud Services",
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
    color: "#3b82f6",
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
    color: "#6b7280",
  },
];

export function getCategoryById(id: string): UniversalCategoryDef | undefined {
  return UNIVERSAL_CATEGORIES.find((cat) => cat.id === id);
}

export function getSubcategories(categoryId: string): SubcategoryDef[] {
  const category = getCategoryById(categoryId);
  return category?.subcategories || [];
}

export function matchProductToCategory(product: Product): string {
  const productCategory = (
    product.main_category ||
    product.category ||
    ""
  ).toLowerCase();

  for (const cat of UNIVERSAL_CATEGORIES) {
    if (cat.label.toLowerCase().includes(productCategory)) {
      return cat.id;
    }
    if (productCategory.includes(cat.id)) {
      return cat.id;
    }
  }

  const keywordMap: Record<string, string> = {
    piano: "keys",
    keyboard: "keys",
    synth: "keys",
    organ: "keys",
    controller: "keys",
    workstation: "keys",
    drum: "drums",
    percussion: "drums",
    cymbal: "drums",
    guitar: "guitars",
    bass: "guitars",
    amp: "guitars",
    pedal: "guitars",
    effect: "guitars",
    monitor: "studio",
    interface: "studio",
    microphone: "studio",
    mic: "studio",
    preamp: "studio",
    speaker: "live",
    mixer: "live",
    wireless: "live",
    pa: "live",
    dj: "dj",
    sampler: "dj",
    groovebox: "dj",
    turntable: "dj",
    headphone: "dj",
    software: "software",
    plugin: "software",
    cloud: "software",
    cable: "accessories",
    stand: "accessories",
    case: "accessories",
    bag: "accessories",
  };

  for (const [keyword, categoryId] of Object.entries(keywordMap)) {
    if (productCategory.includes(keyword)) {
      return categoryId;
    }
  }

  return "accessories";
}

export function filterByCategory(
  products: Product[],
  categoryId: string,
): Product[] {
  if (!categoryId || categoryId === "all") {
    return products;
  }

  return products.filter((p) => matchProductToCategory(p) === categoryId);
}
