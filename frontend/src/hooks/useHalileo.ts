/**
 * useHalileo Hook - The "Brain" of Mission Control
 * 
 * Analyzes user context + product intelligence tags → Generates AI-like insights
 * This creates the "living assistant" feel without requiring a backend LLM.
 * 
 * Intelligence Sources:
 * 1. Product.halileo_context[] - Pre-calculated tags from forge_backbone.py
 * 2. User actions - Search queries, navigation patterns
 * 3. Product data quality - Features, specs, media availability
 * 
 * v3.7 - Static Intelligence Layer
 */
import { useState, useEffect } from 'react';
import { useNavigationStore } from '../store/navigationStore';

export type InsightType = 'info' | 'tip' | 'alert' | 'success';

export interface Insight {
    id: string;
    type: InsightType;
    message: string;
    action?: { label: string; onClick: () => void };
}

export const useHalileo = () => {
    const { selectedProduct, searchQuery } = useNavigationStore();
    const [insight, setInsight] = useState<Insight | null>(null);

    useEffect(() => {
        // --- PRIORITY 1: SEARCH MODE ---
        // User is actively searching - guide them
        if (searchQuery.length > 2) {
            setInsight({
                id: 'searching',
                type: 'info',
                message: `Scanning catalog for "${searchQuery}"...`,
            });
            return;
        }

        // --- PRIORITY 2: PRODUCT MODE ---
        // User selected a product - analyze context tags
        if (selectedProduct) {
            const tags = selectedProduct.halileo_context || [];

            // Intelligence Rule 1: Complex Workstations
            if (tags.includes('complex_device') && tags.includes('needs_manual')) {
                setInsight({
                    id: `manual-${selectedProduct.id}`,
                    type: 'tip',
                    message: `${selectedProduct.name} is a deep instrument. I've prioritized the Parameter Guide in the Docs tab.`,
                    action: {
                        label: 'View Docs',
                        onClick: () => {
                            // This will be wired to tab switching in Workbench
                            console.log('[Halileo] Action: Switch to Docs tab');
                        }
                    }
                });
                return;
            }

            // Intelligence Rule 2: Piano Action Focus
            if (tags.includes('action_focused')) {
                setInsight({
                    id: `action-${selectedProduct.id}`,
                    type: 'info',
                    message: "Keybed feel is critical here. Check the 'Specs' tab for action details (PHA-4/PHA-50).",
                });
                return;
            }

            // Intelligence Rule 3: Performance Instruments (Drums)
            if (tags.includes('performance_focused')) {
                setInsight({
                    id: `performance-${selectedProduct.id}`,
                    type: 'tip',
                    message: "Performance instrument detected. Focus on pad response and mesh head quality.",
                });
                return;
            }

            // Intelligence Rule 4: Sound Design Instruments
            if (tags.includes('sound_design_focused')) {
                setInsight({
                    id: `sound-${selectedProduct.id}`,
                    type: 'info',
                    message: "Sound design powerhouse. Explore modulation matrix and filter architecture in specs.",
                });
                return;
            }

            // Intelligence Rule 5: Tutorial Availability
            if (tags.includes('has_tutorials')) {
                setInsight({
                    id: `tutorials-${selectedProduct.id}`,
                    type: 'success',
                    message: "Video tutorials detected. Check the Overview tab for guided walkthroughs.",
                });
                return;
            }

            // Intelligence Rule 6: Pro vs Entry Tier Guidance
            if (tags.includes('pro_tier')) {
                setInsight({
                    id: `tier-${selectedProduct.id}`,
                    type: 'info',
                    message: "Professional-grade instrument. Comprehensive specs and manuals loaded.",
                });
                return;
            } else if (tags.includes('entry_tier')) {
                setInsight({
                    id: `tier-${selectedProduct.id}`,
                    type: 'info',
                    message: "Entry-level instrument. Perfect for beginners - simplified controls.",
                });
                return;
            }

            // Default: Data Integrity Confirmation
            const featureCount = selectedProduct.features?.length || 0;
            const specsCount = (selectedProduct.specs?.length || 0) + (selectedProduct.specifications?.length || 0);
            const manualCount = (selectedProduct as any).manual_urls?.length || 0;
            const imageCount = Array.isArray(selectedProduct.images) ? selectedProduct.images.length : 0;

            // Smart message based on what's available
            let smartMessage = "System ready";
            const resources = [];

            if (featureCount > 0) resources.push(`${featureCount} features`);
            if (specsCount > 0) resources.push(`${specsCount} specs`);
            if (manualCount > 0) resources.push(`${manualCount} manuals`);
            if (imageCount > 0) resources.push(`${imageCount} images`);

            if (resources.length > 0) {
                smartMessage += `. ${resources.join(", ")} loaded.`;
            } else {
                smartMessage += ". Product information available in overview.";
            }

            setInsight({
                id: `ready-${selectedProduct.id}`,
                type: 'success',
                message: smartMessage,
            });
        } else {
            // --- PRIORITY 3: IDLE MODE ---
            // No product selected - mission control standby
            setInsight({
                id: 'idle',
                type: 'info',
                message: "Halileo Systems Online. Select a mission target (Product) to begin.",
            });
        }
    }, [selectedProduct, searchQuery]);

    return { insight };
};
