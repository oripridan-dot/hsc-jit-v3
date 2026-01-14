import { useEffect, useState } from 'react';

interface HealthReport {
  status: 'healthy' | 'degraded' | 'error' | 'checking' | 'missing';
  last_audit?: string;
  metrics?: {
    total?: number;
    broken?: number;
    ok?: number;
  };
}

export const SystemHealthBadge = () => {
  const [health, setHealth] = useState<HealthReport>({ status: 'checking' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/static/system_health.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('Not available');
        const json = await res.json();
        if (!cancelled) setHealth(json as HealthReport);
      } catch {
        if (!cancelled) setHealth({ status: 'missing' });
      }
    };

    load();
    const timer = setInterval(load, 60_000); // refresh every minute
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const status = health.status || 'checking';
  const colorClasses = {
    healthy: 'bg-accent-success/15 text-accent-success border-accent-success/30',
    degraded: 'bg-accent-primary/15 text-accent-primary border-accent-primary/30',
    error: 'bg-accent-warning/15 text-accent-warning border-accent-warning/30',
    checking: 'bg-bg-surface text-text-secondary border-border-strong',
    missing: 'bg-bg-card text-text-muted border-border-subtle'
  }[status];

  // If healthy, you can choose to hide it or show a green indicator. We'll keep a subtle green.
  return (
    <div className={`fixed bottom-2 right-2 text-[10px] px-2 py-1 rounded border font-mono ${colorClasses}`}>
      <span className="mr-1">🛡️</span>
      <span className="font-semibold tracking-widest">{status.toUpperCase()}</span>
      {health.last_audit && (
        <span className="ml-2 opacity-75">• {new Date(health.last_audit).toLocaleTimeString()}</span>
      )}
      {health.metrics && typeof health.metrics.broken === 'number' && (
        <span className="ml-2 opacity-75">• broken: {health.metrics.broken}</span>
      )}
    </div>
  );
};
