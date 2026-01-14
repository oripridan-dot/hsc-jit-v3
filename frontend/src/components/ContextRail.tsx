import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { SmartImage } from './shared/SmartImage';

interface RelatedItem {
  id: string;
  name: string;
  category?: string;
  production_country?: string;
  type: string;
  image?: string;
}

export const ContextRail: React.FC = () => {
  const { relatedItems, actions } = useWebSocketStore();

  if (!relatedItems || relatedItems.length === 0) {
    return null;
  }

  const handleMicroCardClick = (item: RelatedItem) => {
    // Trigger a new lock_product event to navigate the hyperlink
    actions.navigateToProduct(item.id, `Tell me about this ${item.category || 'product'}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="bg-gradient-to-t from-bg-base to-bg-base/80 border-t border-border-base backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-4">Related Items & Accessories</p>
          
          {/* Horizontal Scrollable Container */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            <AnimatePresence>
              {relatedItems.map((item: RelatedItem, idx: number) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleMicroCardClick(item)}
                  className="
                    relative
                    flex-shrink-0
                    group
                    rounded-lg
                    overflow-hidden
                    bg-bg-surface
                    border border-border-base
                    hover:border-accent-primary/50
                    transition-all
                    duration-300
                    hover:shadow-lg
                    hover:shadow-accent-primary/10
                  "
                >
                  {/* Micro Card Content */}
                  <div className="flex flex-col w-32 p-3">
                    {/* Image or Icon */}
                    {item.image ? (
                      <div className="w-full h-24 bg-bg-card rounded mb-2 overflow-hidden flex items-center justify-center">
                        <SmartImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-bg-card rounded mb-2 flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                    
                    {/* Name and Category */}
                    <h3 className="text-xs font-semibold text-text-primary truncate group-hover:text-accent-primary transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-text-muted truncate mt-1">
                      {item.category || 'Product'}
                    </p>
                    
                    {/* Production Country Badge */}
                    {item.production_country && (
                      <p className="text-xs text-accent-success/80 mt-1 truncate">
                        {item.production_country}
                      </p>
                    )}
                    
                    {/* Relationship Badge */}
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-bg-surface-hover text-xs text-text-secondary rounded capitalize">
                        {item.type === 'compatible_accessories' ? 'Accessory' : item.type}
                      </span>
                    </div>
                  </div>

                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/0 to-accent-primary/0 group-hover:from-accent-primary/10 group-hover:to-accent-primary/5 transition-all duration-300 pointer-events-none" />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          <p className="text-xs text-text-muted mt-3">
            💡 Click any item to explore related products
          </p>
        </div>
      </motion.div>
    </div>
  );
};
