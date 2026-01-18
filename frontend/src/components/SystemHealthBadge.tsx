import { useEffect, useState } from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';

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
  const [health, setHealth] = useState<FullHealthReport>({ status: 'checking' });
  const { connectionState, predictions } = useWebSocketStore();
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const resp = await fetch('/health/full', { 
          signal: AbortSignal.timeout(2000) // 2s timeout
        });
        if (resp.ok) {
          const data: FullHealthReport = await resp.json();
          setHealth({ ...data, backend_available: true });
          setBackendOnline(true);
          return;
        }
      } catch {
        // Backend unavailable - use static mode
        setBackendOnline(false);
        setHealth({
          status: 'healthy', // System is healthy even without backend
          catalog: { 
            product_count: predictions.length,
            brand_count: new Set(predictions.map(p => p.brand)).size 
          },
          backend_available: false
        });
      }
    };

    fetchHealth();
    const id = setInterval(fetchHealth, 5000);
    return () => clearInterval(id);
  }, [predictions]);

  const status = health.status || 'checking';
  const mode = backendOnline ? 'LIVE' : 'STATIC';
  const displayStatus = status === 'healthy' ? `${mode} MODE` : status.toUpperCase();

  const colorClasses = {
    healthy: backendOnline 
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
        <span className={`absolute inline-flex h-full w-full rounded-full ${status === 'healthy' ? (backendOnline ? 'bg-emerald-400' : 'bg-cyan-400') + ' animate-ping opacity-75' : 'bg-white/20'}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'healthy' ? (backendOnline ? 'bg-emerald-500' : 'bg-cyan-500') : 'bg-white/40'}`}></span>
      </span>
      <span className="font-bold tracking-widest">{displayStatus}</span>
      {typeof health.catalog?.product_count === 'number' && (
        <>
          <span className="opacity-50">|</span>
          <span className="opacity-90">{health.catalog.product_count} products</span>
        </>
      )}
      {health.llm?.model && (
        <>
          <span className="opacity-50">|</span>
          <span className="opacity-50">LLM:</span>
          <span className="opacity-90">{health.llm.model}</span>
        </>
      )}
      {!backendOnline && (
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
