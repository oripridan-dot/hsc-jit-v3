import React from 'react';

interface BackendUnavailableProps {
  onRetry?: () => void;
}

export const BackendUnavailable: React.FC<BackendUnavailableProps> = ({ onRetry }) => {
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-bg-base via-bg-card to-bg-base text-text-primary overflow-hidden font-sans selection:bg-accent-primary/30">
      
      {/* Decorative gradient blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-accent-primary rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-accent-secondary rounded-full blur-[150px]" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-6">
        
        {/* Header Section */}
        <div className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-danger/20 border border-accent-danger/50 rounded-full mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          
          <h1 className="text-4xl font-bold">Backend Service Unavailable</h1>
          
          <p className="text-text-muted text-lg max-w-md">
            The backend service is currently unreachable. This could mean the server is not running or there's a connection issue.
          </p>
        </div>

        {/* Diagnostic Info Section */}
        <div className="bg-bg-card/50 border border-white/10 rounded-xl p-8 max-w-lg w-full mb-8 space-y-4">
          
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Troubleshooting Steps</h2>
          
          <div className="space-y-3">
            <div className="flex gap-4 items-start">
              <div className="text-accent-success flex-shrink-0 w-6 h-6 flex items-center justify-center bg-accent-success/20 rounded-full text-xs font-bold">1</div>
              <div>
                <p className="font-semibold text-text-primary">For Local Development</p>
                <p className="text-text-muted text-sm mt-1">Run <code className="bg-bg-base px-2 py-1 rounded text-xs font-mono">docker compose up</code> in the project root, or start the backend with <code className="bg-bg-base px-2 py-1 rounded text-xs font-mono">uvicorn app.main:app</code></p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="text-accent-success flex-shrink-0 w-6 h-6 flex items-center justify-center bg-accent-success/20 rounded-full text-xs font-bold">2</div>
              <div>
                <p className="font-semibold text-text-primary">Check Backend Status</p>
                <p className="text-text-muted text-sm mt-1">Ensure the backend API server is running and accessible. Default: <code className="bg-bg-base px-2 py-1 rounded text-xs font-mono">http://localhost:8000</code></p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="text-accent-success flex-shrink-0 w-6 h-6 flex items-center justify-center bg-accent-success/20 rounded-full text-xs font-bold">3</div>
              <div>
                <p className="font-semibold text-text-primary">For Production Deployment</p>
                <p className="text-text-muted text-sm mt-1">Set the <code className="bg-bg-base px-2 py-1 rounded text-xs font-mono">VITE_API_URL</code> environment variable to point to your backend server</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="text-accent-success flex-shrink-0 w-6 h-6 flex items-center justify-center bg-accent-success/20 rounded-full text-xs font-bold">4</div>
              <div>
                <p className="font-semibold text-text-primary">Check Network Connection</p>
                <p className="text-text-muted text-sm mt-1">Verify that your browser can reach the backend server and there are no firewall or proxy issues</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-8 py-3 bg-accent-primary hover:bg-accent-primary/90 text-black rounded-xl font-semibold transition-all shadow-lg shadow-accent-primary/30"
            >
              🔄 Retry Connection
            </button>
          )}
          
          <a
            href="https://github.com/oripridan-dot/hsc-jit-v3"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-text-primary rounded-xl font-semibold transition-all border border-white/10"
          >
            📚 View Documentation
          </a>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-text-muted text-xs">
          <p>Halilit Explorer v3.4 | Backend Connection Error</p>
        </div>
      </div>
    </div>
  );
};
