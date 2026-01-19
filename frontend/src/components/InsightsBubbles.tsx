/**
 * InsightsBubbles - Horizontal insights display at bottom of workbench
 * Shows contextual insights, alerts, market data, and product updates
 */
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingUp, Zap, Award, Activity } from 'lucide-react';

interface Insight {
  id: string;
  type: 'opportunity' | 'alert' | 'market' | 'feature' | 'rating' | 'trend' | 'update';
  title: string;
  text: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

interface InsightsBubblesProps {
  product: {
    id?: string;
    name?: string;
    brand?: string;
    family?: string;
    category?: string;
  };
  isVisible?: boolean;
}

export const InsightsBubbles: React.FC<InsightsBubblesProps> = ({
  product,
  isVisible = true
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Generate dynamic insights based on product
  const insights = useMemo<Insight[]>(() => {
    if (!product?.name) return [];

    // Simulate market data and insights (would come from backend)
    const allInsights: Insight[] = [
      {
        id: `${product.id}-market-growth`,
        type: 'market',
        title: 'Market Momentum',
        text: `${product.family || product.category} trending +23% YoY. Strong Q4 performance expected.`,
        icon: <TrendingUp size={16} />,
        color: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30'
      },
      {
        id: `${product.id}-cross-sell`,
        type: 'opportunity',
        title: 'Cross-Sell Opportunity',
        text: `Customers buying ${product.name} also purchase ${product.brand} audio interfaces. Bundle potential.`,
        icon: <Zap size={16} />,
        color: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30'
      },
      {
        id: `${product.id}-rating`,
        type: 'rating',
        title: 'Top Rated',
        text: `${product.name} maintains 4.8/5 rating across major retailers. Premium positioning justified.`,
        icon: <Award size={16} />,
        color: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30'
      },
      {
        id: `${product.id}-stock-alert`,
        type: 'alert',
        title: 'Inventory Update',
        text: 'EMEA region: Low stock. Expect restock in 5-7 days. Consider pre-orders.',
        icon: <AlertTriangle size={16} />,
        color: 'bg-red-500/10',
        borderColor: 'border-red-500/30'
      },
      {
        id: `${product.id}-firmware-update`,
        type: 'update',
        title: 'Firmware v2.1 Released',
        text: 'Latest firmware adds Bluetooth MIDI, improved latency. Highlight in product demos.',
        icon: <Zap size={16} />,
        color: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
      },
      {
        id: `${product.id}-competitor-analysis`,
        type: 'trend',
        title: 'Competitive Analysis',
        text: `${product.name} leads feature set vs competitors. Price premium of 12% justified.`,
        icon: <Activity size={16} />,
        color: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/30'
      },
      {
        id: `${product.id}-emerging-trend`,
        type: 'trend',
        title: 'Industry Trend',
        text: 'Wireless connectivity adoption growing. Position as leader in mobile workflow integration.',
        icon: <Lightbulb size={16} />,
        color: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30'
      }
    ];

    // Filter out dismissed insights
    return allInsights.filter(i => !dismissedIds.has(i.id));
  }, [product, dismissedIds]);

  if (!isVisible || insights.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  return (
    <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]/30 backdrop-blur-sm p-4 flex-shrink-0">
      {/* Section Header */}
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb size={14} className="text-indigo-400" />
        <h3 className="text-xs font-semibold uppercase text-[var(--text-secondary)] tracking-wider">
          Smart Insights
        </h3>
        <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">
          {insights.length} updates
        </span>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-2">
          <AnimatePresence mode="popLayout">
            {insights.map((insight, idx) => (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.05 }}
                className={`
                  flex-shrink-0 min-w-max
                  relative rounded-lg border transition-all
                  cursor-pointer group
                  ${insight.color}
                  ${insight.borderColor}
                  hover:shadow-lg hover:shadow-${insight.color.match(/\w+/)?.[1]}-500/20
                  p-3
                `}
                onMouseEnter={() => setExpandedId(insight.id)}
                onMouseLeave={() => setExpandedId(null)}
              >
                {/* Content */}
                <div className="max-w-xs">
                  {/* Header with icon and title */}
                  <div className="flex items-start gap-2 mb-1">
                    <div className="flex-shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                      {insight.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {insight.title}
                      </h4>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className={`
                      text-[11px] text-[var(--text-secondary)] leading-tight
                      overflow-hidden transition-all
                      ${
                        expandedId === insight.id
                          ? 'line-clamp-none'
                          : 'line-clamp-2'
                      }
                    `}
                  >
                    {insight.text}
                  </p>

                  {/* Type badge */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-mono opacity-60">
                      {insight.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(insight.id);
                      }}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-current via-current to-transparent opacity-0 group-hover:opacity-40 transition-opacity rounded-t-lg" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Scroll Indicator */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
