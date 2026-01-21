import React, { useMemo } from "react";
import type { Product } from "../../types";
import { TierBar } from "../smart-views/TierBar";
// Updated import path since ContextBadge was created in ui/ which is a sibling of views/
// Wait, components/ui and components/views are siblings.
// So relative path from views/UniversalCategoryView.tsx to ui/ContextBadge.tsx should be ../ui/ContextBadge
import { motion } from "framer-motion";

export const UniversalCategoryView: React.FC<{
  categoryTitle: string;
  products: Product[];
}> = ({ categoryTitle, products }) => {
  // 1. Group products by their functional sub-type
  // e.g. Input: "Keys" -> Output: { "Stage Pianos": [...], "Synthesizers": [...] }
  const lanes = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach((p) => {
      // Fallback to 'General' if subcategory is missing
      const sub = p.subcategory || "General";
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(p);
    });
    return groups;
  }, [products]);

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-app)] p-8 pb-32">
      {/* HERO */}
      <header className="mb-16 border-b border-[var(--border-subtle)] pb-8">
        <h1 className="text-6xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-2">
          {categoryTitle}
        </h1>
        <div className="flex gap-4 text-[var(--text-secondary)] font-mono text-xs">
          <span>{products.length} INSTRUMENTS</span>
          <span>•</span>
          <span>{Object.keys(lanes).length} CATEGORIES</span>
          <span>•</span>
          <span>{new Set(products.map((p) => p.brand)).size} BRANDS</span>
        </div>
      </header>

      {/* RENDER SWIMLANES */}
      <div className="space-y-24">
        {Object.entries(lanes).map(([subCat, items], index) => (
          <motion.section
            key={subCat}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Lane Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
              <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                {subCat}
              </h2>
            </div>

            {/* The "Tier Bar" component acts as the visualizer here */}
            {/* We enable 'showBrandBadges' so the TierBar uses our new ContextBadge logic */}
            <div className="h-[350px] bg-[var(--bg-panel)]/30 rounded-2xl border border-[var(--border-subtle)] p-4 relative">
              <TierBar
                products={items}
                showBrandBadges={true} // Triggers the multi-brand visual mode
                title="" // Hide title since we have the section header
              />
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
};
