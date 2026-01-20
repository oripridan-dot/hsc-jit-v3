import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  try {
    console.log('🚀 Starting React app...');
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('✅ React app rendered');
  } catch (error) {
    console.error('❌ React render error:', error);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: system-ui; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">Failed to Load Application</h1>
        <p style="color: #64748b;">Check browser console for details</p>
        <pre style="background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; overflow: auto;">${error}</pre>
      </div>
    `;
  }
}
