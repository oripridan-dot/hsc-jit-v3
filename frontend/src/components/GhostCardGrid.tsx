import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  price?: number;
  matchScore: number;
}

interface GhostCardGridProps {
  products: Product[];
  query: string;
  onCardSelect: (product: Product) => void;
  isLoading?: boolean;
}

// Card state definitions based on match confidence
const cardStateConfig = {
  ghost_5: {
    // 100+ potential matches
    size: 'w-12 h-16',
    opacity: 0.15,
    blur: 'blur-lg',
    content: 'none',
    clickable: false,
    zIndex: 1,
  },
  ghost_4: {
    // 50-100 matches
    size: 'w-20 h-28',
    opacity: 0.3,
    blur: 'blur-md',
    content: 'logo-only',
    clickable: false,
    zIndex: 2,
  },
  ghost_3: {
    // 20-50 matches
    size: 'w-32 h-44',
    opacity: 0.5,
    blur: 'blur-sm',
    content: 'basic',
    clickable: true,
    zIndex: 3,
  },
  ghost_2: {
    // 5-20 matches
    size: 'w-48 h-64',
    opacity: 0.75,
    blur: 'blur-none',
    content: 'full',
    clickable: true,
    zIndex: 4,
  },
  ghost_1: {
    // 1-5 matches
    size: 'w-64 h-96',
    opacity: 0.95,
    blur: 'blur-none',
    content: 'full',
    clickable: true,
    zIndex: 5,
  },
};

function getCardState(score: number): keyof typeof cardStateConfig {
  if (score > 0.9) return 'ghost_1';
  if (score > 0.7) return 'ghost_2';
  if (score > 0.5) return 'ghost_3';
  if (score > 0.3) return 'ghost_4';
  return 'ghost_5';
}

const GhostCard: React.FC<{
  product: Product;
  state: keyof typeof cardStateConfig;
  onClick: () => void;
}> = ({ product, state, onClick }) => {
  const config = cardStateConfig[state];

  const canClick = config.clickable && state !== 'ghost_5' && state !== 'ghost_4';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: config.opacity,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={canClick ? onClick : undefined}
      className={`
        ${config.size}
        ${config.blur}
        relative rounded-lg overflow-hidden
        ${canClick ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'}
        bg-slate-800 border border-slate-700/30
        flex flex-col items-center justify-center
      `}
      style={{ zIndex: config.zIndex }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 to-slate-900/10" />

      {/* Image */}
      {product.image && (state !== 'ghost_5') && (
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-1 mix-blend-multiply"
        />
      )}

      {/* Text content for ghost_2 and ghost_1 */}
      {config.content === 'full' && (
        <div className="absolute inset-0 flex flex-col items-center justify-end p-2 bg-gradient-to-t from-slate-950/80 to-transparent">
          {product.brand && (
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              {product.brand}
            </p>
          )}
          <p className="text-[11px] font-semibold text-white text-center line-clamp-2 mb-1">
            {product.name}
          </p>
          {product.price && (
            <p className="text-[10px] text-green-400 font-bold">
              ${product.price.toFixed(0)}
            </p>
          )}
          {state === 'ghost_1' && (
            <div className="mt-1 text-[9px] text-blue-300 font-bold">
              {Math.round(product.matchScore * 100)}% Match
            </div>
          )}
        </div>
      )}

      {/* Logo-only for ghost_4 */}
        {config.content === 'logo-only' && product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="w-8 h-8 object-contain"
          />
      )}

        {/* Brand badge for higher states */}
        {(state === 'ghost_3' || state === 'ghost_2' || state === 'ghost_1') && product.image && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full border border-white/40 flex items-center justify-center overflow-hidden">
            <img
              src={product.image}
              alt={product.brand}
              className="w-4 h-4 object-contain"
            />
          </div>
        )}
    </motion.div>
  );
};

export const GhostCardGrid: React.FC<GhostCardGridProps> = ({
  products,
  query,
  onCardSelect,
  isLoading,
}) => {
  // Calculate match scores and sort
  const cardsWithStates = useMemo(() => {
    return products
      .sort((a, b) => b.matchScore - a.matchScore)
      .map(product => ({
        ...product,
        state: getCardState(product.matchScore),
      }));
  }, [products]);

  // Get tier distribution for display
  const tierCounts = useMemo(() => {
    const tiers = {
      exact: cardsWithStates.filter(c => c.matchScore > 0.9).length,
      high: cardsWithStates.filter(c => c.matchScore > 0.7 && c.matchScore <= 0.9).length,
      medium: cardsWithStates.filter(c => c.matchScore > 0.5 && c.matchScore <= 0.7).length,
      low: cardsWithStates.filter(c => c.matchScore > 0.3 && c.matchScore <= 0.5).length,
      veryLow: cardsWithStates.filter(c => c.matchScore <= 0.3).length,
    };
    return tiers;
  }, [cardsWithStates]);

  if (products.length === 0 && query.length > 0 && !isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-slate-400">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-lg font-medium">No products found for "{query}"</p>
        <p className="text-sm mt-2">Try searching with different keywords</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Live count display */}
      {query && !isLoading && (
        <div className="text-center text-slate-300 text-sm font-medium">
          Currently showing: <span className="text-blue-400 font-bold">{products.length}</span> products
          {query.length > 0 && (
            <span className="ml-2 text-slate-500">
              (exact: {tierCounts.exact}, high: {tierCounts.high}, medium: {tierCounts.medium})
            </span>
          )}
        </div>
      )}

      {/* Cards grid */}
      <div className="flex flex-wrap gap-3 justify-center items-center min-h-[500px] p-6 bg-gradient-to-br from-slate-950/40 to-slate-900/40 rounded-2xl backdrop-blur-sm border border-slate-800/30">
        <AnimatePresence mode="popLayout">
          {cardsWithStates.map(card => (
            <GhostCard
              key={card.id}
              product={card}
              state={card.state}
              onClick={() => onCardSelect(card)}
            />
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      {query && cardsWithStates.length > 0 && (
        <div className="text-center text-slate-400 text-xs">
          ↓ Keep typing to refine or tap a card ↓
        </div>
      )}
    </div>
  );
};
