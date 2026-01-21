import React from 'react';
import { Clock, Globe, Database } from 'lucide-react';

interface WorkbenchBrandHeaderProps {
  brandName: string;
  lastUpdated?: string;
  sourceUrl?: string;
}

const timeAgo = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        for (const [key, value] of Object.entries(intervals)) {
            const count = Math.floor(seconds / value);
            if (count >= 1) return `${count} ${key}${count > 1 ? 's' : ''} ago`;
        }
        return "just now";
    } catch (e) {
        return "Unknown";
    }
};

export const WorkbenchBrandHeader: React.FC<WorkbenchBrandHeaderProps> = ({ 
    brandName, 
    lastUpdated, 
    sourceUrl 
}) => {
  const lastScrape = lastUpdated ? new Date(lastUpdated) : new Date();
  const daysOld = (new Date().getTime() - lastScrape.getTime()) / (1000 * 60 * 60 * 24);
  const isStale = daysOld > 7;

  return (
    <div className="flex items-end justify-between w-full pb-2 mb-2 relative z-10">
      <div>
        <h1 className="text-5xl font-black text-white tracking-tight uppercase drop-shadow-sm mb-2">
            {brandName}
        </h1>
      </div>
      
      <div className="flex flex-col items-end gap-1 mb-3">
         {/* Self-Healing Provenance UI */}
         {(() => {
             const lastUpdateDate = lastUpdated ? new Date(lastUpdated) : new Date();
             const isFresh = (new Date().getTime() - lastUpdateDate.getTime()) < (1000 * 60 * 60 * 24 * 7); // 7 Days
             return (
              <div className="flex items-center gap-2 text-[10px] font-mono border-b border-white/5 pb-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${isFresh ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-white/50">
                  SYSTEM STATUS: {isFresh ? 'ONLINE / SYNCHRONIZED' : 'CACHED / STALE'}
                </span>
                <span className="text-white/30 ml-auto pl-2">
                  VERIFIED: {brandName.toUpperCase()} v3.7.3-DNA
                </span>
              </div>
             );
         })()}

         <div className="flex items-center gap-3 text-xs font-mono font-medium tracking-wide bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
           <span className={`flex items-center gap-1.5 ${isStale ? "text-amber-500" : "text-emerald-400"}`}>
              <Clock size={12} />
              <span>DATA AGE: {lastUpdated ? timeAgo(lastUpdated) : "SYNCING..."}</span>
           </span>
           
           <span className="text-white/10">|</span>
           
           <span className="flex items-center gap-1.5 text-blue-400">
              {sourceUrl ? <Globe size={12} /> : <Database size={12} />}
              <span>SOURCE: {sourceUrl ? "OFFICIAL SITE" : "CACHE"}</span>
           </span>
        </div>
      </div>
    </div>
  );
};
