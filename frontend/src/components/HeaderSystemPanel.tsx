import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader, CheckCircle2, AlertCircle, Clock, FileText, Activity, Zap } from 'lucide-react';
import { useLiveSystemData } from '../hooks/useLiveSystemData';

interface SystemMessage {
  id: string;
  type: 'scraping' | 'health' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  progress?: { current: number; total: number; percent: number };
  status?: 'running' | 'complete' | 'error';
  phase?: 'initializing' | 'exploring' | 'harvesting' | 'processing' | 'complete';
  currentFile?: string;
  elapsedSeconds?: number;
  estimatedRemaining?: number | null;
  recentFiles?: string[];
}

export const HeaderSystemPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false); // Closed by default
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const systemData = useLiveSystemData();
  const scrapeProgress = systemData.scrapeProgress;

  // Update messages when scraping progress changes
  useEffect(() => {
    if (scrapeProgress && scrapeProgress.status !== 'idle') {
      const phase = scrapeProgress.phase || 'harvesting';
      const phaseEmoji = {
        initializing: '🎬',
        exploring: '🔍',
        harvesting: '📦',
        processing: '⚙️',
        complete: '✅'
      };
      
      const isComplete = scrapeProgress.status === 'complete';
      const title = isComplete 
        ? `${phaseEmoji.complete} ${scrapeProgress.brand} scraping complete!`
        : `${phaseEmoji[phase]} Scraping ${scrapeProgress.brand}...`;
      
      const scrapingMsg: SystemMessage = {
        id: 'scraping',
        type: 'scraping',
        title,
        message: `${scrapeProgress.current_product}/${scrapeProgress.total_products} products`,
        timestamp: Date.now(),
        progress: {
          current: scrapeProgress.current_product,
          total: scrapeProgress.total_products,
          percent: Math.round((scrapeProgress.current_product / scrapeProgress.total_products) * 100)
        },
        status: scrapeProgress.status as any,
        phase: phase,
        currentFile: scrapeProgress.current_file,
        elapsedSeconds: scrapeProgress.elapsed_seconds,
        estimatedRemaining: scrapeProgress.estimated_seconds_remaining,
        recentFiles: scrapeProgress.files_scraped?.slice(-5) || []
      };

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'scraping');
        return [scrapingMsg, ...filtered];
      });

      // Don't auto-expand - user can open manually if needed
      // if (scrapeProgress.status === 'running') {
      //   setIsExpanded(true);
      // }
    }
  }, [scrapeProgress]);

  // System health check
  useEffect(() => {
    const healthMsg: SystemMessage = {
      id: 'health',
      type: 'health',
      title: 'System Health',
      message: systemData.backendOnline ? 'Backend online' : 'Backend offline',
      timestamp: Date.now(),
      status: systemData.backendOnline ? 'complete' : 'error'
    };

    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== 'health');
      return [...filtered, healthMsg];
    });
  }, [systemData.backendOnline]);

  // Count active activities
  const activeCount = messages.filter(m => m.status === 'running').length;
  const mode = systemData.backendOnline ? 'LIVE' : 'STATIC';
  const isActive = activeCount > 0;

  // Helper to format time
  const formatTime = (seconds: number): string => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Helper to get action verb based on progress
  const getActionVerb = (phase?: string, progress: number = 0): string => {
    if (phase === 'initializing') return '🎬 Initializing browser';
    if (phase === 'exploring') return '🔍 Exploring product catalog';
    if (phase === 'processing') return '⚙️ Processing data';
    if (phase === 'complete') return '✅ Complete';
    
    // Harvesting phase - dynamic based on progress
    if (progress === 0) return '📦 Starting extraction';
    if (progress < 25) return '📦 Extracting products';
    if (progress < 50) return '📦 Harvesting data';
    if (progress < 75) return '📦 Collecting details';
    if (progress < 100) return '📦 Finalizing';
    return '✅ Complete';
  };

  return (
    <>
      {/* Collapsed State: Header Pill Badge */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2 rounded-full border transition-all flex items-center gap-3 font-mono text-sm font-bold tracking-widest hover:opacity-100 opacity-90"
        style={{
          background: isActive ? 'rgba(6, 182, 212, 0.08)' : 'rgba(34, 197, 94, 0.08)',
          borderColor: isActive ? 'rgba(6, 182, 212, 0.5)' : 'rgba(34, 197, 94, 0.5)',
          color: isActive ? '#0891b2' : '#059669'
        }}
      >
        {/* Status Indicator Dot */}
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span
            className="absolute inline-flex h-full w-full rounded-full animate-pulse opacity-75"
            style={{
              background: isActive ? 'rgb(6, 182, 212)' : 'rgb(34, 197, 94)'
            }}
          ></span>
          <span
            className="relative inline-flex rounded-full h-2.5 w-2.5"
            style={{
              background: isActive ? '#06b6d4' : '#22c55e'
            }}
          ></span>
        </span>

        {/* Status Text */}
        <span>{mode}</span>
        <span className="opacity-60">|</span>
        <span className="opacity-80">{systemData.brands} brands</span>
        <span className="opacity-60">|</span>
        <span className="opacity-80">{systemData.products} products</span>

        {/* Toggle Icon */}
        {isExpanded ? (
          <ChevronUp size={16} className="ml-1 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="ml-1 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div
          className="absolute top-20 right-8 min-w-96 rounded-lg overflow-hidden border shadow-xl z-40"
          style={{
            background: '#f8fafc',
            borderColor: '#e2e8f0'
          }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-3">
              <span
                className="flex h-2.5 w-2.5 rounded-full animate-pulse flex-shrink-0"
                style={{
                  background: isActive ? '#06b6d4' : '#22c55e'
                }}
              ></span>
              <h3 className="font-bold text-slate-900 text-sm font-mono tracking-wide">
                {mode} MODE
              </h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="p-1.5 rounded transition-colors text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <ChevronUp size={18} />
            </button>
          </div>

          {/* System Status Content */}
          <div style={{ borderColor: '#e2e8f0' }}>
            {/* Messages */}
            <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: '#e2e8f0' }}>
              {messages.length > 0 ? (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className="px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* Message Header */}
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5 flex-shrink-0">
                        {msg.type === 'scraping' && msg.status === 'running' ? (
                          <Loader size={16} className="text-cyan-500 animate-spin" />
                        ) : msg.status === 'complete' ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">
                          {msg.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {msg.message}
                        </p>

                        {/* Current File Being Processed */}
                        {msg.currentFile && msg.status === 'running' && (
                          <div className="mt-2 px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-md">
                            <div className="flex items-center gap-2">
                              <Activity size={12} className="text-cyan-600 animate-pulse" />
                              <span className="text-xs font-semibold text-cyan-900">
                                {getActionVerb(msg.phase, msg.progress?.percent || 0)}
                              </span>
                            </div>
                            <div className="flex items-start gap-2 mt-1.5">
                              <FileText size={12} className="text-cyan-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-cyan-800 font-mono truncate">
                                {msg.currentFile}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Progress Bar */}
                        {msg.progress && msg.status === 'running' && (
                          <div className="mt-3 space-y-2">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden relative">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-500 relative overflow-hidden"
                                style={{ width: `${msg.progress.percent}%` }}
                              >
                                {/* Animated shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                                     style={{
                                       animation: 'shimmer 2s infinite',
                                       backgroundSize: '200% 100%'
                                     }} 
                                />
                              </div>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                              <div className="flex items-center gap-3">
                                <span className="text-slate-700 font-semibold">
                                  {msg.progress.current}/{msg.progress.total}
                                </span>
                                <span className="text-slate-500">
                                  {msg.progress.percent}%
                                </span>
                              </div>
                              {msg.elapsedSeconds !== undefined && (
                                <div className="flex items-center gap-3 text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Clock size={11} />
                                    <span>{formatTime(msg.elapsedSeconds)}</span>
                                  </div>
                                  {msg.estimatedRemaining && (
                                    <div className="flex items-center gap-1">
                                      <Zap size={11} />
                                      <span>~{formatTime(msg.estimatedRemaining)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recent Files List */}
                        {msg.recentFiles && msg.recentFiles.length > 0 && msg.status === 'running' && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              Recently Completed
                            </p>
                            <div className="space-y-1">
                              {msg.recentFiles.slice(-3).reverse().map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                                  <span className="truncate font-mono opacity-70">{file}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-6 text-center text-slate-500">
                  <p className="text-sm">✓ All systems operational</p>
                </div>
              )}
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-2 gap-0 bg-slate-50" style={{ borderTop: '1px solid #e2e8f0' }}>
              <div className="px-6 py-4" style={{ borderRight: '1px solid #e2e8f0' }}>
                <p className="text-xs text-slate-600 uppercase tracking-wider font-mono font-bold">Brands</p>
                <p
                  className="font-bold text-2xl mt-2 font-mono"
                  style={{ color: '#059669' }}
                >
                  {systemData.brands}
                </p>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-mono font-bold">Products</p>
                <p
                  className="font-bold text-2xl mt-2 font-mono"
                  style={{ color: '#0891b2' }}
                >
                  {systemData.products}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
