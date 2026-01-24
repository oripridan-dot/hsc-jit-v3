import React from 'react';
import { UNIVERSAL_CATEGORIES } from '../../lib/universalCategories';
import { useNavigationStore } from '../../store/navigationStore';
import * as LucideIcons from 'lucide-react';

export const GalaxyDashboard = () => {
  const { goToSpectrum } = useNavigationStore();

  return (
    <div className="w-full h-full bg-[#0e0e10] p-6 lg:p-8 flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Header Area */}
      <div className="mb-8 flex items-end gap-4 shrink-0 px-2">
        <h1 className="text-4xl font-black italic tracking-tighter text-white/90">
          GALAXIES
          <span className="block text-sm font-bold not-italic tracking-widest text-zinc-500 mt-1">
            SECTOR VIEW
          </span>
        </h1>
        <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent mb-3" />
      </div>

      {/* The Shelf Rack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 pb-10">
        {UNIVERSAL_CATEGORIES.map((tribe, index) => {
          // Dynamic Icon Resolution
          const IconComponent = (LucideIcons as any)[tribe.iconName] || LucideIcons.HelpCircle;

          return (
            <div 
              key={tribe.id} 
              className="group relative bg-[#18181b] rounded-t-xl overflow-hidden shadow-2xl flex flex-col"
              style={{
                boxShadow: `0 20px 40px -10px rgba(0,0,0,0.5)`
              }}
            >
              {/* Shelf Top (The "Lip") */}
              <div className="relative h-14 bg-[#202023] border-b border-black flex items-center px-4 justify-between z-10 transition-colors duration-300 group-hover:bg-[#25252a]">
                 {/* Top Highlight for 3D effect */}
                 <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
                 
                 <div className="flex items-center gap-3">
                   <div 
                      className="w-8 h-8 rounded flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: tribe.color }}
                   >
                      <IconComponent className="w-5 h-5 text-black" />
                   </div>
                   <div>
                     <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-0.5">
                       SECTOR 0{index + 1}
                     </span>
                     <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-200 leading-none group-hover:text-white transition-colors">
                       {tribe.label}
                     </h2>
                   </div>
                 </div>

                 {/* Decorative LEDs */}
                 <div className="flex gap-1.5 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 </div>
              </div>

              {/* The "Carved" Shelf Body */}
              <div className="relative bg-[#0a0a0c] p-2 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] border-t border-black min-h-[180px]">
                 
                 {/* Texture Overlay */}
                 <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent" />

                 {/* The Modules (Subcategories) */}
                 <div className="relative z-10 grid grid-cols-3 gap-2">
                    {tribe.spectrum.slice(0, 6).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => goToSpectrum(tribe.id, sub.id, [])}
                        className="group/item relative flex flex-col items-center justify-between rounded-lg bg-[#030303] overflow-hidden transition-all duration-300 hover:bg-[#050505] shadow-[inset_0_2px_4px_rgba(0,0,0,1)] border border-white/5"
                      >
                         {/* 1. Deep Shadow Layer (The Recess) */}
                         <div className="absolute inset-0 pointer-events-none shadow-[inset_0_5px_15px_rgba(0,0,0,0.95)] z-20 rounded-lg" />
                         
                         {/* 2. Soft Illumination (The "Dimmed Light") */}
                         <div 
                            className="absolute inset-x-0 top-0 h-[80%] opacity-15 group-hover/item:opacity-30 transition-opacity duration-500"
                            style={{
                              background: `radial-gradient(circle at 50% 0%, ${tribe.color}, transparent 70%)`
                            }}
                         />

                         {/* 3. Product Thumbnail - Standardized Size & Crop */}
                         <div className="relative w-full aspect-square flex items-center justify-center p-4 z-10">
                           <img 
                             src={sub.image} 
                             alt={sub.label}
                             className="w-full h-full object-contain filter brightness-[0.7] contrast-[1.1] group-hover/item:brightness-100 group-hover/item:scale-110 transition-all duration-300 drop-shadow-2xl"
                           />
                         </div>

                         {/* 4. Label Plate */}
                         <div className="w-full py-2 bg-[#08080a] border-t border-white/5 z-20 flex items-center justify-center relative">
                            {/* Top bevel on plate */}
                            <div className="absolute top-0 inset-x-0 h-px bg-black/50" />
                            
                            <span 
                              className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover/item:text-zinc-300 transition-colors truncate px-2"
                            >
                              {sub.label}
                            </span>
                            
                            {/* Active Indicator Color */}
                            <div 
                                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover/item:opacity-100 transition-opacity"
                                style={{ backgroundColor: tribe.color }}
                            />
                         </div>
                      </button>
                    ))}
                 </div>
              </div>

               {/* Shelf Bottom Lip */}
               <div className="h-2 bg-[#202023] border-t border-white/5 shadow-lg relative rounded-b-xl">
                 <div className="absolute inset-x-0 bottom-0 h-px bg-black opacity-50" />
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
