import { motion } from "framer-motion";
import React, { useMemo } from "react";
import { cn } from "../../lib/utils";
import type { Product } from "../../types";
import { RackModule } from "./RackModule";

/**
 * ModularRack - Complete rack system container
 * Organizes multiple RackModules (subcategories) into a cohesive display
 *
 * Features:
 * - Stacked vertical modules (like a synthesizer rack)
 * - Each module is a subcategory
 * - Consistent spacing and alignment
 * - Familiar layout for musicians/producers
 */

interface ModularRackProps {
  categoryName: string;
  subcategories: Array<{
    name: string;
    products: Product[];
    icon?: React.ReactNode;
    color?: string;
  }>;
  className?: string;
}

export const ModularRack: React.FC<ModularRackProps> = ({
  categoryName,
  subcategories,
  className,
}) => {
  // Filter out empty subcategories
  const activeModules = useMemo(
    () => subcategories.filter((sub) => sub.products.length > 0),
    [subcategories],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const moduleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  if (activeModules.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500">No subcategories available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Rack Header */}
      <div className="mb-8 pb-6 border-b border-zinc-700/50">
        <h2 className="text-3xl font-bold text-white mb-2">{categoryName}</h2>
        <p className="text-sm text-zinc-400">
          {activeModules.length} modular unit
          {activeModules.length !== 1 ? "s" : ""} •{" "}
          {activeModules.reduce((sum, m) => sum + m.products.length, 0)} total
          products
        </p>
      </div>

      {/* Rack Container with vertical stacking */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {activeModules.map((subcategory, index) => (
          <motion.div
            key={subcategory.name}
            variants={moduleVariants}
            className="relative"
          >
            {/* Rack slot indicator (left side) */}
            <div className="absolute -left-8 top-0 bottom-0 flex items-center justify-center text-zinc-600/50 font-mono text-xs font-bold">
              [{String(index + 1).padStart(2, "0")}]
            </div>

            {/* The actual module */}
            <RackModule
              subcategoryName={subcategory.name}
              products={subcategory.products}
              icon={subcategory.icon}
              color={subcategory.color}
            />

            {/* Connection line to next module (if not last) */}
            {index < activeModules.length - 1 && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-zinc-700/50 to-transparent" />
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Rack Footer */}
      <div className="mt-12 pt-6 border-t border-zinc-700/50 text-center">
        <p className="text-xs text-zinc-500 font-mono tracking-widest">
          ■ RACK SYSTEM v3.8 • MODULAR ARCHITECTURE •{" "}
          {categoryName.toUpperCase()} ■
        </p>
      </div>
    </div>
  );
};
