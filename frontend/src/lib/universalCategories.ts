/**
 * Universal Categories - UI Enrichment (v3.0 - Galaxy/Spectrum)
 *
 * Adds "Visual Cortex" (Icons & Thumbnails) to the "Logic Engine".
 * Maps Spectrum IDs to real product thumbnails.
 */

import type { Product } from "../types";
import {
  type ConsolidatedCategory,
  CONSOLIDATED_CATEGORIES,
  getConsolidatedProductCategory,
  type SpectrumDef
} from "./categoryConsolidator";

export interface SpectrumUIDef extends SpectrumDef {
  image: string;
}

export interface UniversalCategoryDef extends Omit<ConsolidatedCategory, "spectrum"> {
  iconName: string; // Lucide icon name override
  spectrum: SpectrumUIDef[];
}

// Map Spectrum ID -> Thumbnail Path
const SPECTRUM_IMAGES: Record<string, string> = {
  // GUITARS
  "electric-guitars": "/data/category_thumbnails/guitars-electric-guitars_thumb.webp",
  "acoustic-guitars": "/data/category_thumbnails/guitars-acoustic-guitars_thumb.webp",
  "bass-guitars": "/data/category_thumbnails/guitars-bass-guitars_thumb.webp",
  "guitar-amps": "/data/category_thumbnails/guitars-amplifiers_thumb.webp",
  "guitar-pedals": "/data/category_thumbnails/guitars-effects-pedals_thumb.webp",
  "folk-instruments": "/data/category_thumbnails/guitars-accessories_thumb.webp", // Placeholder
  "guitar-accessories": "/data/category_thumbnails/guitars-accessories_thumb.webp",

  // DRUMS
  "acoustic-drums": "/data/category_thumbnails/drums-acoustic-drums_thumb.webp",
  "electronic-drums": "/data/category_thumbnails/drums-electronic-drums_thumb.webp",
  "cymbals": "/data/category_thumbnails/drums-cymbals_thumb.webp",
  "snares": "/data/category_thumbnails/drums-acoustic-drums_thumb.webp", // Placeholder
  "sticks-heads": "/data/category_thumbnails/drums-accessories_thumb.webp",
  "percussion": "/data/category_thumbnails/drums-percussion_thumb.webp",
  "drum-hardware": "/data/category_thumbnails/drums-accessories_thumb.webp",

  // KEYS
  "synthesizers": "/data/category_thumbnails/keys-synths_thumb.webp",
  "stage-pianos": "/data/category_thumbnails/keys-stage-pianos_thumb.webp",
  "midi-controllers": "/data/category_thumbnails/keys-controllers_thumb.webp",
  "grooveboxes": "/data/category_thumbnails/keys-workstations_thumb.webp",
  "eurorack": "/data/category_thumbnails/keys-synths_thumb.webp",
  "keys-accessories": "/data/category_thumbnails/keys-accessories_thumb.webp",

  // STUDIO
  "audio-interfaces": "/data/category_thumbnails/studio-audio-interfaces_thumb.webp",
  "studio-monitors": "/data/category_thumbnails/studio-studio-monitors_thumb.webp",
  "studio-microphones": "/data/category_thumbnails/studio-microphones_thumb.webp",
  "outboard-gear": "/data/category_thumbnails/studio-outboard-gear_thumb.webp",
  "software-plugins": "/data/category_thumbnails/software-software_thumb.webp",
  "studio-accessories": "/data/category_thumbnails/studio-accessories_thumb.webp",

  // LIVE
  "pa-systems": "/data/category_thumbnails/live-pa-speakers_thumb.webp",
  "live-mixers": "/data/category_thumbnails/live-mixers_thumb.webp",
  "dj-equipment": "/data/category_thumbnails/dj-controllers_thumb.webp",
  "lighting": "/data/category_thumbnails/live-accessories_thumb.webp",
  "live-mics": "/data/category_thumbnails/live-wireless_thumb.webp",
  "live-accessories": "/data/category_thumbnails/live-accessories_thumb.webp",

  // UTILITY
  "cables": "/data/category_thumbnails/accessories-cables_thumb.webp",
  "stands": "/data/category_thumbnails/accessories-stands_thumb.webp",
  "cases-bags": "/data/category_thumbnails/accessories-cases_thumb.webp",
  "power-supplies": "/data/category_thumbnails/accessories-power_thumb.webp",
};

// Map Galaxy ID -> Lucide Icon Name
const GALAXY_ICONS: Record<string, string> = {
  "guitars-bass": "Guitar",
  "drums-percussion": "Music",
  "keys-production": "Piano",
  "studio-recording": "Mic2",
  "live-dj": "Speaker",
  "accessories-utility": "Plug",
};

export const UNIVERSAL_CATEGORIES: UniversalCategoryDef[] = CONSOLIDATED_CATEGORIES.map(galaxy => ({
  ...galaxy,
  iconName: GALAXY_ICONS[galaxy.id] || "HelpCircle",
  spectrum: galaxy.spectrum.map(spec => ({
    ...spec,
    image: SPECTRUM_IMAGES[spec.id] || "/data/category_thumbnails/default_thumb.webp"
  }))
}));

export function getUniversalCategory(id: string): UniversalCategoryDef | undefined {
  return UNIVERSAL_CATEGORIES.find((c) => c.id === id);
}

export function productMatchesSpectrum(
  product: Product,
  spectrumId: string
): boolean {
  const { spectrumId: productSpectrumId } = getConsolidatedProductCategory(product);
  return productSpectrumId === spectrumId;
}
