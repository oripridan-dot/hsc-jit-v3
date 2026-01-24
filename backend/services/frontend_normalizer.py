# backend/services/frontend_normalizer.py
from typing import List, Dict, Any, Optional
from models.product_hierarchy import ProductCore
from models.category_consolidator import consolidate_category

class FrontendNormalizer:
    
    @staticmethod
    def normalize_product(product: ProductCore) -> Dict[str, Any]:
        """
        Transforms Backend Product -> Frontend UI Payload
        """
        # 1. Determine Tribe
        # Prefer explicit manual assignment if available, else infer
        raw_cat = product.subcategory or product.main_category
        tribe_id = product.tribe_assignment or consolidate_category(raw_cat)
        
        # IMPROVED INFERENCE: If Accessories (fallback), try to guess from Name + Brand
        if tribe_id == "accessories":
             # Construct a rich string to test against keywords logic in consolidator
             # We reuse the consolidate_category function but pass it the product name/brand
             rich_text = f"{product.brand} {product.name} {product.main_category}"
             better_tribe = consolidate_category(rich_text)
             # Only override if it found something specific (not accessories again)
             if better_tribe != "accessories":
                 tribe_id = better_tribe

        # 2. Generate Filters (Layer 3)
        filters = FrontendNormalizer._generate_layer3_filters(product, tribe_id)
        
        # 3. Generate Specs Preview (For the Hover Screen)
        specs_preview = FrontendNormalizer._generate_preview_specs(product, tribe_id)
        
        # 4. Resolve Image
        image_url = "/assets/placeholders/no-img.png"
        if product.images:
             # Find first main image or just take the first one
             image_url = product.images[0].url

        return {
            "id": product.id,
            "brand": product.brand.upper(),
            "name": product.name,
            "sku": product.sku or "N/A",
            "price": product.pricing.regular_price if product.pricing else 0,
            "status": product.status.value.upper(),
            
            # Navigation Data
            "tribe_id": tribe_id,
            "subcategory_id": product.subcategory or "general", # Used for finer sorting if needed
            "filters": filters, # The 1176 Buttons!
            
            # Visuals
            "image_url": image_url,
            "logo_url": f"/assets/logos/{product.brand.lower()}.png", # Ensure these exist!
            
            # UX Data
            "specs_preview": specs_preview,
            
            # Full Data for 'Flight Case' Modal
            "description": product.description,
            "features": product.features,
            "tech_specs": [s.model_dump() for s in product.specifications],
            "manuals": product.manual_urls,
            "drivers": product.support_url
        }

    @staticmethod
    def _generate_layer3_filters(product: ProductCore, tribe_id: str) -> List[str]:
        """Auto-tags products with filter keywords based on their metadata"""
        filters = set()
        text = (product.name + " " + product.description).lower()
        
        # Add Brand
        filters.add(product.brand.title())

        # Tribe-Specific Logic
        if tribe_id == "guitars-bass":
            if "electric" in text: filters.add("Electric")
            if "acoustic" in text: filters.add("Acoustic")
            if "bass" in text: filters.add("Bass")
            if "strat" in text: filters.add("Strat")
            if "tele" in text: filters.add("Tele")
            if "les paul" in text: filters.add("LP Style")
            
        elif tribe_id == "drums-percussion":
            if "snare" in text: filters.add("Snare")
            if "ride" in text: filters.add("Ride")
            if "crash" in text: filters.add("Crash")
            if "electronic" in text: filters.add("Electronic")
            if "kit" in text: filters.add("Kits")

        elif tribe_id == "keys-production":
            if "analog" in text: filters.add("Analog")
            if "digital" in text: filters.add("Digital")
            if "synth" in text: filters.add("Synthesizers")
            if "piano" in text: filters.add("Pianos")
            if "88" in text: filters.add("88-Key")
            
        elif tribe_id == "studio-recording":
            if "interface" in text: filters.add("Interfaces")
            if "monitor" in text: filters.add("Monitors")
            if "condenser" in text: filters.add("Condenser")
            if "dynamic" in text: filters.add("Dynamic")

        return list(filters)

    @staticmethod
    def _generate_preview_specs(product: ProductCore, tribe_id: str) -> List[Dict[str, str]]:
        """Extracts the top 4 specs for the spectrum hover display"""
        specs = []
        # Convert list of objs to dict for easy lookup
        spec_map = {s.key.lower(): s.value for s in product.specifications}
        
        keys_to_find = []
        if tribe_id == "guitars-bass":
            keys_to_find = ["body", "neck", "fretboard", "pickups"]
        elif tribe_id == "drums-percussion":
            keys_to_find = ["shell", "size", "material", "finish"]
        elif tribe_id == "keys-production":
            keys_to_find = ["keys", "polyphony", "engine", "io"]
        else:
            keys_to_find = ["type", "freq response", "inputs", "outputs"]
            
        for k in keys_to_find:
            # Fuzzy find key
            found = next((val for key, val in spec_map.items() if k in key), None)
            if found:
                specs.append({"key": k.upper(), "val": found[:20]}) # Truncate for UI
        
        # Fill remaining slots if specific keys weren't found
        if len(specs) < 4:
            for k, v in spec_map.items():
                if len(specs) >= 4: break
                specs.append({"key": k.upper()[:10], "val": v[:20]})
                
        return specs
