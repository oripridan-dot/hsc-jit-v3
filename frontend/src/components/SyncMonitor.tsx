import React, { useState, useEffect } from 'react';

interface PhaseStatus {
  status: string;
  products?: number;
  brands?: number;
  current_brand?: string | null;
  total_products?: number;
  primary_products?: number;
  secondary_products?: number;
  brands_analyzed?: number;
  total_gaps?: number;
  last_run?: string | null;
  errors?: string[];
}

interface SyncStatus {
  last_updated: string;
  sync_running: boolean;
  phases: {
    halilit: PhaseStatus;
    brand_scraper: PhaseStatus;
    merge: PhaseStatus;
    gap_analysis: PhaseStatus;
  };
  recent_logs: string[];
}

export const SyncMonitor: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    // Static Mode: No sync API available
    setStatus(null);
    setError('Sync Monitor not available in Static Mode');
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (phaseStatus: string) => {
    switch (phaseStatus) {
      case 'running':
        return 'text-blue-500';
      case 'complete':
        return 'text-green-500';
      case 'pending':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (phaseStatus: string) => {
    switch (phaseStatus) {
      case 'running':
        return '⏳';
      case 'complete':
        return '✅';
      case 'pending':
        return '⏹️';
      default:
        return '❓';
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Never';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 text-white rounded-lg">
        <div className="animate-pulse">Loading sync status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500 text-red-300 rounded-lg">
        <h3 className="font-bold mb-2">Error Loading Sync Status</h3>
        <p>{error}</p>
        <button
          onClick={fetchStatus}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold">🔄 Sync Monitor</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Auto-refresh</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
          <button
            onClick={fetchStatus}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div
        className={`p-4 rounded-lg ${
          status.sync_running
            ? 'bg-blue-900/30 border border-blue-500'
            : 'bg-gray-800 border border-gray-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{status.sync_running ? '🔄' : '💤'}</span>
          <div>
            <div className="font-bold">
              {status.sync_running ? 'Sync in Progress' : 'No Active Sync'}
            </div>
            <div className="text-sm text-gray-400">
              Last updated: {formatDate(status.last_updated)}
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Halilit Phase */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{getStatusIcon(status.phases.halilit.status)}</span>
            <h3 className="font-bold text-lg">Halilit Sync</h3>
            <span className={`text-sm ml-auto ${getStatusColor(status.phases.halilit.status)}`}>
              {status.phases.halilit.status.toUpperCase()}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Products:</span>
              <span className="font-mono">{status.phases.halilit.products?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Brands:</span>
              <span className="font-mono">{status.phases.halilit.brands || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Run:</span>
              <span className="text-xs">{formatDate(status.phases.halilit.last_run)}</span>
            </div>
          </div>
          {status.phases.halilit.errors && status.phases.halilit.errors.length > 0 && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-500 rounded text-xs">
              {status.phases.halilit.errors.slice(0, 2).map((err, i) => (
                <div key={i} className="truncate">{err}</div>
              ))}
            </div>
          )}
        </div>

        {/* Brand Scraper Phase */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{getStatusIcon(status.phases.brand_scraper.status)}</span>
            <h3 className="font-bold text-lg">Brand Websites</h3>
            <span className={`text-sm ml-auto ${getStatusColor(status.phases.brand_scraper.status)}`}>
              {status.phases.brand_scraper.status.toUpperCase()}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            {status.phases.brand_scraper.current_brand && (
              <div className="flex justify-between mb-2 text-blue-400">
                <span>Current:</span>
                <span className="font-bold">{status.phases.brand_scraper.current_brand}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Products:</span>
              <span className="font-mono">{status.phases.brand_scraper.products?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Brands:</span>
              <span className="font-mono">{status.phases.brand_scraper.brands || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Run:</span>
              <span className="text-xs">{formatDate(status.phases.brand_scraper.last_run)}</span>
            </div>
          </div>
        </div>

        {/* Merge Phase */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{getStatusIcon(status.phases.merge.status)}</span>
            <h3 className="font-bold text-lg">Catalog Merge</h3>
            <span className={`text-sm ml-auto ${getStatusColor(status.phases.merge.status)}`}>
              {status.phases.merge.status.toUpperCase()}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Products:</span>
              <span className="font-mono">{status.phases.merge.total_products?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">PRIMARY:</span>
              <span className="font-mono text-green-400">{status.phases.merge.primary_products?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-400">SECONDARY:</span>
              <span className="font-mono text-yellow-400">{status.phases.merge.secondary_products?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Run:</span>
              <span className="text-xs">{formatDate(status.phases.merge.last_run)}</span>
            </div>
          </div>
        </div>

        {/* Gap Analysis Phase */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{getStatusIcon(status.phases.gap_analysis.status)}</span>
            <h3 className="font-bold text-lg">Gap Analysis</h3>
            <span className={`text-sm ml-auto ${getStatusColor(status.phases.gap_analysis.status)}`}>
              {status.phases.gap_analysis.status.toUpperCase()}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Brands Analyzed:</span>
              <span className="font-mono">{status.phases.gap_analysis.brands_analyzed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Gaps:</span>
              <span className="font-mono">{status.phases.gap_analysis.total_gaps?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Run:</span>
              <span className="text-xs">{formatDate(status.phases.gap_analysis.last_run)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      {status.recent_logs.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span>📋</span> Recent Activity
          </h3>
          <div className="bg-black p-3 rounded font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
            {status.recent_logs.map((log, i) => (
              <div key={i} className="text-gray-300 hover:text-white">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
