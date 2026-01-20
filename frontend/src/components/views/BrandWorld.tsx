/**
 * BrandWorld - Brand Dashboard View
 * Immersive page showing brand identity, stats, and featured products
 */
import React, { useMemo } from 'react';
import { useBrandData } from '../../hooks/useBrandData';
import { useBrandCatalog } from '../../hooks/useBrandCatalog';
import { ShieldCheck, Box, ExternalLink, Activity, Music } from 'lucide-react';

interface BrandWorldProps {
  brandId: string;
}

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
  <div className="p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-center gap-4 hover:border-[var(--brand-primary)] transition-colors">
    <div className="p-3 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">{label}</div>
    </div>
  </div>
);

export const BrandWorld: React.FC<BrandWorldProps> = ({ brandId }) => {
  const brandData = useBrandData(brandId);
  const catalog = useBrandCatalog(brandId);

  // Calculate stats from actual data
  const stats = useMemo(() => {
    if (!catalog) {
      return {
        totalProducts: 0,
        totalImages: 0,
        totalVideos: 0,
        categories: [] as string[]
      };
    }

    const products = catalog.products || [];
    const totalImages = products.reduce((sum, p) => {
      const images = Array.isArray(p.images) 
        ? p.images.filter(img => typeof img === 'object' && 'url' in img).length
        : 0;
      return sum + images;
    }, 0);

    const totalVideos = products.reduce((sum, p) => {
      const videos = Array.isArray(p.video_urls || p.youtube_videos || p.videos)
        ? (p.video_urls || p.youtube_videos || p.videos).filter((v: any) => v).length
        : 0;
      return sum + videos;
    }, 0);

    // Extract unique categories from products
    const categoriesSet = new Set<string>();
    products.forEach(p => {
      if (p.main_category) categoriesSet.add(p.main_category);
      if (p.subcategory) categoriesSet.add(p.subcategory);
    });

    return {
      totalProducts: products.length,
      totalImages,
      totalVideos,
      categories: Array.from(categoriesSet).slice(0, 6)
    };
  }, [catalog]);

  if (!brandData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)]">
        <div className="text-center">
          <Music size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading brand...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 relative z-10">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-transparent to-[var(--bg-app)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* HERO SECTION */}
        <div className="relative rounded-2xl overflow-hidden min-h-[240px] border border-[var(--brand-primary)]/30 shadow-2xl shadow-[var(--brand-primary)]/10">
          {/* Background gradient using brand color */}
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              background: `linear-gradient(135deg, ${brandData.brandColor}40, ${brandData.secondaryColor}40)`
            }}
          />
          
          <div className="relative z-10 p-8 flex items-end justify-between h-full">
            <div>
              <h1 className="text-5xl font-black text-white tracking-tight mb-2 uppercase">
                {brandData.name}
              </h1>
              <p className="text-[var(--text-secondary)] max-w-xl text-lg">
                {brandData.description || "Professional Musical Instruments & Equipment"}
              </p>
            </div>
            {brandData.logoUrl && (
              <img 
                src={brandData.logoUrl}
                alt={brandData.name} 
                className="h-24 object-contain opacity-50 hover:opacity-100 transition-opacity duration-500" 
              />
            )}
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Box size={20} />}
            value={stats.totalProducts}
            label="Total Products" 
          />
          <StatCard 
            icon={<ShieldCheck size={20} />}
            value={stats.totalImages}
            label="Product Images" 
          />
          <StatCard 
            icon={<Activity size={20} />}
            value={stats.totalVideos}
            label="Videos" 
          />
          <StatCard 
            icon={<Music size={20} />}
            value={stats.categories.length}
            label="Categories" 
          />
        </div>

        {/* BRAND DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* About Section */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span 
                className="w-1.5 h-6 rounded-full"
                style={{ backgroundColor: brandData.brandColor }}
              />
              About This Brand
            </h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {brandData.description || 'Professional manufacturer of electronic musical instruments and audio equipment. Dedicated to quality, innovation, and musician satisfaction.'}
            </p>
            {brandData.website && (
              <a
                href={brandData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 transition-colors"
              >
                Visit Official Website
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          {/* Key Features */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span 
                className="w-1.5 h-6 rounded-full"
                style={{ backgroundColor: brandData.secondaryColor }}
              />
              Catalog Highlights
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--brand-primary)] font-bold mt-0.5">✓</span>
                <span>Complete product specifications and documentation</span>
              </li>
              <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--brand-primary)] font-bold mt-0.5">✓</span>
                <span>High-quality product imagery and video resources</span>
              </li>
              <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--brand-primary)] font-bold mt-0.5">✓</span>
                <span>Hierarchical categorization for easy navigation</span>
              </li>
              <li className="flex items-start gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--brand-primary)] font-bold mt-0.5">✓</span>
                <span>Verified data from official sources</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Featured Categories Section */}
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span 
              className="w-1.5 h-6 rounded-full"
              style={{ backgroundColor: brandData.brandColor }}
            />
            Product Categories ({stats.categories.length})
          </h3>
          <p className="text-[var(--text-secondary)] mb-4 text-sm">
            {stats.totalProducts === 0 
              ? "No products available in this catalog yet."
              : `Explore ${stats.totalProducts} product${stats.totalProducts !== 1 ? 's' : ''} organized by type. Click on a category in the sidebar to view products.`
            }
          </p>
          {stats.categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {stats.categories.map((cat) => (
                <div
                  key={cat}
                  className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-panel)]/60 transition-all cursor-pointer group"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
                    {cat}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/30">
              <p className="text-[var(--text-secondary)] text-sm">No categories available</p>
            </div>
          )}
        </div>

        {/* Data Source Information */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6 text-center">
          <p className="text-[var(--text-secondary)] text-sm">
            This catalog contains verified information from official brand sources and community-curated data
          </p>
        </div>
      </div>
    </div>
  );
};
