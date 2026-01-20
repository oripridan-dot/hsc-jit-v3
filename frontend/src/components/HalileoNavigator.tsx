import React, { useState, useRef } from 'react';
import { Sparkles, Compass, Mic, MicOff } from 'lucide-react';
import { Navigator } from './Navigator';
import type { Product } from '../types';

interface AISuggestion {
  id: string;
  name: string;
  reason: string;
  category: string;
  score?: number;
}

export const HalileoNavigator = () => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<unknown | null>(null);

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
    trackAnalytics('search', { query });
    setQuery('');
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
      
      {/* Navigator Header */}
      <div className="px-5 py-4 relative z-10 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3.5">
          <div 
            className="p-3 rounded-xl relative flex-shrink-0"
            style={{
              background: 'var(--bg-panel-hover)'
            }}
          >
            <Compass className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg tracking-tight leading-5" style={{ color: 'var(--text-primary)' }}>
              Halileo
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Product Navigator
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <Navigator />
      </div>

      {/* Bottom Bar: Search Input + Scraping Tracker */}
      <div className="flex flex-col gap-4 px-5 py-4" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)' }}>
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-lg px-3.5 py-3 pl-10 pr-11 text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--bg-panel)',
              border: `1.5px solid ${query ? 'var(--halileo-primary)' : 'var(--border-subtle)'}`,
              color: 'var(--text-primary)',
              boxShadow: query ? '0 0 0 2px var(--halileo-surface)' : 'none'
            }}
          />
          <Sparkles 
            className="absolute left-3 top-3.5 w-4 h-4 transition-colors flex-shrink-0"
            style={{ color: query ? 'var(--halileo-primary)' : 'var(--text-secondary)' }}
          />
          
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className="absolute right-2 top-2.5 p-2 rounded transition-all flex-shrink-0"
            style={{
              background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: isListening ? '#ef4444' : 'var(--text-secondary)'
            }}
            title="Voice search"
          >
            {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
