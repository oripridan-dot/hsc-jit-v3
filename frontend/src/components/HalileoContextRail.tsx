import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingUp, Sparkles, X } from 'lucide-react';

interface Insight {
  id: string;
  type: 'opportunity' | 'alert' | 'tip' | 'context';
  title: string;
  text: string;
}

interface ContextRailProps {
  currentContext: { name?: string; id?: string } | null;
  isVisible?: boolean;
}

const STORAGE_KEY = 'halileo_dismissed_insights';
const ANALYTICS_KEY = 'halileo_insights_analytics';

export const HalileoContextRail: React.FC<ContextRailProps> = ({ 
  currentContext, 
  isVisible = true 
}) => {
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(() => {
    // Load dismissed insights from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Save dismissed insights to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dismissedInsights)));
  }, [dismissedInsights]);

  // Analytics tracking function
  const trackInsightAnalytics = (event: string, data?: Record<string, string | number | undefined>) => {
    const analyticsEvent = {
      timestamp: new Date().toISOString(),
      event,
      data,
      component: 'HalileoContextRail'
    };
    
    const existingEvents = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
    existingEvents.push(analyticsEvent);
    if (existingEvents.length > 100) {
      existingEvents.shift();
    }
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(existingEvents));
    console.log('📊 Insight Analytics:', analyticsEvent);
  };

  // Generate insights based on current context
  const insights = useMemo<Insight[]>(() => {
    if (!currentContext) {
      return [];
    }
    
    const productName = currentContext.name || 'this product';
    const productId = currentContext.id || 'unknown';
    
    // Use product ID to generate unique insight IDs
    const allInsights: Insight[] = [
      { 
        id: `${productId}-opportunity`,
        type: 'opportunity', 
        title: 'Cross-Sell Opportunity',
        text: `${productName} pairs perfectly with the PM-100 monitor. Consider bundling.` 
      },
      { 
        id: `${productId}-alert`,
        type: 'alert', 
        title: 'Stock Alert',
        text: 'Low inventory in EMEA region. Restock in 5-7 days.' 
      },
      { 
        id: `${productId}-tip`,
        type: 'tip', 
        title: 'Feature Highlight',
        text: 'Latest firmware v2.0 adds Bluetooth MIDI. Mention in demos.' 
      },
      { 
        id: `${productId}-context`,
        type: 'context', 
        title: 'Market Context',
        text: 'This category has seen 23% growth in Q4. High customer interest.' 
      }
    ];
    
    // Filter out dismissed insights
    return allInsights.filter(i => !dismissedInsights.has(i.id));
  }, [currentContext, dismissedInsights]);

  // Track insight views
  useEffect(() => {
    if (currentContext && insights.length > 0) {
      trackInsightAnalytics('insights_viewed', {
        product: currentContext.name,
        product_id: currentContext.id,
        insight_count: insights.length.toString()
      });
    }
  }, [currentContext, insights.length]);

  const handleDismiss = (insightId: string, insightTitle: string) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
    trackInsightAnalytics('insight_dismissed', {
      insight_id: insightId,
      insight_title: insightTitle,
      product: currentContext?.name
    });
  };

  const handleInsightClick = (insight: Insight) => {
    trackInsightAnalytics('insight_clicked', {
      insight_id: insight.id,
      insight_type: insight.type,
      insight_title: insight.title,
      product: currentContext?.name
    });
  };

  if (!currentContext || !isVisible) return null;

  const getInsightConfig = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return {
          icon: TrendingUp,
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/30'
        };
      case 'alert':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/30'
        };
      case 'tip':
        return {
          icon: Lightbulb,
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/30'
        };
      case 'context':
        return {
          icon: Sparkles,
          bgColor: 'bg-purple-500/20',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/30'
        };
    }
  };

  return (
    <div className="fixed right-6 top-24 w-80 pointer-events-none z-50 flex flex-col gap-3">
      <AnimatePresence>
        {insights.map((insight, idx) => {
          const config = getInsightConfig(insight.type);
          const Icon = config.icon;
          
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ delay: idx * 0.15 }}
              onClick={() => handleInsightClick(insight)}
              className={`pointer-events-auto bg-slate-950/95 backdrop-blur-2xl border ${config.borderColor} p-4 rounded-2xl shadow-2xl hover:bg-slate-900/95 transition-colors group cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${config.bgColor} ${config.textColor} flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${config.textColor}`}>
                      {insight.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(insight.id, insight.title);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-white/40 hover:text-white/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Halileo Attribution */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: insights.length * 0.15 + 0.3 }}
          className="pointer-events-auto text-center text-xs text-white/30 mt-2"
        >
          <Sparkles className="w-3 h-3 inline-block mr-1" />
          Insights by Halileo
        </motion.div>
      )}
    </div>
  );
};
