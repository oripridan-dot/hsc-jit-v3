/**
 * InsightsTable - Interactive table display of product insights
 * Replaces InsightsBubbles with a compact table at bottom of workbench
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

    const allInsights: Insight[] = [
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
    ];

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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSortBy(sortBy === 'default' ? 'type' : 'default')}
            className="text-[8px] sm:text-[9px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors uppercase font-mono"
            title="Sort insights"
          >
            {sortBy === 'default' ? '📊' : '🏷️'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-hidden max-h-32 scrollbar-thin">
        <table className="w-full text-[8px] sm:text-[9px]">
          <thead className="sticky top-0 bg-[var(--bg-app)]/50 border-b border-[var(--border-subtle)]">
            <tr>
              <th className="text-left px-2 py-1 font-semibold text-[var(--text-tertiary)] uppercase w-12">Type</th>
              <th className="text-left px-2 py-1 font-semibold text-[var(--text-tertiary)] uppercase flex-1 min-w-24">Title</th>
              <th className="text-left px-2 py-1 font-semibold text-[var(--text-tertiary)] uppercase hidden sm:table-cell flex-1 min-w-32">Details</th>
              <th className="text-center px-1 py-1 font-semibold text-[var(--text-tertiary)] uppercase w-8">−</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {insights.map((insight) => (
                <motion.tr
                  key={insight.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border-b border-[var(--border-subtle)]/30 hover:bg-[var(--bg-app)]/30 transition-colors cursor-pointer group"
                  onClick={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
                >
                  {/* Type Badge */}
                  <td className="px-2 py-1.5 text-left">
                    <div className={`flex items-center gap-1 ${typeColors[insight.type]} px-1.5 py-0.5 rounded border w-fit`}>
                      <span className="text-[7px] sm:text-[8px]">{insight.badge}</span>
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-2 py-1.5 text-left">
                    <div className="font-semibold text-[var(--text-primary)] truncate">
                      {insight.title}
                    </div>
                  </td>

                  {/* Details (Desktop) */}
                  <td className="px-2 py-1.5 text-left hidden sm:table-cell">
                    <p className="text-[var(--text-secondary)] line-clamp-1">
                      {insight.text}
                    </p>
                  </td>

                  {/* Expand Toggle */}
                  <td className="px-1 py-1.5 text-center">
                    <motion.div
                      animate={{ rotate: expandedId === insight.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        size={12}
                        className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors"
                      />
                    </motion.div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Expanded Detail Row */}
      <AnimatePresence>
        {expandedId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--border-subtle)]/30 mt-1 pt-1.5 px-2"
          >
            {insights.find(i => i.id === expandedId) && (
              <div className="space-y-1">
                <p className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] leading-relaxed">
                  {insights.find(i => i.id === expandedId)?.text}
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-[8px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Collapse
                  </button>
                  <button
                    onClick={() => handleDismiss(expandedId)}
                    className="text-[8px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Indicator */}
      <style>{`
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
};
