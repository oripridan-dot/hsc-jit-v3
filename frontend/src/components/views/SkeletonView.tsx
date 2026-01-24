/**
 * SkeletonView - Display Roland skeleton products from frontend/public/data/roland/*.json
 *
 * This component loads the new product skeleton files created by the Genesis protocol
 * and displays them in a grid with real images from Roland's CDN.
 */

import React, { useEffect, useState } from "react";
import type { Product } from "../../types";
import { SpectrumMiddleLayer } from "../smart-views/SpectrumLayer";

interface SkeletonProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  media: {
    thumbnail: string;
    gallery: string[];
    videos: string[];
  };
  specs: Record<string, unknown>;
  badges: string[];
  meta: {
    completeness: string;
  };
}

export const SkeletonView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSkeletonProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("🦴 Loading skeleton products from /data/roland/...");

        // FETCH MANIFEST INSTEAD OF HARDCODED LIST
        const manifestResponse = await fetch(
          `/data/roland/manifest.json?v=${Date.now()}`,
        );
        if (!manifestResponse.ok)
          throw new Error("Could not load product manifest");

        const manifest = await manifestResponse.json();
        const productIds = manifest.products || [];
        console.log(`📋 Found ${productIds.length} products in manifest`);

        const loadedProducts: Product[] = [];

        for (const id of productIds) {
          try {
            const response = await fetch(
              `/data/roland/${id}.json?v=${Date.now()}`,
            );
            if (response.ok) {
              const data = (await response.json()) as SkeletonProduct;

              // Convert SkeletonProduct to app Product type for SpectrumLayer
              const fullProduct: Product = {
                id: data.id,
                name: data.name,
                brand: data.brand,
                description: data.description,
                category: data.category,
                // Map media.thumbnail to top-level image properties expected by SpectrumView
                image: data.media.thumbnail || "",
                // FIX: SpectrumLayer expects ProductImagesObject or ProductImage[] with .url property
                images: {
                  main: data.media.thumbnail || "",
                  thumbnail: data.media.thumbnail || "",
                  gallery: data.media.gallery || [],
                },
                // Convert Record<string, unknown> to Specification[]
                specs: Object.entries(data.specs || {}).map(([key, value]) => ({
                  key,
                  value: String(value),
                })),
                // Add dummy pricing for visualizer to work (SpectrumView needs price for X/Y axis)
                halilit_price: 1599, // Dummy price for visualization
                popularity_score: 85, // Dummy score
                pricing: {
                  regular_price: 1599,
                  currency: "USD",
                },
                // Add required fields to satisfy Product type
                main_category: data.category,
                category_hierarchy: [data.category],
              };

              loadedProducts.push(fullProduct);
              console.log(`✅ Loaded: ${id}`);
            }
          } catch {
            console.warn(`⚠️ Could not load ${id}`);
          }
        }

        setProducts(loadedProducts);
        console.log(`🦴 Skeleton loaded: ${loadedProducts.length} products`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("❌ Failed to load skeleton products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSkeletonProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
        <div className="text-center">
          <div className="text-4xl mb-4">🦴</div>
          <p className="text-zinc-400">Loading skeleton products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-zinc-400">No skeleton products found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-[var(--bg-app)] transition-colors duration-500 overflow-y-auto relative flex flex-col">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-transparent to-[var(--bg-app)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full flex-1 flex flex-col p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 uppercase tracking-tight">
            GENESIS SKELETON (ROLAND)
          </h1>
          <p className="text-sm text-zinc-400">
            {products.length} products loaded individually from
            public/data/roland/*.json • Spectrum View
          </p>
        </div>

        {/* Spectrum View - THE STANDARD TEMPLATE */}
        <div className="flex-1 overflow-y-auto scrollbar-custom">
          <SpectrumMiddleLayer
            products={products}
            categoryName="Genesis Skeleton"
          />
        </div>
      </div>
    </div>
  );
};
