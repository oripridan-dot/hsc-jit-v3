/**
 * SpecificationsPanel Component
 * Expandable product specifications view
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../../types';

interface SpecificationsPanelProps {
  product: Product;
}

export function SpecificationsPanel({ product }: SpecificationsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['general']);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  // Organize specs into sections
  const sections = {
    general: {
      title: 'General',
      items: {
        'Product ID': product.id,
        'Product Name': product.name,
        'Brand': product.brand,
        ...(product.category && { 'Category': product.category }),
        ...(product.production_country && { 'Country': product.production_country }),
      },
    },
    physical: {
      title: 'Physical Specifications',
      items: {
        ...(product.dimensions?.width && { 'Width': `${product.dimensions.width} mm` }),
        ...(product.dimensions?.height && { 'Height': `${product.dimensions.height} mm` }),
        ...(product.dimensions?.depth && { 'Depth': `${product.dimensions.depth} mm` }),
        ...(product.dimensions?.weight && { 'Weight': `${product.dimensions.weight} kg` }),
      },
    },
    details: {
      title: 'Technical Details',
      items: product.specs,
    },
    additional: {
      title: 'Additional Info',
      items: {
        ...(product.warranty && { 'Warranty': product.warranty }),
        ...(product.availability && { 'Availability': product.availability }),
        ...(product.tags && product.tags.length > 0 && { 'Tags': product.tags.join(', ') }),
      },
    },
  };

  // Filter out empty sections
  const activeSections = Object.entries(sections).filter(([_, section]) => Object.keys(section.items).length > 0);

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {activeSections.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">No specifications available</p>
        </div>
      ) : (
        activeSections.map(([key, section]) => (
          <div
            key={key}
            className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/30"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(key)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
              <h3 className="font-semibold text-slate-100 text-sm">{section.title}</h3>
              <motion.svg
                animate={{ rotate: expandedSections.includes(key) ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </motion.svg>
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {expandedSections.includes(key) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-700/50"
                >
                  <div className="px-4 py-3 space-y-2">
                    {Object.entries(section.items).map(([specKey, specValue]) => (
                      <div key={specKey} className="flex justify-between items-start gap-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {specKey}
                        </span>
                        <span className="text-sm text-slate-200 text-right font-medium">
                          {typeof specValue === 'object'
                            ? JSON.stringify(specValue)
                            : String(specValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))
      )}
    </div>
  );
}
