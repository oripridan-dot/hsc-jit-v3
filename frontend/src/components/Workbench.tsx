/**
 * Workbench - Center Pane (Mission Control)
 * Shows: Galaxy view OR Product cockpit depending on nav level
 */
import React from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { SignalFlowMap } from './SignalFlowMap';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';

export const Workbench: React.FC = () => {
  const { currentLevel, selectedProduct, activePath, goBack, ecosystem } = useNavigationStore();

  // Galaxy View - show all domains as interactive cards
  if (currentLevel === 'galaxy') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
            HALILIT UNIVERSE
          </h1>
          <p className="text-slate-400 text-sm font-mono">
            Select a domain to begin exploration
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl">
          {ecosystem?.children?.map((domain) => (
            <button
              key={domain.name}
              onClick={() => {
                useNavigationStore.getState().warpTo('domain', [domain.name]);
                useNavigationStore.getState().toggleNode(domain.name);
              }}
              className="
                group relative overflow-hidden
                bg-gradient-to-br from-slate-800/50 to-slate-900/50
                border border-slate-700/50 rounded-xl p-6
                hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20
                transition-all duration-300
              "
            >
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-cyan-400 transition-colors">
                  {domain.name}
                </h3>
                <div className="text-3xl font-bold text-cyan-400/80 mb-1">
                  {domain.product_count || 0}
                </div>
                <p className="text-xs text-slate-500 font-mono">PRODUCTS</p>
              </div>
              
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Product Cockpit - detailed view of selected product
  if (currentLevel === 'product' && selectedProduct) {
    return (
      <div className="h-full flex flex-col bg-slate-950/50 overflow-y-auto">
        {/* Back button + breadcrumb */}
        <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <FiArrowLeft />
              <span className="font-mono">BACK</span>
            </button>
            
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              {activePath.map((segment, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span>/</span>}
                  <span className="text-slate-400">{segment}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">
              {selectedProduct.name}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full font-mono">
                {selectedProduct.brand}
              </span>
              {selectedProduct.product_type && (
                <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-mono uppercase">
                  {selectedProduct.product_type}
                </span>
              )}
              {selectedProduct.price && (
                <span className="text-emerald-400 font-bold text-lg">
                  ₪{selectedProduct.price}
                </span>
              )}
            </div>
          </div>

          {/* Hero Image */}
          {selectedProduct.image_url && (
            <div className="w-full h-64 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/50">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Signal Flow Map */}
          {(selectedProduct.accessories?.length > 0 || selectedProduct.related?.length > 0) && (
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-400 tracking-wider mb-3">
                DEPENDENCIES & RELATIONSHIPS
              </h2>
              <SignalFlowMap product={selectedProduct} />
            </div>
          )}

          {/* Accessories */}
          {selectedProduct.accessories && selectedProduct.accessories.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-400 tracking-wider mb-3">
                REQUIRED ACCESSORIES
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedProduct.accessories.map((acc: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="text-sm text-slate-300 font-semibold">
                      {acc.name || acc.title}
                    </div>
                    {acc.price && (
                      <div className="text-xs text-emerald-400 mt-1">₪{acc.price}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Products */}
          {selectedProduct.related && selectedProduct.related.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-400 tracking-wider mb-3">
                RELATED PRODUCTS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {selectedProduct.related.map((rel: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="text-sm text-slate-300 font-semibold">
                      {rel.name || rel.title}
                    </div>
                    {rel.category && (
                      <div className="text-xs text-slate-500 mt-1">{rel.category}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="pt-4 border-t border-slate-800">
            <button className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              <FiExternalLink size={14} />
              <span>View on Official Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Intermediate View (Domain/Brand/Family selected)
  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-950/50 p-8">
      <button
        onClick={goBack}
        className="absolute top-4 left-4 flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <FiArrowLeft />
        <span className="font-mono">BACK</span>
      </button>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-200 mb-4">
          {activePath[activePath.length - 1]}
        </h2>
        <p className="text-slate-400 font-mono text-sm mb-8">
          Navigate deeper using the tree on the left
        </p>
        
        <div className="flex items-center gap-2 justify-center text-xs text-slate-500 font-mono">
          {activePath.map((segment, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              <span className="text-slate-400">{segment}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
