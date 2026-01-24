
import { UNIVERSAL_CATEGORIES } from "./frontend/src/lib/universalCategories";

console.log("Categories found:", UNIVERSAL_CATEGORIES.length);
UNIVERSAL_CATEGORIES.forEach(c => {
    console.log(`Category: ${c.label}, Spectrum items: ${c.spectrum.length}`);
    c.spectrum.forEach(s => {
        console.log(`  - Sub: ${s.label}, Image: ${s.image}`);
    });
});
