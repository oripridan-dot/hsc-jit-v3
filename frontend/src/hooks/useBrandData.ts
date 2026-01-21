/**
 * useBrandData - Fetch brand information from the Single Source of Truth
 * 
 * 1. Primary Source: frontend/public/data/index.json (Fast, lightweight)
 * 2. Secondary Source: frontend/public/data/[brand].json (Deep details)
 * 3. NO HARDCODED METADATA
 */
import { useState, useEffect } from "react";
import { catalogLoader } from "../lib/catalogLoader";

export interface BrandData {
    id: string;
    name: string;
    brandColor: string;
    secondaryColor: string;
    textColor: string;
    logoUrl: string;
    website?: string;
    description?: string;
}

const DEFAULT_BRAND_COLOR = "#333333";
const DEFAULT_TEXT_COLOR = "#FFFFFF";

/**
 * useBrandData - Get brand metadata by brand name/id
 * @param brandName - Product brand ID or name (e.g., "roland", "boss")
 * @returns Brand data including colors and logo
 */
export const useBrandData = (brandName?: string): BrandData | null => {
    const [brandData, setBrandData] = useState<BrandData | null>(null);

    useEffect(() => {
        if (!brandName) {
            setBrandData(null);
            return;
        }

        const normalizedId = brandName.toLowerCase().trim();
        let isMounted = true;

        const loadData = async () => {
             try {
                // 1. Load Master Index (Lightweight)
                const index = await catalogLoader.loadIndex();
                
                // Find loose match
                const brandEntry = index.brands.find(b => 
                    b.id.toLowerCase() === normalizedId || 
                    b.name.toLowerCase() === normalizedId ||
                    (b as any).slug?.toLowerCase() === normalizedId
                );

                if (brandEntry && isMounted) {
                    // Start with basic data from Index
                    const initialData: BrandData = {
                        id: brandEntry.id,
                        name: brandEntry.name,
                        brandColor: brandEntry.brand_color || DEFAULT_BRAND_COLOR,
                        secondaryColor: brandEntry.brand_color ? `${brandEntry.brand_color}80` : "#666666", 
                        textColor: DEFAULT_TEXT_COLOR,
                        logoUrl: brandEntry.logo_url || "",
                        website: "",
                        description: `Catalog with ${brandEntry.product_count} products`
                    };
                    
                    setBrandData(initialData);

                    // 2. Try to get rich details if catalog is ALREADY loaded or available
                    // We optimistically check if we can get better data without blocking
                    try {
                        // Note: loadBrand caches results, so this isn"t expensive if already loaded
                        const fullCatalog = await catalogLoader.loadBrand(brandEntry.id);
                        
                        // Only update if we have better data AND still mounted
                        if (fullCatalog && fullCatalog.brand_identity && isMounted) {
                           const identity = fullCatalog.brand_identity;
                           
                           setBrandData(prev => {
                               if (!prev) return initialData; // Should not happen
                               
                               // Parse new colors if available
                               const newPrimary = identity.brand_colors?.primary;
                               const newSecondary = identity.brand_colors?.secondary;
                               
                               return {
                                    ...prev,
                                    name: identity.name || prev.name,
                                    brandColor: newPrimary || prev.brandColor,
                                    secondaryColor: newSecondary || prev.secondaryColor,
                                    logoUrl: identity.logo_url || prev.logoUrl,
                                    website: identity.website || prev.website,
                                    description: identity.description || prev.description
                               };
                           });
                        }
                    } catch (e) {
                         // Fallback is fine, we have index data
                         // console.debug("Could not load full catalog for brand detail", e);
                    }
                }
             } catch (err) {
                 console.warn(`Could not load brand data for ${brandName}`, err);
             }
        };

        loadData();

        return () => { isMounted = false; };
    }, [brandName]);

    return brandData;
};
