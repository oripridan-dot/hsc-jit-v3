import React, { useEffect, useState } from 'react';
import { useWebSocketStore } from './store/useWebSocketStore';
import { GhostCard } from './components/GhostCard';
import { BrandCard } from './components/BrandCard';
import { ChatView } from './components/ChatView';
import { ContextRail } from './components/ContextRail';
import './index.css';

function App() {
  const { actions, status } = useWebSocketStore();
  const [inputText, setInputText] = useState('');
  
  // Connect on mount
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    actions.connect(`${protocol}//${host}/ws`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    setInputText(txt);
    actions.sendTyping(txt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        const { lastPrediction, actions } = useWebSocketStore.getState();
        if (lastPrediction) {
            // For demo, we just ask a fixed question if user hits enter on a prediction
            actions.lockAndQuery(lastPrediction, "How do I reset this device?"); 
            setInputText('');
        }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

      {/* Main Container */}
      <div className="z-10 w-full max-w-2xl flex flex-col space-y-8 flex-1 py-10 pb-40">
        
        {/* Header - Fade out when active to save space? Keep it for now. */}
        <header className={`text-center space-y-2 transition-all duration-500 ${status !== 'IDLE' ? 'scale-90 opacity-80' : 'scale-100'}`}>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                HSC JIT v3
            </h1>
            <p className="text-slate-400 text-sm tracking-widest uppercase">
                The Psychic Engine {status !== 'IDLE' && `• ${status}`}
            </p>
        </header>

        {/* Search Input - Hide when locked? Or keep as "Command Bar"? Keep. */}
        <div className="relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl transition duration-500 blur ${status === 'SNIFFING' ? 'opacity-75' : 'opacity-20 group-hover:opacity-40'}`}></div>
            <input
                type="text"
                value={inputText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Type a product (e.g. 'Roland TD')..."
                className="relative w-full bg-slate-900/90 text-white placeholder-slate-500 border border-slate-700 rounded-xl px-6 py-4 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-light"
                autoFocus
            />
        </div>

        {/* Chat / Content View */}
        <div className="flex-1 w-full relative">
            <ChatView />
        </div>

      </div>

      {/* Overlays */}
      <GhostCard />
      <BrandCard />
      <ContextRail />

    </div>
  );
}

export default App;
