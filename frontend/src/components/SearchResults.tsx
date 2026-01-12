import React, { useState } from 'react';
import { PriceDisplay } from './ui/PriceDisplay';
import { ConfidenceMeter } from './ui/ConfidenceMeter';

interface ProductResult {
  id: string;
  name: string;
  image: string;
  price: number;
  description: string;
  brand: string;
  manual_url?: string;
  score: number; // confidence
  specs: Record<string, string | number>;
}

interface SearchResultsProps {
  results: ProductResult[];
  loading?: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, loading }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4 w-full max-w-4xl mx-auto mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full bg-white rounded-xl shadow-sm animate-shimmer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto mt-8 perspective-1000">
      {results.map((product, idx) => {
        const isExpanded = expandedId === product.id;
        
        return (
          <div 
            key={product.id}
            onClick={() => setExpandedId(isExpanded ? null : product.id)}
            className={`
              relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer overflow-hidden
              ${isExpanded ? 'h-[800px] z-20 scale-100 ring-2 ring-blue-500/20' : 'h-48 hover:-translate-y-1 z-0'}
              animate-fade-in-up
            `}
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            {/* Compact View Content */}
            <div className="flex h-48 p-4 md:p-6">
              <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden mr-6">
                <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 hover:scale-110" />
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{product.brand}</h3>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{product.name}</h2>
                  </div>
                  <div className="text-right hidden md:block">
                     {/* Mini confidence metric for closed card */}
                     <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                       {Math.round(product.score * 100)}% Match
                     </div>
                  </div>
                </div>
                
                <p className="mt-2 text-gray-500 line-clamp-2 text-sm">{product.description}</p>
                
                <div className="mt-auto pt-2 flex items-center text-blue-600 font-medium text-sm group">
                  {isExpanded ? 'Show less' : 'View details & analytics'}
                  <svg className={`w-4 h-4 ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Content (Details) */}
            <div className={`
                absolute top-48 left-0 right-0 bottom-0 bg-gray-50/50 backdrop-blur-xl p-6 md:p-8 border-t border-gray-100 overflow-y-auto
                transition-opacity duration-500 delay-100
                ${isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'}
            `}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Col: Visuals & Metrics */}
                <div className="space-y-6">
                   <div className="bg-white p-6 rounded-2xl shadow-sm">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Market Analysis</h3>
                      <PriceDisplay price={product.price} />
                   </div>

                   <ConfidenceMeter 
                     score={product.score} 
                     reasoning={[
                       "Exact model name match",
                       "Technical specs align with query",
                       "Available in regional warehouses"
                     ]}
                   />
                </div>

                {/* Right Col: Specs & Manual */}
                <div className="space-y-6">
                   <div className="bg-white p-6 rounded-2xl shadow-sm">
                     <h3 className="text-lg font-semibold mb-4 text-gray-800">Key Specifications</h3>
                     <div className="grid grid-cols-2 gap-4">
                       {Object.entries(product.specs).map(([key, val], i) => (
                         <div key={key} className="p-3 bg-gray-50 rounded-lg animate-slide-in-right" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="text-xs text-gray-500 uppercase">{key}</div>
                            <div className="font-medium text-gray-900">{val}</div>
                         </div>
                       ))}
                     </div>
                   </div>

                   {product.manual_url && (
                     <a 
                       href={product.manual_url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="block w-full py-4 text-center bg-gray-900 hover:bg-black text-white rounded-xl font-medium transition-colors shadow-lg shadow-gray-200"
                     >
                       Download Official Manual (PDF)
                     </a>
                   )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
