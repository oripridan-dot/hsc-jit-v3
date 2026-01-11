import React from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { SmartMessage } from './SmartMessage';

export const ChatView: React.FC = () => {
  const { messages, lastPrediction, relatedItems, actions, status } = useWebSocketStore();

  // Only show chat view if we have messages or if we are in a state that implies active conversation
  // status: LOCKED or ANSWERING or has messages
  const isActive = status === 'LOCKED' || status === 'ANSWERING' || messages.length > 0;

  if (!isActive) return null;

  return (
    <div className="w-full space-y-6">
       {/* Product Context Header */}
       {lastPrediction && (
           <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
               {/* Brand Button */}
               {lastPrediction.brand_identity && (
                  <button 
                      onClick={() => actions.openBrandModal(lastPrediction.brand_identity!)}
                      className="relative w-12 h-12 rounded-full bg-slate-200 p-2 hover:scale-105 active:scale-95 transition shadow-lg overflow-hidden flex-shrink-0 group"
                      title="View Brand Identity"
                  >
                      <img 
                        src={lastPrediction.brand_identity.logo_url} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
               )}
               
               <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg leading-tight flex flex-wrap items-center gap-2">
                      <span className="truncate">{lastPrediction.name}</span>
                      
                      {/* Production Country Badge */}
                      {lastPrediction.production_country && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                              Made in {lastPrediction.production_country}
                          </span>
                      )}
                  </h3>
                  <div className="text-sm text-slate-400 truncate">
                      {lastPrediction.brand_identity?.hq || lastPrediction.id}
                  </div>
               </div>
           </div>
       )}
       
       {/* Message Stream */}
       <div className="space-y-3 pl-2">
           {messages.length === 0 && status === 'LOCKED' && (
               <div className="text-slate-500 italic text-sm animate-pulse">
                   Engine locked. Requesting manuals...
               </div>
           )}
           
           {messages.map((msg, i) => {
               // Simple heuristic to style status messages differently from answer chunks
               const isStatus = msg.startsWith('[STATUS]');
               return isStatus ? (
                   <div key={i} className="text-emerald-400/80 text-xs font-mono uppercase tracking-widest pl-4 border-l-2 border-emerald-500/50">
                       {msg.replace('[STATUS]', '').trim()}
                   </div>
               ) : (
                   <div key={i} className="flex flex-col space-y-2">
                       <SmartMessage content={msg} relatedItems={relatedItems} />
                   </div>
               );
           })}
           
           {/* Source Verification Badge */}
           {messages.length > 0 && status === 'ANSWERING' && (
               <div className="flex items-center space-x-2 pt-2 pl-4 text-xs text-slate-400 border-t border-white/10">
                   <span>📖</span>
                   <span>Answered from Official Manual</span>
               </div>
           )}
       </div>
    </div>
  );
};
