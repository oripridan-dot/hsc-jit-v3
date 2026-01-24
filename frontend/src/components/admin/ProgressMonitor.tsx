import { Zap } from "lucide-react";

/**
 * ProgressMonitor: Real-time Scraping Progress Dashboard
 *
 * Connects to WebSocket server (Phase 6) to display live updates
 * as Content Scraper (Phase 5) ingests product data.
 *
 * Features:
 * - Real-time progress bars per brand
 * - Live success/failure counts
 * - Job status tracking
 * - Auto-reconnect on disconnect
 */

export const ProgressMonitor = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 text-center">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
        <Zap className="w-12 h-12 mx-auto text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Progress Monitor (Static Build)
        </h2>
        <p className="text-slate-400">
          Real-time WebSocket monitoring is disabled in production static
          builds.
        </p>
      </div>
    </div>
  );
};

export default ProgressMonitor;
