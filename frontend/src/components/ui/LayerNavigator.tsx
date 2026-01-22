/**
 * LayerNavigator - Hierarchical Multi-Level Tier Navigation
 * "Netflix-Style" Tier Bars with Scope Control
 */

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigationStore } from "../../store/navigationStore";
import { brandThemes } from "../../styles/brandThemes";
import type { Product } from "../../types";
import { CandyCard } from "./CandyCard";

interface LayerNavigatorProps {
  products: Product[];
  currentLevel: "brand" | "category" | "subcategory";
  onLayerChange?: (layer: string) => void;
  /**
   * If provided, these products are from multiple brands.
   * Show family/category tiers.
   */
  isMultiBrand?: boolean;
}

interface TierGroup {
  name: string;
  count: number;
  products: Product[];
}

/**
 * Extracts and groups products for the next layer
 */
const getNextLayerGroups = (
  products: Product[],
  currentLevel: "brand" | "category" | "subcategory",
): TierGroup[] => {
  const grouped: Record<string, Product[]> = {};

  products.forEach((p) => {
    let groupKey = "";

    switch (currentLevel) {
      case "brand":
        groupKey = p.category || "Uncategorized";
        break;
      case "category":
        groupKey = p.subcategory || "General";
        break;
      case "subcategory":
        // Terminal level - group by name to deduplicate or just show product
        groupKey = p.name;
        break;
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(p);
  });

  return Object.entries(grouped)
    .map(([name, items]) => ({
      name,
      count: items.length,
      products: items,
    }))
    .sort((a, b) => b.count - a.count);
};

const TierBar = ({
  group,
  brandColor,
  onSelect,
}: {
  group: TierGroup;
  brandColor: string;
  onSelect: (name: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [thumbnailSize, setThumbnailSize] = useState<"sm" | "md" | "lg">("md");

  // Most familiar products (first 10 for the strip if not expanded)
  const displayProducts = expanded
    ? group.products
    : group.products.slice(0, 15);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[var(--bg-panel)]/40 rounded-xl border border-[var(--border-subtle)] overflow-hidden flex flex-col mb-4 group/tier"
    >
      {/* Tier Header & Controls */}
      <div className="flex items-center gap-4 px-4 py-3 bg-black/20 border-b border-[var(--border-subtle)]/50">
        <button
          onClick={() => onSelect(group.name)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: brandColor }}
          />
          <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
            {group.name}
          </h3>
          <span className="text-xs font-mono text-[var(--text-tertiary)] px-2 py-0.5 rounded bg-white/5">
            {group.count}
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2 opacity-0 group-hover/tier:opacity-100 transition-opacity">
          {/* Scope Handles */}
          <button
            onClick={() => setThumbnailSize((s) => (s === "sm" ? "md" : "sm"))}
            className={`p-1.5 rounded hover:bg-white/10 ${thumbnailSize === "sm" ? "text-white" : "text-white/40"}`}
            title="Small Scope"
          >
            <Minimize2 size={14} />
          </button>
          <button
            onClick={() => setThumbnailSize((s) => (s === "lg" ? "md" : "lg"))}
            className={`p-1.5 rounded hover:bg-white/10 ${thumbnailSize === "lg" ? "text-white" : "text-white/40"}`}
            title="Large Scope"
          >
            <Maximize2 size={14} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors`}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      {/* Product Strip / Grid */}
      <div
        className={`
                relative p-4 overflow-x-auto custom-scrollbar transition-all duration-300
                ${expanded ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-visible" : "flex gap-4"}
            `}
      >
        {displayProducts.map((product) => (
          <div
            key={product.id}
            className={`
                            shrink-0 transition-all duration-300
                            ${thumbnailSize === "sm" ? "w-32" : thumbnailSize === "md" ? "w-48" : "w-64"}
                        `}
          >
            <CandyCard
              title={product.name}
              subtitle={product.model_number || product.description}
              image={
                product.image ||
                (product.images && product.images[0]) ||
                product.image_url
              }
              onClick={() => {
                useNavigationStore.getState().selectProduct(product);
              }}
            />
          </div>
        ))}

        {!expanded && group.count > 15 && (
          <button
            onClick={() => setExpanded(true)}
            className="shrink-0 w-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors group/more"
          >
            <span className="text-2xl font-light text-white/20 group-hover/more:text-white/50 mb-2">
              + {group.count - 15}
            </span>
            <span className="text-xs text-white/40 uppercase tracking-widest">
              View All
            </span>
          </button>
        )}
      </div>

      {/* Resizer Handle (Visual Only for now, toggles expand) */}
      <div
        className="h-1.5 w-full bg-black/40 hover:bg-[var(--brand-primary)]/50 cursor-ns-resize flex items-center justify-center transition-colors opacity-0 group-hover/tier:opacity-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-12 h-0.5 bg-white/20 rounded-full" />
      </div>
    </motion.div>
  );
};

export const LayerNavigator: React.FC<LayerNavigatorProps> = ({
  products,
  currentLevel,
  onLayerChange,
  isMultiBrand = false,
}) => {
  const { activePath, currentBrand, selectCategory } = useNavigationStore();

  const layers = useMemo(() => {
    return getNextLayerGroups(products, isMultiBrand ? "brand" : currentLevel);
  }, [products, currentLevel, isMultiBrand]);

  if (layers.length === 0) return null;

  const brandColor: string =
    (currentBrand?.color as string) ||
    brandThemes[activePath[0]?.toLowerCase()]?.colors?.primary ||
    "#0ea5e9";

  const handleLayerSelect = (layerName: string) => {
    if (onLayerChange) onLayerChange(layerName);
    if (currentBrand && !isMultiBrand) {
      selectCategory(currentBrand.id, layerName);
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      <AnimatePresence mode="popLayout">
        {layers.map((layer) => (
          <TierBar
            key={layer.name}
            group={layer}
            brandColor={brandColor}
            onSelect={handleLayerSelect}
          />
        ))}
      </AnimatePresence>

      <div className="flex justify-center py-8 opacity-50">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
          End of Stream
        </span>
      </div>
    </div>
  );
};
