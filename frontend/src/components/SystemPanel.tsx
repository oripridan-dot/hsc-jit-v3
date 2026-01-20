/**
 * SystemPanel - System updates and scraping progress
 * Displays in Halileo Navigator for system-level notifications
 */
import React, { useEffect, useState } from 'react';
import { Loader, CheckCircle2, AlertCircle, Activity } from 'lucide-react';

interface ScrapeProgress {
  brand: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  current_product: number;
  total_products: number;
  current_file: string;
  elapsed_seconds: number;
  estimated_seconds_remaining: number | null;
  errors: string[];
}

export const SystemPanel: React.FC = () => {
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/data/scrape_progress.json');
        if (response.ok) {
          const data = await response.json();
          setScrapeProgress(data);
        } else {
          setScrapeProgress(null);
        }
      } catch {
        setScrapeProgress(null);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!scrapeProgress || scrapeProgress.status === 'idle') {
    return (
      <div className="p-3 text-center">
        <Activity size={16} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
        <p className="text-[9px] text-[var(--text-tertiary)]">No active system tasks</p>
      </div>
    );
  }

  const percentage = Math.round((scrapeProgress.current_product / scrapeProgress.total_products) * 100);
  const isActive = scrapeProgress.status === 'running';

  return (
    <div className="space-y-2">
      {/* Active Scraping Task */}
      {isActive && (
        <div className="bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent border-l-2 border-cyan-400 rounded-r-lg p-2.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Loader size={12} className="text-cyan-400 animate-spin" />
              <span className="text-[9px] font-bold text-cyan-300 uppercase tracking-wide">
                Scraping {scrapeProgress.brand}
              </span>
            </div>
            <div className="px-1.5 py-0.5 bg-cyan-500/20 rounded text-[7px] font-mono text-cyan-300 animate-pulse">
              LIVE
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] text-[var(--text-secondary)]">
                {scrapeProgress.current_product}/{scrapeProgress.total_products} products
              </span>
              <span className="text-[8px] font-mono text-cyan-400">{percentage}%</span>
            </div>
            <div className="h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Current File */}
          <div className="mb-2 p-1.5 bg-[var(--bg-app)]/50 rounded border border-cyan-500/20">
            <div className="text-[7px] text-[var(--text-tertiary)] uppercase mb-0.5">Current</div>
            <div className="text-[9px] text-[var(--text-primary)] truncate">
              {scrapeProgress.current_file}
            </div>
          </div>

          {/* Time Info */}
          <div className="grid grid-cols-2 gap-1.5 text-[8px]">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Elapsed</span>
              <span className="text-[var(--text-primary)] font-mono">{formatTime(scrapeProgress.elapsed_seconds)}</span>
            </div>
            {scrapeProgress.estimated_seconds_remaining !== null && (
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Remaining</span>
                <span className="text-cyan-400 font-mono">{formatTime(scrapeProgress.estimated_seconds_remaining)}</span>
              </div>
            )}
          </div>

          {/* Errors */}
          {scrapeProgress.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-cyan-500/20">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle size={10} className="text-yellow-400" />
                <span className="text-[7px] text-yellow-400 uppercase">
                  {scrapeProgress.errors.length} Warning{scrapeProgress.errors.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Task */}
      {scrapeProgress.status === 'complete' && (
        <div className="bg-emerald-500/10 border-l-2 border-emerald-400 rounded-r-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-300">
              {scrapeProgress.brand.toUpperCase()} Complete
            </span>
          </div>
          <p className="text-[8px] text-[var(--text-secondary)]">
            Successfully scraped {scrapeProgress.total_products} products in {formatTime(scrapeProgress.elapsed_seconds)}
          </p>
        </div>
      )}

      {/* Error State */}
      {scrapeProgress.status === 'error' && (
        <div className="bg-red-500/10 border-l-2 border-red-400 rounded-r-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertCircle size={12} className="text-red-400" />
            <span className="text-[9px] font-bold text-red-300">Scraping Failed</span>
          </div>
          <p className="text-[8px] text-[var(--text-secondary)]">
            {scrapeProgress.errors[0] || 'Unknown error occurred'}
          </p>
        </div>
      )}
    </div>
  );
};
