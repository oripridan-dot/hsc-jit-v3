import { useEffect, useState } from "react";

// The Map Structure
type TaxonomyMap = Record<string, string>;

// Mapping between frontend display names and backend taxonomy keys
const CATEGORY_MAPPING: Record<string, string> = {
  "Keys & Pianos": "Keys",
  "Drums & Percussion": "Drums",
  "Guitars & Amps": "Guitar",
  "Studio & Recording": "Studio",
  "Live Sound": "PA",
  "DJ & Production": "DJ",
};

// Subcategory label normalization (frontend label → backend key)
const SUBCATEGORY_MAPPING: Record<string, string> = {
  // Keys
  Synthesizers: "Synthesizer",
  "MIDI Controllers": "Controller",
  Workstations: "Workstation",
  "Stage Pianos": "Stage Piano",

  // Drums
  "Drum Machines": "Drum Machine",
  "Electronic Drum Kits": "V-Drums",

  // Guitar
  Amplifiers: "Amplifier",
  "Effects Pedals": "Pedal",
  "Multi-Effects": "Multi-Effects",

  // Studio
  "Audio Interfaces": "Interface",
  "Studio Monitors": "Monitors",
  Microphones: "Microphone",
  "Outboard Gear": "Outboard",
  Preamps: "Preamp",

  // Live
  "PA Speakers": "Speaker",
  Mixers: "Mixer",
  "Digital Mixers": "Digital Mixer",

  // DJ
  "DJ Controllers": "Controller",
  Samplers: "Sampler",
  Production: "Production",
};

export const useTaxonomy = () => {
  const [map, setMap] = useState<TaxonomyMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/taxonomy.json")
      .then((res) => res.json())
      .then((data) => {
        setMap(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load taxonomy map:", err);
        setLoading(false);
      });
  }, []);

  /**
   * Resolves the best image for a given category context.
   * Tries: "Cat > Sub" -> "Cat" -> Default
   */
  const getVisual = (category: string, subcategory?: string): string => {
    if (!map) return "/assets/react.svg"; // Safe fallback

    // Normalize category name using mapping
    const normalizedCategory = CATEGORY_MAPPING[category] || category;

    // Normalize subcategory name
    const normalizedSubcategory = subcategory
      ? SUBCATEGORY_MAPPING[subcategory] || subcategory
      : undefined;

    // 1. Try Specific Subcategory
    if (normalizedCategory && normalizedSubcategory) {
      const key = `${normalizedCategory} > ${normalizedSubcategory}`;
      if (map[key]) return map[key];
    }

    // 2. Try Main Category
    if (map[normalizedCategory]) return map[normalizedCategory];

    // 3. Try fuzzy match (e.g., "Synthesizers" might match "Keys > Synthesizer")
    if (normalizedSubcategory) {
      const fuzzy = Object.keys(map).find((k) =>
        k.toLowerCase().includes(normalizedSubcategory.toLowerCase()),
      );
      if (fuzzy) return map[fuzzy];
    }

    return "/assets/react.svg"; // Final Fallback
  };

  return { getVisual, loading };
};
