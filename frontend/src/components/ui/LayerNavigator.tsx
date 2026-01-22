/**
 * LayerNavigator - Hierarchical Multi-Level Button Navigation
 * When a category is selected, displays the next navigation layer as simple buttons
 * Allows drilling down through the taxonomy recursively
 */

import { AnimatePresence, motion } from "framer-motion";
import { Layers } from "lucide-react";
import React, { useMemo } from "react";
import { useNavigationStore } from "../../store/navigationStore";
import { brandThemes } from "../../styles/brandThemes";
import type { Product } from "../../types";

interface LayerNavigatorProps {
  products: Product[];
  currentLevel: "brand" | "category" | "subcategory";
  onLayerChange?: (layer: string) => void;
  /**
   * If provided, these products are from multiple brands.
   * Show family/category buttons instead.
   */
  isMultiBrand?: boolean;
}

/**
 * Extracts the next layer of organization from products
 * E.g., if currentLevel is "category", returns all subcategories
 */
const getNextLayer = (
  products: Product[],
  currentLevel: "brand" | "category" | "subcategory",
): Array<{ name: string; count: number; color?: string }> => {
  const grouped: Record<string, Set<string>> = {};

  products.forEach((p) => {
    let groupKey = "";

    switch (currentLevel) {
      case "brand":
        // Next layer: category (family)
        groupKey = p.category || "Uncategorized";
        break;
      case "category":
        // Next layer: subcategory
        groupKey = p.subcategory || "General";
        break;
      case "subcategory":
        // Next layer: individual products
        groupKey = p.name;
        break;
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = new Set();
    }
    grouped[groupKey].add(p.id);
  });

  return Object.entries(grouped)
    .map(([name, products]) => ({
      name,
      count: products.size,
    }))
    .sort((a, b) => b.count - a.count); // Sort by product count descending
};

export const LayerNavigator: React.FC<LayerNavigatorProps> = ({
  products,
  currentLevel,
  onLayerChange,
  isMultiBrand = false,
}) => {
  const { activePath, currentBrand, selectCategory } = useNavigationStore();

  // Generate button layers for next navigation level
  const layers = useMemo(() => {
    if (isMultiBrand) {
      // For multi-brand views, show category/family groupings
      return getNextLayer(products, "brand");
    }

    return getNextLayer(products, currentLevel);
  }, [products, currentLevel, isMultiBrand]);

  if (layers.length === 0) {
    return null; // No layers to navigate
  }

  const brandColor: string =
    (currentBrand?.color as string) ||
    brandThemes[activePath[0]?.toLowerCase()]?.colors?.primary ||
    "#0ea5e9";

  const handleLayerClick = (layerName: string) => {
    if (onLayerChange) {
      onLayerChange(layerName);
    }

    // Update store based on level
    if (currentBrand && !isMultiBrand) {
      selectCategory(currentBrand.id, layerName);
    }
  };

  const levelLabel = isMultiBrand
    ? "Categories"
    : currentLevel === "brand"
      ? "Categories"
      : "Subcategories";

  return (
    <div className="w-full bg-[var(--bg-panel)]/30 rounded-xl border border-[var(--border-subtle)]/50 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Layers
          size={16}
          style={{ color: brandColor } as React.CSSProperties}
        />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
          {levelLabel}
        </h3>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">
          {layers.length} items
        </span>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        <AnimatePresence>
          {layers.map((layer, index) => (
            <motion.button
              key={layer.name}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleLayerClick(layer.name)}
              className="relative p-3 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--text-primary)] bg-[var(--bg-app)]/20 hover:bg-[var(--bg-panel)] transition-all group text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-center overflow-hidden"
              style={{
                borderColor: `${brandColor}40`,
              }}
              onMouseEnter={(e) => {
                const elem = e.currentTarget as HTMLElement;
                elem.style.borderColor = brandColor;
                elem.style.backgroundColor = `${brandColor}15`;
              }}
              onMouseLeave={(e) => {
                const elem = e.currentTarget as HTMLElement;
                elem.style.borderColor = `${brandColor}40`;
                elem.style.backgroundColor = "transparent";
              }}
            >
              {/* Background glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity"
                style={{
                  background: `radial-gradient(circle, ${brandColor}15, transparent)`,
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <span className="text-xs text-[var(--text-tertiary)] group-hover:text-[var(--brand-primary)]">
                  {layer.count}
                </span>
                <span className="line-clamp-2 text-[var(--text-primary)]">
                  {layer.name}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]/30 text-xs text-[var(--text-tertiary)]">
        <p>Click any {levelLabel.toLowerCase()} to explore further</p>
      </div>
    </div>
  );
};
