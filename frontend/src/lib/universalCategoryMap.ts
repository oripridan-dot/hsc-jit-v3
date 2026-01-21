import type { Product } from '../types';

export const UNIVERSAL_CATEGORY_MAP: Record<string, string> = {
    "synthesizers": "Keys & Pianos",
    "digital pianos": "Keys & Pianos",
    "pianos": "Keys & Pianos",
    "keyboards": "Keys & Pianos",
    "stage pianos": "Keys & Pianos",
    "v-drums": "Drums & Percussion",
    "drums": "Drums & Percussion",
    "percussion": "Drums & Percussion",
    "cymbals": "Drums & Percussion",
    "guitar effects": "Guitars & Amps",
    "effects": "Guitars & Amps",
    "pedals": "Guitars & Amps",
    "amplifiers": "Guitars & Amps",
    "guitars": "Guitars & Amps",
    "studio monitors": "Studio & Recording",
    "monitors": "Studio & Recording",
    "audio interfaces": "Studio & Recording",
    "subwoofers": "Studio & Recording",
    "mixers": "Live Sound & PA",
    "speakers": "Live Sound & PA",
    "pa systems": "Live Sound & PA",
    "dj controllers": "DJ & Production",
    "microphones": "Microphones",
    "headphones": "Headphones",
    "cables": "Cables & Connectivity",
    "accessories": "Accessories",
};

export function getUniversalCategory(product: Product): string {
    // Try subcategory first, then category, then main_category
    const terms = [
        product.subcategory,
        product.category,
        // @ts-ignore - main_category might not be in strict type yet if older type definition
        product.main_category
    ].filter(Boolean) as string[];

    for (const term of terms) {
        const lower = term.toLowerCase();
        // Check for partial match against map keys
        for (const [key, cat] of Object.entries(UNIVERSAL_CATEGORY_MAP)) {
            if (lower.includes(key)) return cat;
        }
    }

    return "Accessories"; // Default fallback
}
