import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Database,
  Globe,
  Server,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

/**
 * StudioConsole: Pre-Ingestion Analysis Dashboard
 *
 * This is the "Recording Studio" dashboard where you see the scope before
 * performing the scraping work. It visualizes the "Gain Staging" of your data:
 *
 * - Global Scope: What exists worldwide
 * - Local Stock: What Halilit sells
 * - Market Penetration: Coverage percentage
 * - Critical Gaps: Missing flagship products
 *
 * The console answers:
 * 1. How many products exist globally?
 * 2. How many does Halilit carry?
 * 3. What are the critical gaps?
 * 4. Should we ingest ALL global products or just LOCAL items?
 */

interface BrandIntel {
  total_global_skus: number;
  halilit_stock_count: number;
  matched_count: number;
  missing_count: number;
  market_penetration_percent: number;
  missing_flagships: string[];
  missing_products: string[];
  ingestion_status: string;
  recommendation: string;
}

interface SystemMetrics {
  total_global_products: number;
  total_local_products: number;
  overall_market_penetration: number;
  brands_analyzed: string[];
}

interface Briefing {
  timestamp: string;
  system_metrics: SystemMetrics;
  brands: {
    [brand: string]: BrandIntel;
  };
}

export const StudioConsole = () => {
  const [intel, setIntel] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  useEffect(() => {
    const loadIntelligence = async () => {
      try {
        const response = await fetch("/data/intelligence_briefing.json");
        if (!response.ok) {
          throw new Error(
            `Failed to load intelligence briefing: ${response.status}`,
          );
        }
        const data = (await response.json()) as Briefing;
        setIntel(data);

        // Auto-select first brand
        const brands = Object.keys(data.brands || {});
        if (brands.length > 0) {
          setSelectedBrand(brands[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        logger.error("Failed to load intelligence briefing", err);
      } finally {
        setLoading(false);
      }
    };

    loadIntelligence();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 font-mono text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <Zap className="w-12 h-12 mx-auto text-amber-500 animate-pulse" />
          </div>
          <p className="text-lg font-bold text-amber-500 mb-2">
            INITIALIZING CONSOLE...
          </p>
          <p className="text-sm text-slate-500">
            Scanning radar and local inventory...
          </p>
        </div>
      </div>
    );
  }

  if (error || !intel) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 font-mono text-slate-200">
        <div className="max-w-xl mx-auto bg-rose-950/20 border border-rose-900/50 p-8 rounded-lg">
          <div className="flex items-start gap-4 mb-4">
            <AlertOctagon className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-rose-400 mb-2">CONSOLE ERROR</h3>
              <p className="text-sm text-rose-300">
                {error || "Intelligence briefing not available"}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Ensure that GlobalRadar and IntelligenceOfficer have been run to
            generate the briefing.
          </p>
        </div>
      </div>
    );
  }

  const metrics = intel.system_metrics;

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-mono text-slate-200">
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">
            PRE-INGESTION <span className="text-amber-500">CONSOLE</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Analyze data scope, identify gaps, and validate schemas before
            initializing heavy recording (scraping) agents. The universe has
            been mapped. Now we choose what to capture.
          </p>
        </div>

        {/* SYSTEM STATUS */}
        <div className="bg-slate-900 border border-slate-700 px-6 py-4 rounded-lg flex-shrink-0">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            System Status
          </div>
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            ONLINE
          </div>
        </div>
      </div>

      {/* SYSTEM METRICS BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Globe size={14} />
            <span className="text-[10px] uppercase tracking-wider">
              Global Scope
            </span>
          </div>
          <div className="text-3xl font-black text-blue-400">
            {metrics.total_global_products}
          </div>
          <div className="text-xs text-slate-600 mt-1">Products worldwide</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Server size={14} />
            <span className="text-[10px] uppercase tracking-wider">
              Local Inventory
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {metrics.total_local_products}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Halilit catalog items
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp size={14} />
            <span className="text-[10px] uppercase tracking-wider">
              Market Coverage
            </span>
          </div>
          <div className="text-3xl font-black text-amber-400">
            {metrics.overall_market_penetration}%
          </div>
          <div className="text-xs text-slate-600 mt-1">Global penetration</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Database size={14} />
            <span className="text-[10px] uppercase tracking-wider">
              Brands Analyzed
            </span>
          </div>
          <div className="text-3xl font-black text-purple-400">
            {metrics.brands_analyzed.length}
          </div>
          <div className="text-xs text-slate-600 mt-1">Radar targets</div>
        </div>
      </div>

      {/* BRAND SELECTOR TABS */}
      <div className="mb-8 border-b border-slate-800">
        <div className="flex gap-2 overflow-x-auto">
          {Object.keys(intel.brands).map((brand) => {
            const isSelected = selectedBrand === brand;
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-4 py-3 font-bold uppercase text-xs tracking-wider transition-all whitespace-nowrap ${
                  isSelected
                    ? "text-white border-b-2 border-amber-500 bg-slate-900/50"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* CHANNEL STRIP FOR SELECTED BRAND */}
      {selectedBrand && intel.brands[selectedBrand] && (
        <ChannelStrip
          brand={selectedBrand}
          data={intel.brands[selectedBrand]}
        />
      )}

      {/* ALL BRANDS GRID VIEW */}
      <div className="mt-12">
        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
          <Activity size={20} />
          ALL CHANNELS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(intel.brands).map(([brand, data]) => (
            <BrandCard
              key={brand}
              brand={brand}
              data={data}
              isSelected={selectedBrand === brand}
              onSelect={() => setSelectedBrand(brand)}
            />
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-12 pt-8 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          PRE-PRODUCTION CONSOLE v1.0 • Intelligence briefing generated at{" "}
          {intel.timestamp}
        </p>
      </div>
    </div>
  );
};

/**
 * ChannelStrip: Detailed view of a single brand
 */
interface ChannelStripProps {
  brand: string;
  data: BrandIntel;
}

const ChannelStrip: React.FC<ChannelStripProps> = ({ brand, data }) => {
  const gap = data.missing_count;
  const coverage = data.market_penetration_percent;

  return (
    <div className="bg-slate-900 border-2 border-amber-600/30 rounded-lg overflow-hidden shadow-2xl">
      {/* STATUS BAR */}
      <div className="h-2 bg-slate-800">
        <div
          className={`h-full transition-all duration-1000 ${
            coverage > 80
              ? "bg-emerald-500"
              : coverage > 50
                ? "bg-amber-500"
                : "bg-rose-500"
          }`}
          style={{ width: `${coverage}%` }}
        />
      </div>

      <div className="p-8">
        {/* TITLE & PRIMARY METRIC */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-black uppercase text-white mb-1">
              {brand}
            </h3>
            <p className="text-sm text-slate-500">Reconnaissance Summary</p>
          </div>
          <div className="text-right bg-slate-950 px-6 py-4 rounded border border-slate-800">
            <div className="text-4xl font-black text-amber-400 mb-1">
              {coverage}%
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              Market Coverage
            </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-950 p-4 rounded border border-slate-800/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Global Scope
            </div>
            <div className="text-2xl font-black text-blue-400">
              {data.total_global_skus}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Local Stock
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {data.halilit_stock_count}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Gap
            </div>
            <div
              className={`text-2xl font-black ${gap > 0 ? "text-rose-400" : "text-emerald-400"}`}
            >
              {gap}
            </div>
          </div>
        </div>

        {/* RECOMMENDATION BOX */}
        <div
          className={`p-4 rounded mb-8 border ${
            data.ingestion_status === "READY_TO_RECORD"
              ? "bg-emerald-950/20 border-emerald-900/30"
              : "bg-amber-950/20 border-amber-900/30"
          }`}
        >
          <div className="flex items-start gap-3">
            {data.ingestion_status === "READY_TO_RECORD" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div
                className={`font-bold mb-1 ${
                  data.ingestion_status === "READY_TO_RECORD"
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {data.recommendation}
              </div>
              <p className="text-xs text-slate-400">
                {data.ingestion_status === "READY_TO_RECORD"
                  ? `Ready to ingest. Choose between all ${data.total_global_skus} global products (encyclopedic) or just ${data.halilit_stock_count} local items (sales-focused).`
                  : "Review gaps before proceeding with ingestion."}
              </p>
            </div>
          </div>
        </div>

        {/* MISSING FLAGSHIPS */}
        {data.missing_flagships.length > 0 && (
          <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded mb-8">
            <div className="flex items-center gap-2 text-rose-400 mb-3">
              <AlertOctagon size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Critical Gaps: {data.missing_flagships.length} Flagships
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.missing_flagships.slice(0, 5).map((item) => (
                <span
                  key={item}
                  className="text-[10px] bg-rose-900/50 text-rose-200 px-2 py-1 rounded border border-rose-800"
                >
                  {item}
                </span>
              ))}
              {data.missing_flagships.length > 5 && (
                <span className="text-[10px] text-rose-400 px-2 py-1">
                  +{data.missing_flagships.length - 5} more...
                </span>
              )}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 px-4 rounded uppercase tracking-wide transition-colors border border-slate-700">
            📋 View Manifest
          </button>
          <button className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold py-3 px-4 rounded uppercase tracking-wide transition-colors flex items-center justify-center gap-2 border border-amber-500">
            <Activity size={14} />
            Start Recording
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * BrandCard: Compact card view for brand summary
 */
interface BrandCardProps {
  brand: string;
  data: BrandIntel;
  isSelected: boolean;
  onSelect: () => void;
}

const BrandCard: React.FC<BrandCardProps> = ({
  brand,
  data,
  isSelected,
  onSelect,
}) => {
  const coverage = data.market_penetration_percent;

  return (
    <button
      onClick={onSelect}
      className={`text-left bg-slate-900 rounded-lg overflow-hidden shadow-lg transition-all border-2 ${
        isSelected
          ? "border-amber-500 shadow-amber-500/20"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* STATUS BAR */}
      <div className="h-1 bg-slate-800">
        <div
          className={`h-full transition-all ${
            coverage > 80
              ? "bg-emerald-500"
              : coverage > 50
                ? "bg-amber-500"
                : "bg-rose-500"
          }`}
          style={{ width: `${coverage}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold uppercase text-white">{brand}</h3>
          <div className="text-right">
            <div className="text-2xl font-black text-amber-400">
              {coverage}%
            </div>
            <div className="text-[8px] text-slate-600 uppercase">Coverage</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-950 p-2 rounded border border-slate-800/50">
            <div className="text-[8px] text-slate-500 uppercase mb-1">
              Global
            </div>
            <div className="text-lg font-bold text-blue-400">
              {data.total_global_skus}
            </div>
          </div>
          <div className="bg-slate-950 p-2 rounded border border-slate-800/50">
            <div className="text-[8px] text-slate-500 uppercase mb-1">
              Local
            </div>
            <div className="text-lg font-bold text-emerald-400">
              {data.halilit_stock_count}
            </div>
          </div>
        </div>

        {data.missing_flagships.length > 0 && (
          <div className="text-[10px] text-rose-400 mb-3">
            {data.missing_flagships.length} flagships missing
          </div>
        )}

        <div
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded inline-block ${
            data.ingestion_status === "READY_TO_RECORD"
              ? "bg-emerald-950/50 text-emerald-300"
              : "bg-amber-950/50 text-amber-300"
          }`}
        >
          {data.ingestion_status === "READY_TO_RECORD" ? "✓ Ready" : "⚠ Review"}
        </div>
      </div>
    </button>
  );
};

// Simple logger for debugging
const logger = {
  error: (msg: string, err?: unknown) =>
    console.error(`[StudioConsole] ${msg}`, err),
  info: (msg: string) => console.log(`[StudioConsole] ${msg}`),
};

export default StudioConsole;
