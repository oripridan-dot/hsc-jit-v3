import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocketStore } from '../store/useWebSocketStore';

export const BrandCard: React.FC = () => {
  const { selectedBrand, actions } = useWebSocketStore();

  if (!selectedBrand) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={actions.closeBrandModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="
                relative 
                w-full max-w-md 
                bg-slate-900 
                border border-slate-700 
                rounded-2xl 
                shadow-2xl 
                overflow-hidden
                flex flex-col
            "
        >
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-6 border-b border-slate-800">
                <div className="absolute top-4 right-4 text-2xl filter drop-shadow-md cursor-help" title="Origin Country">
                    {/* Extract flag from HQ string if possible, or usually we have it in production_country but here it's Brand HQ */}
                    {selectedBrand.hq.includes('Japan') ? '🇯🇵' : '🌍'}
                </div>
                
                <img 
                    src={selectedBrand.logo_url} 
                    alt={selectedBrand.name} 
                    className="max-h-full max-w-[80%] object-contain filter drop-shadow-lg"
                />
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-bold text-white">{selectedBrand.name}</h2>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{selectedBrand.hq}</span>
                </div>
                
                <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedBrand.description || "No description available."}
                </p>

                {selectedBrand.founded && (
                    <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs text-slate-400 font-mono">
                        Est. {selectedBrand.founded}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                <a 
                    href={selectedBrand.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                >
                    Official Website <span>→</span>
                </a>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
