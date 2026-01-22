/**
 * Breadcrumbs - Journey Indicator
 * Shows the user's navigation path through the catalog hierarchy
 * Serves as both visual indicator and quick navigation shortcut
 */

import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import React from "react";
import { useNavigationStore } from "../../store/navigationStore";
import { brandThemes } from "../../styles/brandThemes";

export interface BreadcrumbItem {
  id: string;
  label: string;
  level: "galaxy" | "brand" | "category" | "product";
  action: () => void;
}

export const Breadcrumbs: React.FC = () => {
  const {
    currentLevel,
    activePath,
    currentBrand,
    currentCategory,
    selectedProduct,
    warpTo,
  } = useNavigationStore();

  // Build breadcrumb trail based on current navigation state
  const items: BreadcrumbItem[] = [];

  // Always start with home
  items.push({
    id: "galaxy",
    label: "Catalog",
    level: "galaxy",
    action: () => warpTo("galaxy", []),
  });

  // Add brand if selected
  if (currentBrand || activePath[0]) {
    const brandName = currentBrand?.name || activePath[0];
    items.push({
      id: activePath[0] || "unknown",
      label: brandName,
      level: "brand",
      action: () => warpTo("brand", [activePath[0] || ""]),
    });
  }

  // Add category if selected
  if (
    currentCategory ||
    (activePath.length > 1 && currentLevel !== "product")
  ) {
    const categoryName = currentCategory || activePath[1];
    items.push({
      id: categoryName || "unknown",
      label: categoryName || "Category",
      level: "category",
      action: () => warpTo("family", [activePath[0] || "", categoryName || ""]),
    });
  }

  // Add product if selected
  if (selectedProduct) {
    items.push({
      id: selectedProduct.id,
      label: selectedProduct.name,
      level: "product",
      action: () => {
        // Product is already selected, clicking again could expand details
      },
    });
  }

  // Get brand color for visual theming
  const brandColor: string =
    (currentBrand?.color as string) ||
    brandThemes[activePath[0]?.toLowerCase()]?.colors?.primary ||
    "#0ea5e9"; // cyan default

  return (
    <nav className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-panel)]/40 border-b border-[var(--border-subtle)] overflow-x-auto">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => warpTo("galaxy", [])}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-panel)] transition-colors"
        title="Back to Catalog"
      >
        <Home size={16} className="text-[var(--text-secondary)]" />
      </motion.button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.id}>
            {/* Separator */}
            {index > 0 && (
              <ChevronRight
                size={16}
                className="flex-shrink-0 text-[var(--text-tertiary)]"
              />
            )}

            {/* Breadcrumb Item */}
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={item.action}
              disabled={isLast}
              className={`flex-shrink-0 px-3 py-1 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                isLast
                  ? "cursor-default text-[var(--text-primary)] font-semibold"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-panel)] hover:text-[var(--text-primary)] cursor-pointer"
              }`}
              style={
                isLast
                  ? ({
                      color: brandColor,
                      backgroundColor: `${brandColor}15`,
                    } as React.CSSProperties)
                  : ({} as React.CSSProperties)
              }
            >
              {item.label}
            </motion.button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
