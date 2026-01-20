import React, { useEffect, useState } from 'react';
import { FiLoader, FiCheck, FiAlertCircle, FiClock, FiFileText } from 'react-icons/fi';

interface ScrapeProgress {
  brand: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  current_product: number;
  total_products: number;
  current_file: string;
  files_scraped: string[];
  start_time: string;
  elapsed_seconds: number;
  estimated_seconds_remaining: number | null;
  last_update: string;
  errors: string[];
}

export const ScrapingMonitor: React.FC = () => {
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/data/scrape_progress.json');
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
          setIsVisible(data.status === 'running' || data.status === 'error');
        }
      } catch (error) {
        // Progress file doesn't exist or not accessible
        setIsVisible(false);
      }
    };

    // Poll every 2 seconds
    fetchProgress();
    const interval = setInterval(fetchProgress, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getStatusIcon = () => {
    if (!progress) return null;
    
    switch (progress.status) {
      case 'running':
        return <FiLoader className="animate-spin text-cyan-400" size={16} />;
      case 'complete':
        return <FiCheck className="text-green-400" size={16} />;
      case 'error':
        return <FiAlertCircle className="text-red-400" size={16} />;
      default:
        return null;
    }
  };

  if (!isVisible || !progress) return null;

  const percentage = progress.total_products > 0 
    ? Math.round((progress.current_product / progress.total_products) * 100)
    : 0;

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Scraping {progress.brand.toUpperCase()}
          </h3>
        </div>
        <div className="text-xs text-[var(--text-secondary)] font-mono">
          {progress.current_product}/{progress.total_products}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xs text-[var(--text-tertiary)] text-right">
          {percentage}%
        </div>
      </div>

      {/* Current File */}
      <div className="flex items-start gap-2 bg-[var(--bg-app)]/50 rounded-lg p-2">
        <FiFileText className="text-cyan-400 flex-shrink-0 mt-0.5" size={14} />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase text-[var(--text-tertiary)] mb-0.5">
            Current Product
          </div>
          <div className="text-xs text-[var(--text-primary)] truncate">
            {progress.current_file}
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[var(--bg-app)]/50 rounded-lg p-2">
          <div className="flex items-center gap-1.5 text-[9px] uppercase text-[var(--text-tertiary)] mb-1">
            <FiClock size={10} />
            Elapsed
          </div>
          <div className="text-xs text-[var(--text-primary)] font-mono">
            {formatTime(progress.elapsed_seconds)}
          </div>
        </div>
        
        {progress.estimated_seconds_remaining !== null && (
          <div className="bg-[var(--bg-app)]/50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 text-[9px] uppercase text-[var(--text-tertiary)] mb-1">
              <FiClock size={10} />
              Remaining
            </div>
            <div className="text-xs text-[var(--text-primary)] font-mono">
              {formatTime(progress.estimated_seconds_remaining)}
            </div>
          </div>
        )}
      </div>

      {/* Recent Files */}
      {progress.files_scraped.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] uppercase text-[var(--text-tertiary)]">
            Recently Scraped ({progress.files_scraped.length})
          </div>
          <div className="bg-[var(--bg-app)]/50 rounded-lg p-2 max-h-24 overflow-y-auto space-y-0.5">
            {progress.files_scraped.slice(-5).reverse().map((file, idx) => (
              <div key={idx} className="text-[10px] text-[var(--text-secondary)] truncate font-mono">
                ✓ {file}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {progress.errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          <div className="text-[9px] uppercase text-red-400 mb-1">
            Errors ({progress.errors.length})
          </div>
          <div className="max-h-16 overflow-y-auto space-y-0.5">
            {progress.errors.slice(-3).map((error, idx) => (
              <div key={idx} className="text-[10px] text-red-300/80 font-mono">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
