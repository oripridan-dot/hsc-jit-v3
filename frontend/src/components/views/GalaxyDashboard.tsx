/**
 * GalaxyDashboard - Empty State / Home View
 * Shows global statistics and serves as the default view
 */
import { Compass, Sparkles } from "lucide-react";
import React from "react";

export const GalaxyDashboard: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-y-auto relative">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-2xl text-center space-y-6">
          {/* Hero Icon */}
          <div className="inline-block p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Compass size={64} className="text-indigo-400" />
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
            Halilit Mission Control
          </h1>

          <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
            A unified catalog explorer for professional musical instruments
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-indigo-500/50 transition-all">
              <div className="text-2xl font-bold text-indigo-400 mb-1">117</div>
              <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                Products
              </div>
            </div>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-purple-500/50 transition-all">
              <div className="text-2xl font-bold text-purple-400 mb-1">4</div>
              <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                Brands
              </div>
            </div>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-pink-500/50 transition-all">
              <div className="text-2xl font-bold text-pink-400 mb-1">7</div>
              <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                Categories
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 justify-center mb-6">
              <Sparkles size={18} className="text-amber-400" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Getting Started
              </h2>
            </div>
            <ul className="space-y-3 text-left inline-block">
              <li className="flex items-start gap-3 text-[var(--text-secondary)]">
                <span className="text-indigo-400 font-bold">1.</span>
                <span>
                  Click on a <strong>Brand</strong> in the left sidebar to
                  explore their catalog
                </span>
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]">
                <span className="text-purple-400 font-bold">2.</span>
                <span>
                  Select a <strong>Category</strong> to see products in that
                  family
                </span>
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]">
                <span className="text-pink-400 font-bold">3.</span>
                <span>
                  Click a <strong>Product</strong> to view detailed specs and
                  media
                </span>
              </li>
            </ul>
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-lg p-3">
              <div className="text-sm font-semibold text-indigo-300 mb-1">
                🎵 Product Details
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                Full specs, images, videos, and documentation
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-lg p-3">
              <div className="text-sm font-semibold text-purple-300 mb-1">
                📊 Structured Data
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                Clean hierarchies with accurate categorization
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/20 rounded-lg p-3">
              <div className="text-sm font-semibold text-pink-300 mb-1">
                🚀 Fast Navigation
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                Instant switching between views and zoom levels
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-lg p-3">
              <div className="text-sm font-semibold text-amber-300 mb-1">
                🎨 Brand Identity
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                UI colors adapt to your selected brand
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
