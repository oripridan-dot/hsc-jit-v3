/**
 * InsightsTable - Interactive table display of product insights
 * Compact insights at bottom of workbench with business intelligence
 */
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingUp, Zap, Award, Activity, ChevronDown } from 'lucide-react';

interface Insight {
  id: string;
  type: 'opportunity' | 'alert' | 'market' | 'feature' | 'rating' | 'trend' | 'update';
  title: string;
  text: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
}

interface InsightsTableProps {
  product: {
    id?: string;
    name?: string;
    brand?: string;
    family?: string;
    category?: string;
  };
  isVisible?: boolean;
}

const typeColors: Record<string, string> = {
  market: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  opportunity: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  rating: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  alert: 'text-red-400 bg-red-500/10 border-red-500/30',
  update: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  trend: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  feature: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
};

export const InsightsTable: React.FC<InsightsTableProps> = ({
  product,
  isVisible = true
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'type' | 'title' | 'default'>('default');

  // Generate dynamic insights based on product
  const insights = useMemo<Insight[]>(() => {
    if (!product?.name) return [];

    const allInsights: Insight[] = [];

    allInsights.push(
      {
        id: `${product.id}-market-growth`,
        type: 'market',
        title: 'Market Momentum',
        text: `${product.family || product.category} trending +23% YoY. Strong Q4 performance expected.`,
        icon: <TrendingUp size={14} />,
        color: 'text-emerald-400',
        badge: 'MARKET'
      },
      {
        id: `${product.id}-cross-sell`,
        type: 'opportunity',
        title: 'Cross-Sell Opportunity',
        text: `Customers buying ${product.name} also purchase ${product.brand} audio interfaces. Bundle potential.`,
        icon: <Zap size={14} />,
        color: 'text-cyan-400',
        badge: 'OPPORTUNITY'
      },
      {
        id: `${product.id}-rating`,
        type: 'rating',
        title: 'Top Rated',
        text: `${product.name} maintains 4.8/5 rating across major retailers. Premium positioning justified.`,
        icon: <Award size={14} />,
        color: 'text-amber-400',
        badge: 'RATING'
      },
      {
        id: `${product.id}-stock-alert`,
        type: 'alert',
        title: 'Inventory Update',
        text: 'EMEA region: Low stock. Expect restock in 5-7 days. Consider pre-orders.',
        icon: <AlertTriangle size={14} />,
        color: 'text-red-400',
        badge: 'ALERT'
      },
      {
        id: `${product.id}-firmware-update`,
        type: 'update',
        title: 'Firmware v2.1 Released',
        text: 'Latest firmware adds Bluetooth MIDI, improved latency. Highlight in product demos.',
        icon: <Zap size={14} />,
        color: 'text-blue-400',
        badge: 'UPDATE'
      },
      {
        id: `${product.id}-competitor-analysis`,
        type: 'trend',
        title: 'Competitive Analysis',
        text: `${product.name} leads feature set vs competitors. Price premium of 12% justified.`,
        icon: <Activity size={14} />,
        color: 'text-indigo-400',
        badge: 'TREND'
      },
      {
        id: `${product.id}-emerging-trend`,
        type: 'trend',
        title: 'Industry Trend',
        text: 'Wireless connectivity adoption growing. Position as leader in mobile workflow integration.',
        icon: <Lightbulb size={14} />,
        color: 'text-purple-400',
        badge: 'TREND'
      }
    );

    // Filter dismissed
    const filtered = allInsights.filter(i => !dismissedIds.has(i.id));

    // Sort
    if (sortBy === 'type') {
      return filtered.sort((a, b) => a.type.localeCompare(b.type));
    } else if (sortBy === 'title') {
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [product, dismissedIds, sortBy]);

  if (!isVisible || insights.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  return (
    <div className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5 sm:p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 px-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={13} className="text-indigo-400" />
          <h3 className="text-[9px] sm:text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">
            Smart Insights
          </h3>
          <span className="text-[8px] sm:text-[9px] text-[var(--text-tertiary)] bg-[var(--bg-app)] px-1.5 py-0.5 rounded">
            {insights.length}
          </span>
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-[8px] sm:text-[9px] bg-[var(--bg-app)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 cursor-pointer hover:bg-[var(--bg-panel)] transition-colors"
        >
          <option value="default">Default</option>
          <option value="type">By Type</option>
          <option value="title">By Title</option>
        </select>
      </div>

      {/* Insights Cards - Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto gap-1.5 sm:gap-2 pb-1 snap-x snap-mandatory">
        <AnimatePresence mode="popLayout">
          {insights.map((insight) => {
            return (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`
                  relative flex-shrink-0 w-[280px] sm:w-auto sm:flex-1 sm:min-w-[180px] 
                  snap-center rounded-lg border transition-all cursor-pointer
                  ${typeColors[insight.type] || 'bg-gray-500/10 border-gray-500/30'}
                  ${expandedId === insight.id ? 'shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'}
                `}
                onClick={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
              >
              <div className={`p-2 sm:p-2.5 ${insight.type === 'update' ? 'relative' : ''}`}>
                {/* System badge for system insights */}
                {insight.type === 'update' && (
                  <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-[7px] font-bold text-white shadow-lg animate-pulse">
                    SYSTEM
                  </div>
                )}
                
                {/* Card Header */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={insight.color}>
                      {insight.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[9px] sm:text-xs font-bold text-[var(--text-primary)] truncate">
                        {insight.title}
                      </h4>
                      <span className={`text-[7px] sm:text-[8px] font-mono uppercase ${insight.color}`}>
                        {insight.badge}
                      </span>
                    </div>
                  </div>

                  {/* Expand/Collapse icon */}
                  <ChevronDown
                    size={12}
                    className={`flex-shrink-0 text-[var(--text-tertiary)] transition-transform ${
                      expandedId === insight.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Card Body */}
                <div
                  className={`text-[8px] sm:text-[9px] text-[var(--text-secondary)] leading-relaxed transition-all ${
                    expandedId === insight.id ? 'line-clamp-none' : 'line-clamp-2'
                  }`}
                >
                  {insight.text}
                </div>

                {/* Expanded actions */}
                {expandedId === insight.id && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(insight.id);
                      }}
                      className="text-[7px] sm:text-[8px] px-2 py-1 bg-[var(--bg-app)] hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 rounded transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-[7px] sm:text-[8px] px-2 py-1 bg-[var(--bg-app)] hover:bg-indigo-500/10 text-[var(--text-tertiary)] hover:text-indigo-400 rounded transition-colors"
                    >
                      Learn More
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
