import React, { useEffect, useState } from "react";
import { catalogLoader } from "../../lib/catalogLoader";
import type { Product } from "../../types";
import { SpectrumMiddleLayer } from "./SpectrumLayer";

/**
 * SpectrumDemo - Demonstration page for the Spectrum Middle Layer
 *
 * Shows how to integrate the SpectrumMiddleLayer with real catalog data
 */

export const SpectrumDemo: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        // Load Roland catalog
        const rolandCatalog = await catalogLoader.loadBrand("roland");

        // Get products from a specific category (e.g., Keys)
        const allProducts = rolandCatalog.products || [];

        // Filter to a reasonable subset for demo
        const keyProducts = allProducts
          .filter(
            (p) =>
              p.category?.toLowerCase().includes("piano") ||
              p.category?.toLowerCase().includes("synth") ||
              p.category?.toLowerCase().includes("keyboard"),
          )
          .slice(0, 20); // Limit to first 20 for readability

        setProducts(keyProducts);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load products",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="text-slate-400 font-mono">
            Loading Spectrum Analyzer...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-xl">⚠️</div>
          <p className="text-slate-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Spectrum Analyzer View
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            An audio-hardware inspired product visualization. Hover over dots to
            see details, click to explore. Products are plotted by{" "}
            <span className="text-amber-400">Price (X-axis)</span> and{" "}
            <span className="text-cyan-400">Popularity (Y-axis)</span>.
          </p>
        </div>

        {/* The Spectrum Layer */}
        <SpectrumMiddleLayer products={products} categoryName="Keys & Pianos" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {products.length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Products
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {new Set(products.map((p) => p.brand)).size}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Brands
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {
                products.filter(
                  (p) => p.halilit_price || p.pricing?.regular_price,
                ).length
              }
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              With Pricing
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">
            Color Legend
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#ff6b00] shadow-[0_0_10px_#ff6b00]" />
              <span className="text-sm text-slate-300">Roland / Boss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#e31e24] shadow-[0_0_10px_#e31e24]" />
              <span className="text-sm text-slate-300">Nord</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#4f46e5] shadow-[0_0_10px_#4f46e5]" />
              <span className="text-sm text-slate-300">Yamaha</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#2563eb] shadow-[0_0_10px_#2563eb]" />
              <span className="text-sm text-slate-300">Korg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpectrumDemo;
