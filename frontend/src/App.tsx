import React, { useEffect, useRef, useState } from 'react';
import { useWebSocketStore } from './store/useWebSocketStore';
import { GhostCard } from './components/GhostCard';
import { BrandCard } from './components/BrandCard';
import { ChatView } from './components/ChatView';
import { ContextRail } from './components/ContextRail';
import './index.css';

function App() {
  const { actions, status } = useWebSocketStore();
  const [inputText, setInputText] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
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
        submitQuery();
    }
  }

  const submitQuery = () => {
    const { lastPrediction, actions } = useWebSocketStore.getState();
    if (!lastPrediction) return;

    const query = inputText.trim() || "How do I reset this device?";
    actions.lockAndQuery(lastPrediction, query, imageData);
    setInputText('');
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
            <div className="relative w-full bg-slate-900/90 text-white placeholder-slate-500 border border-slate-700 rounded-xl px-4 py-3 flex items-center space-x-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-white/5 active:scale-95 transition"
                  title="Attach an image"
                >
                  📎
                </button>
                <input
                    type="text"
                    value={inputText}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a product (e.g. 'Roland TD')..."
                    className="flex-1 bg-transparent outline-none text-xl font-light"
                    autoFocus
                />
                <button
                  type="button"
                  onClick={submitQuery}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition text-sm font-semibold"
                >
                  Send
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
            </div>
            {imageData && (
              <div className="absolute -bottom-16 left-2 flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 shadow-lg">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                  <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-slate-300">Image attached</div>
              </div>
            )}
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
