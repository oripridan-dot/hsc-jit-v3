import { useEffect, useState } from 'react';
import { useLiveSystemData } from '../hooks/useLiveSystemData';

interface FullHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error' | 'checking' | 'missing';
  resources?: {
    redis_connected?: boolean;
    memory_usage_percent?: number;
    cpu_usage_percent?: number;
    uptime_seconds?: number;
  };
  catalog?: {
    product_count?: number;
    brand_count?: number;
  };
  llm?: {
    available?: boolean;
    api_key_present?: boolean;
    model?: string;
  };
  timestamp?: string;
  backend_available?: boolean;
}

type Placement = 'floating' | 'topbar';

export const SystemHealthBadge = ({ placement = 'floating' }: { placement?: Placement }) => {
  const systemData = useLiveSystemData();
  
  // Determine status based on system state
  const status = 'healthy';
  const mode = systemData.backendOnline ? 'LIVE' : 'STATIC';
  const displayStatus = `${mode} MODE`;

  const colorClasses = {
    healthy: systemData.backendOnline 
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 backdrop-blur-md'
      : 'bg-cyan-500/10 text-cyan-400 border-cyan-400/20 backdrop-blur-md',
    degraded: 'bg-yellow-400/15 text-yellow-300 border-yellow-300/30',
    unhealthy: 'bg-accent-warning/15 text-accent-warning border-accent-warning/30',
    error: 'bg-red-500/15 text-red-400 border-red-400/30',
    checking: 'bg-bg-surface text-text-secondary border-border-strong',
    missing: 'bg-bg-card text-text-muted border-border-subtle'
  }[status];

  const pill = (
    <div className={`text-[10px] px-3 py-1.5 rounded-full border font-mono opacity-90 hover:opacity-100 transition-opacity flex items-center gap-2 ${colorClasses} select-none`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full ${status === 'healthy' ? (systemData.backendOnline ? 'bg-emerald-400' : 'bg-cyan-400') + ' animate-ping opacity-75' : 'bg-white/20'}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'healthy' ? (systemData.backendOnline ? 'bg-emerald-500' : 'bg-cyan-500') : 'bg-white/40'}`}></span>
      </span>
      <span className="font-bold tracking-widest">{displayStatus}</span>
      {systemData.brands > 0 && (
        <>
          <span className="opacity-50">|</span>
          <span className="opacity-90">{systemData.brands} brands</span>
        </>
      )}
      {systemData.products > 0 && (
        <>
          <span className="opacity-50">|</span>
          <span className="opacity-90">{systemData.products} products</span>
        </>
      )}
      {!systemData.backendOnline && (
        <>
          <span className="opacity-50">|</span>
          <span className="opacity-60">⚡ SNIFFER: OFFLINE</span>
        </>
      )}
    </div>
  );

  if (placement === 'topbar') {
    return <div className="ml-4">{pill}</div>;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 shadow-lg ${colorClasses}`}>{pill}</div>
  );
};
