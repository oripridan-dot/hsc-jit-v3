import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Inline SVG Icon Components
const Database = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const GitMerge = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M6 21V9a9 9 0 0 0 9 9" />
  </svg>
);

const ShoppingBag = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const Globe = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const TrendingUp = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const CheckCircle2 = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 11 12 14 22 4" />
  </svg>
);

const AlertCircle = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const Package = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

interface BrandIntelligence {
  brand_id: string;
  brand_products: number;
  halilit_products: number;
  unified_products: number;
  primary_count: number;
  secondary_count: number;
  halilit_only_count: number;
  coverage_percentage: number;
  last_sync: string;
  status: string;
}

interface SourceBreakdown {
  count: number;
  description: string;
  badge: string;
}

interface DualSourceData {
  strategy: string;
  version: string;
  last_update: string;
  global_stats: {
    total_products: number;
    primary_products: number;
    secondary_products: number;
    halilit_only_products: number;
    dual_source_coverage: number;
  };
  brands: BrandIntelligence[];
  source_breakdown: {
    PRIMARY: SourceBreakdown;
    SECONDARY: SourceBreakdown;
    HALILIT_ONLY: SourceBreakdown;
  };
}

interface DualSourceIntelligenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DualSourceIntelligence: React.FC<DualSourceIntelligenceProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<DualSourceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchIntelligence = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/dual-source-intelligence?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch dual-source intelligence');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to fetch dual-source intelligence:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntelligence();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 border-b border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <GitMerge className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Dual-Source Intelligence</h2>
                  <p className="text-sm text-indigo-100">Brand Website + Halilit Distributor Synchronization</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-200">{error}</span>
              </div>
            )}

            {data && (
              <>
                {/* Global Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={<Database className="w-5 h-5" />}
                    label="Total Products"
                    value={data.global_stats.total_products}
                    color="blue"
                  />
                  <StatCard
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    label="Dual-Source Matched"
                    value={data.global_stats.primary_products}
                    subtitle={`${data.global_stats.dual_source_coverage}% coverage`}
                    color="green"
                  />
                  <StatCard
                    icon={<Globe className="w-5 h-5" />}
                    label="Brand Direct Only"
                    value={data.global_stats.secondary_products}
                    color="purple"
                  />
                  <StatCard
                    icon={<ShoppingBag className="w-5 h-5" />}
                    label="Halilit Only"
                    value={data.global_stats.halilit_only_products}
                    color="amber"
                  />
                </div>

                {/* Source Breakdown */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-400" />
                    Product Source Classification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SourceCard
                      type="PRIMARY"
                      data={data.source_breakdown.PRIMARY}
                      color="emerald"
                    />
                    <SourceCard
                      type="SECONDARY"
                      data={data.source_breakdown.SECONDARY}
                      color="violet"
                    />
                    <SourceCard
                      type="HALILIT_ONLY"
                      data={data.source_breakdown.HALILIT_ONLY}
                      color="amber"
                    />
                  </div>
                </div>

                {/* Brand-Level Intelligence */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Brand Coverage Analysis
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.brands.map((brand) => (
                      <BrandRow key={brand.brand_id} brand={brand} />
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="text-center text-sm text-slate-400">
                  <p>Strategy: {data.strategy} • Version: {data.version}</p>
                  <p>Last Update: {new Date(data.last_update).toLocaleString()}</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-cyan-600 text-blue-100',
    green: 'from-emerald-600 to-green-600 text-emerald-100',
    purple: 'from-purple-600 to-violet-600 text-purple-100',
    amber: 'from-amber-600 to-orange-600 text-amber-100',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4 shadow-lg`}>
      <div className="flex items-center gap-2 mb-2 opacity-90">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value.toLocaleString()}</div>
      {subtitle && <div className="text-xs mt-1 opacity-75">{subtitle}</div>}
    </div>
  );
};

// Source Card Component
interface SourceCardProps {
  type: string;
  data: SourceBreakdown;
  color: 'emerald' | 'violet' | 'amber';
}

const SourceCard: React.FC<SourceCardProps> = ({ type, data, color }) => {
  const colorClasses = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10',
    violet: 'border-violet-500/30 bg-violet-500/10',
    amber: 'border-amber-500/30 bg-amber-500/10',
  };

  const badgeColors = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-white text-sm">{type}</h4>
        <span className="text-2xl font-bold text-white">{data.count}</span>
      </div>
      <p className="text-xs text-slate-300 mb-3">{data.description}</p>
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${badgeColors[color]}`}>
        {data.badge}
      </span>
    </div>
  );
};

// Brand Row Component
interface BrandRowProps {
  brand: BrandIntelligence;
}

const BrandRow: React.FC<BrandRowProps> = ({ brand }) => {
  const coverageColor = brand.coverage_percentage >= 80 ? 'text-emerald-400' : 
                        brand.coverage_percentage >= 50 ? 'text-amber-400' : 
                        'text-red-400';
  
  const statusColor = brand.status === 'success' ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 hover:border-indigo-500/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-bold text-white capitalize">
            {brand.brand_id.replace(/-/g, ' ')}
          </h4>
          <span className={`text-xs ${statusColor}`}>● {brand.status}</span>
        </div>
        <div className={`text-lg font-bold ${coverageColor}`}>
          {brand.coverage_percentage.toFixed(1)}%
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div>
          <div className="text-slate-400 text-xs">Total</div>
          <div className="text-white font-semibold">{brand.unified_products}</div>
        </div>
        <div>
          <div className="text-emerald-400 text-xs">Both Sources</div>
          <div className="text-white font-semibold">{brand.primary_count}</div>
        </div>
        <div>
          <div className="text-violet-400 text-xs">Brand Only</div>
          <div className="text-white font-semibold">{brand.secondary_count}</div>
        </div>
        <div>
          <div className="text-amber-400 text-xs">Halilit Only</div>
          <div className="text-white font-semibold">{brand.halilit_only_count}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Brand Website</div>
          <div className="text-white font-semibold">{brand.brand_products}</div>
        </div>
      </div>
    </div>
  );
};
