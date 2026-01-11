import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocketStore } from '../store/useWebSocketStore';

export const GhostCard: React.FC = () => {
  const { lastPrediction, status, actions } = useWebSocketStore();
  
  // Show only when sniffing or locked (until answering starts taking over maybe?)
  // Blueprint says: SNIFFING -> Ghost Card. LOCKED -> Product is active.
  const isVisible = (status === 'SNIFFING' || status === 'LOCKED') && !!lastPrediction;

  if (!isVisible || !lastPrediction) return null;

  // Resilience for image path
  const imgUrl = lastPrediction.images?.main || lastPrediction.img;
  const brand = lastPrediction.brand_identity;
  
  const handleBrandClick = () => {
    if (brand) {
      actions.openBrandModal(brand);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={lastPrediction.id}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="
          fixed bottom-8 right-8 
          w-72 p-4 
          bg-slate-900/60 backdrop-blur-xl 
          border border-slate-700/50 
          rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]
          overflow-hidden
          z-50
        "
      >
        {/* Cinematic Glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Logo - Clickable */}
        {brand && brand.logo_url && (
          <button
            onClick={handleBrandClick}
            className="absolute top-4 left-4 z-20 group relative"
            title={`View ${brand.name} details`}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <img 
                src={brand.logo_url} 
                alt={brand.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </button>
        )}
        
        {imgUrl ? (
            <div className="relative w-full h-40 mb-3 bg-white/5 rounded-xl overflow-hidden flex items-center justify-center">
                <img 
                    src={imgUrl} 
                    alt={lastPrediction.name} 
                    className="max-w-full max-h-full object-contain p-2 hover:scale-110 transition-transform duration-500"
                />
            </div>
        ) : (
            <div className="w-full h-40 mb-3 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                No Image
            </div>
        )}
        
        <div className="relative z-10">
            <h3 className="text-white font-bold text-lg leading-tight mb-1">
                {lastPrediction.name}
            </h3>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                {lastPrediction.id}
            </p>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-3 right-3 flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
