import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass, ChevronRight, Mic, MicOff } from 'lucide-react';
import { Navigator } from './Navigator';
import { useNavigationStore } from '../store/navigationStore';
import { instantSearch } from '../lib';
import { useHalileoTheme } from '../hooks/useHalileoTheme';

interface AISuggestion {
  id: string;
  name: string;
  reason: string;
  category: string;
  score?: number;
}

export const HalileoNavigator = () => {
  const [mode, setMode] = useState<'manual' | 'guide'>('manual');
  const [query, setQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<unknown | null>(null);
  const { selectProduct } = useNavigationStore();
  
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
    
    selectProduct(productNode);
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

      {/* Navigator Header */}
      <div className="p-4 relative z-10">
        <div className="flex items-center gap-3 mb-4">
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
          <div>
            <h2 className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Halileo
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {mode === 'guide' ? 'AI Co-Pilot Active' : 'Navigator'}
            </p>
          </div>
        </div>

        {/* Intelligent Search Input */}
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or ask Halileo..."
            className="w-full rounded-xl px-4 py-3 pl-10 pr-12 text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--bg-app)',
              border: `1px solid ${query ? 'var(--halileo-primary)' : 'var(--border-subtle)'}`,
              color: 'var(--text-primary)',
              boxShadow: query ? '0 0 0 3px var(--halileo-surface)' : 'none'
            }}
          />
          <Sparkles 
            className="absolute left-3 top-3.5 w-4 h-4 transition-colors"
            style={{ color: query ? 'var(--halileo-primary)' : 'var(--text-tertiary)' }}
          />
          
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className="absolute right-2 top-2 p-1.5 rounded-lg transition-all"
            style={{
              background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-panel-hover)',
              color: isListening ? '#ef4444' : 'var(--text-secondary)'
            }}
            title="Voice search"
          >
            {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Mode Switcher */}
      <div className="flex px-4 gap-2 mb-2">
        <button 
          onClick={() => setMode('manual')}
          className="flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all"
          style={{
            background: mode === 'manual' ? 'var(--bg-panel-hover)' : 'transparent',
            color: mode === 'manual' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: mode === 'manual' ? '1px solid var(--border-subtle)' : '1px solid transparent'
          }}
        >
          Browse
        </button>
        <button 
          onClick={() => setMode('guide')}
          className="flex-1 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-all"
          style={{
            background: mode === 'guide' ? 'var(--halileo-primary)' : 'transparent',
            color: mode === 'guide' ? '#fff' : 'var(--text-secondary)',
            border: mode === 'guide' ? '1px solid var(--halileo-primary)' : '1px solid transparent',
            boxShadow: mode === 'guide' ? '0 0 10px var(--halileo-glow)' : 'none'
          }}
        >
          AI Guide
        </button>
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

      {/* Footer Status */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)' }}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'manual' ? '📂 Browse' : '🧠 AI Active'}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium text-green-600">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
