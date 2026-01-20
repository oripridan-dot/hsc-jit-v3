import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLiveSystemData } from '../hooks/useLiveSystemData';

interface SystemMessage {
  id: string;
  type: 'scraping' | 'health' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  progress?: { current: number; total: number; percent: number };
  status?: 'running' | 'complete' | 'error';
}

export const HeaderSystemPanel: React.FC = () {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const systemData = useLiveSystemData();
  const scrapeProgress = systemData.scrapeProgress;

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update messages when scraping progress changes
  useEffect(() => {
    if (scrapeProgress && scrapeProgress.status !== 'idle') {
      const scrapingMsg: SystemMessage = {
        id: 'scraping',
        type: 'scraping',
        title: `Scraping ${scrapeProgress.brand}...`,
        message: `${scrapeProgress.current_product}/${scrapeProgress.total_products} products`,
        timestamp: Date.now(),
        progress: {
          current: scrapeProgress.current_product,
          total: scrapeProgress.total_products,
          percent: Math.round((scrapeProgress.current_product / scrapeProgress.total_products) * 100)
        },
        status: scrapeProgress.status as any
      };

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'scraping');
        return [scrapingMsg, ...filtered];
      });

      // Auto-expand on scraping activity
      if (scrapeProgress.status === 'running') {
        setIsExpanded(true);
      }
    }
  }, [scrapeProgress]);

  // System health check
  useEffect(() => {
    if (systemData.backendOnline) {
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
    }
  }, [systemData.backendOnline]);

  // Count active activities
  const activeCount = messages.filter(m => m.status === 'running').length;
  const hasActivity = activeCount > 0 || messages.length > 1;

  return (
    <div className="fixed top-20 right-8 z-40 font-sans">
      {/* Collapsed State: Pill Badge */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {activeCount > 0 ? (
                <Loader size={16} className="animate-spin text-cyan-400" />
              ) : (
                <Activity size={16} className="text-emerald-400" />
              )}
              <span className="text-sm font-mono text-slate-300">
                {systemData.brands || 0} brands
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-sm font-mono text-slate-300">
                {systemData.products || 0} products
              </span>
            </div>
          </div>
          {hasActivity && (
            <ChevronUp size={16} className="text-slate-400 ml-1" />
          )}
        </button>
      )}

      {/* Expanded State: Full Panel */}
      {isExpanded && (
        <div className="min-w-96 max-w-xl bg-slate-800/95 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-900/80 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <h3 className="font-bold text-slate-100">System Status</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-slate-700/50 rounded transition-colors"
            >
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Messages List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-700/50">
            {messages.length > 0 ? (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className="px-5 py-4 hover:bg-slate-700/30 transition-colors"
                >
                  {/* Message Header */}
                  <div className="flex items-start gap-3">
                    <div className="pt-1 flex-shrink-0">
                      {msg.type === 'scraping' && msg.status === 'running' ? (
                        <Loader size={16} className="text-cyan-400 animate-spin" />
                      ) : msg.status === 'complete' || msg.status === 'running' ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <AlertCircle size={16} className="text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100 text-sm">
                        {msg.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {msg.message}
                      </p>

                      {/* Progress Bar */}
                      {msg.progress && msg.status === 'running' && (
                        <div className="mt-3">
                          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${msg.progress.percent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-400">
                            <span className="font-mono">
                              {msg.progress.current}/{msg.progress.total}
                            </span>
                            <span>{msg.progress.percent}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-slate-400">
                <p className="text-sm">No active messages</p>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-700/50 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400">Brands</p>
              <p className="font-bold text-slate-100 text-base">
                {systemData.brands || 0}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Products</p>
              <p className="font-bold text-slate-100 text-base">
                {systemData.products || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
