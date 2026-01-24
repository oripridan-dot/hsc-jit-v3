// frontend/src/App.tsx
import React from 'react';
import { useNavigationStore } from './store/navigationStore';
import { GalaxyDashboard } from './components/views/GalaxyDashboard';
import { SpectrumModule } from './components/views/SpectrumModule';
import { ProductPopInterface } from './components/views/ProductPopInterface'; // (Assume exists)

function App() {
  // Extract strictly what we need
  const { currentView, activeProductId } = useNavigationStore();

  return (
    <div className="flex h-screen w-screen flex-col bg-black text-white font-sans overflow-hidden">
      
      {/* Global Header (Optional) */}
      <header className="h-12 bg-black border-b border-zinc-900 flex items-center px-6">
         <span className="font-black italic text-lg tracking-tight">Halilit<span className="text-zinc-600">SC</span></span>
      </header>

      {/* Main Stage */}
      <main className="flex-1 relative overflow-hidden">
        
        {/* Layer 1: Galaxy */}
        {currentView === 'GALAXY' && (
          <div className="absolute inset-0 animate-fade-in">
            <GalaxyDashboard />
          </div>
        )}

        {/* Layer 2: Spectrum */}
        {currentView === 'SPECTRUM' && (
          <div className="absolute inset-0 animate-slide-up">
            <SpectrumModule />
          </div>
        )}

        {/* Layer 3: Product Pop (Overlay) */}
        {currentView === 'PRODUCT_POP' && activeProductId && (
           <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4">
             {/* This would be your Flight Case Modal */}
             <ProductPopInterface productId={activeProductId} /> 
           </div>
        )}

      </main>
    </div>
  );
}

export default App;
