import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass, ChevronRight, Mic, MicOff, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navigator } from './Navigator';
import { SystemPanel } from './SystemPanel';
import { useNavigationStore } from '../store/navigationStore';
import { instantSearch } from '../lib';
import { useHalileoTheme } from '../hooks/useHalileoTheme';
import { useLiveSystemData } from '../hooks/useLiveSystemData';
import type { Product } from '../types';

interface AISuggestion {
  id: string;
  name: string;
  reason: string;
  category: string;
  score?: number;
}

export const HalileoNavigator = () => {
  const [mode, setMode] = useState<'manual' | 'guide' | 'system'>('manual');
  const [query, setQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<unknown | null>(null);
  const { selectProduct } = useNavigationStore();
  
  // Use single source of truth for system data (catalog, scraping progress, health)
  const systemData = useLiveSystemData();
  const scrapeProgress = systemData.scrapeProgress;
  
  // Apply Halileo theme when in guide mode or thinking
  useHalileoTheme(mode === 'guide' || isThinking);

  // Define functions before useEffect
  const trackAnalytics = (event: string, data?: Record<string, string | number>) => {
    const analyticsEvent = {
      timestamp: new Date().toISOString(),
      event,
      data,
      component: 'HalileoNavigator'
    };
    
    const existingEvents = JSON.parse(localStorage.getItem('halileo_analytics') || '[]');
    existingEvents.push(analyticsEvent);
    if (existingEvents.length > 100) {
      existingEvents.shift();
    }
    localStorage.setItem('halileo_analytics', JSON.stringify(existingEvents));
    console.log('📊 Analytics:', analyticsEvent);
  };

  const generateReason = (query: string, rank: number): string => {
    const reasons = [
      `Best match for "${query}"`,
      `Alternative for ${query}`,
      `Popular choice in this category`,
      `Recommended based on features`,
      `Trending product`
    ];
    return reasons[rank] || reasons[0];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const performSearch = (searchQuery: string) => {
    setMode('guide');
    setIsThinking(true);
    trackAnalytics('ai_search', { query: searchQuery });

    try {
      const results = instantSearch.search(searchQuery, { limit: 5 });
      
      const suggestions: AISuggestion[] = results.map((product, idx) => ({
        id: product.id || `${product.name}-${idx}`,
        name: product.name,
        reason: generateReason(searchQuery, idx),
        category: product.category || 'Products',
        score: 0.9 - (idx * 0.1)
      }));

      setAiSuggestions(suggestions);
      setIsThinking(false);
    } catch (error) {
      console.error('Search error:', error);
      setIsThinking(false);
      setAiSuggestions([]);
    }
  };

  const handleVoiceSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    performSearch(searchQuery);
    trackAnalytics('voice_search', { query: searchQuery });
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown }).webkitSpeechRecognition || (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
      if (SpeechRecognition) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current = new (SpeechRecognition as any)();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = recognitionRef.current as any;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
          handleVoiceSearch(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = recognitionRef.current as any;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      trackAnalytics('voice_input_started', {});
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    performSearch(query);
  };

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    trackAnalytics('ai_suggestion_clicked', { 
      product: suggestion.name,
      query: query,
      rank: aiSuggestions.indexOf(suggestion).toString()
    });

    const productNode = {
      name: suggestion.name,
      type: 'product' as const,
      id: suggestion.id,
      category: suggestion.category
    };
    
    selectProduct(productNode as unknown as Product);
    console.log('Halileo navigated to:', suggestion.name);
  };

  return (
    <div 
      className="flex flex-col h-full border-r relative overflow-hidden"
      style={{
        background: 'var(--bg-panel)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-primary)'
      }}
    >
      
      {/* Halileo Glow Effect (only in guide mode) */}
      {mode === 'guide' && (
        <motion.div 
          className="absolute top-0 left-0 w-full h-24 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, var(--halileo-surface), transparent)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Navigator Header - Minimal Branding Only */}
      <div className="p-4 pb-3 relative z-10 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2.5 rounded-xl relative"
            style={{
              background: mode === 'guide' ? 'var(--halileo-primary)' : 'var(--bg-panel-hover)',
              boxShadow: mode === 'guide' ? '0 0 20px var(--halileo-glow), inset 0 0 10px rgba(255,255,255,0.1)' : 'none'
            }}
            animate={{
              scale: mode === 'guide' ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 2,
              repeat: mode === 'guide' ? Infinity : 0,
              repeatType: "reverse"
            }}
          >
            {/* Pulse Ring when active */}
            {mode === 'guide' && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  border: '2px solid var(--halileo-primary)',
                  opacity: 0.6
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            <Compass className="w-5 h-5" style={{ color: mode === 'guide' ? '#fff' : 'var(--text-primary)' }} />
          </motion.div>
          <div className="flex-1">
            <h2 className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Halileo
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              AI Navigator
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-hide">
        <AnimatePresence mode="wait">
          {mode === 'manual' ? (
            <motion.div 
              key="manual"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              {/* Embed the existing Navigator */}
              <Navigator />
            </motion.div>
          ) : mode === 'system' ? (
            <motion.div 
              key="system"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="mb-3">
                <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 px-2">System Activity</h3>
                <SystemPanel />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {isThinking ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 rounded-full"
                    style={{
                      border: '3px solid var(--halileo-surface)',
                      borderTopColor: 'var(--halileo-primary)'
                    }}
                  />
                  <p className="text-xs font-medium animate-pulse" style={{ color: 'var(--halileo-primary)' }}>
                    Thinking...
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {aiSuggestions.length === 0 ? (
                    <div className="text-center text-sm py-8" style={{ color: 'var(--text-secondary)' }}>
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">Ask Halileo</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        e.g., "Show me analog synths"
                      </p>
                    </div>
                  ) : (
                    aiSuggestions.map((suggestion) => (
                      <motion.div 
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="group p-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: 'var(--halileo-surface)',
                          border: '1px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--halileo-primary)';
                          e.currentTarget.style.background = 'var(--bg-panel-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.background = 'var(--halileo-surface)';
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-semibold block" style={{ color: 'var(--halileo-primary)' }}>
                              {suggestion.name}
                            </span>
                            <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                              {suggestion.category}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 transition-colors" style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {suggestion.reason}
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar: Search Input + Scraping Tracker + Controls + Status */}
      <div className="flex flex-col gap-2 p-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)' }}>
        {/* Intelligent Search Input */}
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'guide' ? "Ask Halileo..." : "Search products..."}
            className="w-full rounded-lg px-3 py-2 pl-9 pr-10 text-xs focus:outline-none transition-all"
            style={{
              background: 'var(--bg-panel)',
              border: `1px solid ${query ? 'var(--halileo-primary)' : 'var(--border-subtle)'}`,
              color: 'var(--text-primary)',
              boxShadow: query ? '0 0 0 2px var(--halileo-surface)' : 'none'
            }}
          />
          <Sparkles 
            className="absolute left-2.5 top-2.5 w-3.5 h-3.5 transition-colors flex-shrink-0"
            style={{ color: query ? 'var(--halileo-primary)' : 'var(--text-tertiary)' }}
          />
          
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className="absolute right-1.5 top-1.5 p-1 rounded transition-all flex-shrink-0"
            style={{
              background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: isListening ? '#ef4444' : 'var(--text-secondary)'
            }}
            title="Voice search"
          >
            {isListening ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Scraping Progress (if active) */}
        {scrapeProgress && scrapeProgress.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg p-2 text-xs"
            style={{
              background: scrapeProgress.status === 'running' 
                ? 'rgba(6, 182, 212, 0.1)' 
                : scrapeProgress.status === 'complete'
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${
                scrapeProgress.status === 'running'
                  ? 'rgba(6, 182, 212, 0.3)'
                  : scrapeProgress.status === 'complete'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {scrapeProgress.status === 'running' ? (
                  <Loader size={12} className="animate-spin text-cyan-400" />
                ) : scrapeProgress.status === 'complete' ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={12} className="text-red-400" />
                )}
                <span className="font-bold text-[10px]" style={{ 
                  color: scrapeProgress.status === 'running' 
                    ? '#06b6d4'
                    : scrapeProgress.status === 'complete'
                    ? '#22c55e'
                    : '#ef4444'
                }}>
                  {scrapeProgress.status === 'running' 
                    ? `Scraping ${scrapeProgress.brand}...`
                    : scrapeProgress.status === 'complete'
                    ? `${scrapeProgress.brand} Complete`
                    : 'Scraping Failed'
                  }
                </span>
              </div>
              {scrapeProgress.status === 'running' && (
                <span className="text-[9px] font-mono text-cyan-400">
                  {Math.round((scrapeProgress.current_product / scrapeProgress.total_products) * 100)}%
                </span>
              )}
            </div>
            {scrapeProgress.status === 'running' && (
              <>
                <div className="h-1 bg-[var(--bg-panel)] rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.round((scrapeProgress.current_product / scrapeProgress.total_products) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-[var(--text-secondary)]">
                  <span>{scrapeProgress.current_product}/{scrapeProgress.total_products}</span>
                  <span>{formatTime(scrapeProgress.elapsed_seconds)}</span>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
              mode === 'manual' 
                ? 'bg-[var(--halileo-primary)] text-white shadow-lg' 
                : 'bg-[var(--bg-panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Browse product catalog"
          >
            📚 Catalog
          </button>
          <button
            onClick={() => setMode('guide')}
            className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
              mode === 'guide' 
                ? 'bg-[var(--halileo-primary)] text-white shadow-lg' 
                : 'bg-[var(--bg-panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="AI-assisted navigation"
          >
            ✨ Copilot
          </button>
        </div>

        {/* Status Line */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'manual' ? '📂 Browse' : mode === 'system' ? '⚙️ System' : '🧠 AI Active'}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${scrapeProgress?.status === 'running' ? 'animate-pulse' : 'animate-pulse'}`} style={{ background: scrapeProgress?.status === 'error' ? '#ef4444' : '#22c55e' }} />
            <span className="font-medium" style={{ color: scrapeProgress?.status === 'error' ? '#ef4444' : '#22c55e' }}>
              {scrapeProgress?.status === 'running' ? 'Scraping' : scrapeProgress?.status === 'error' ? 'Error' : 'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
