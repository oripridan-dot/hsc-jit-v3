import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DualSourceBadge } from './ui/DualSourceBadge';
import { getProductClassification } from '../utils/productClassification';
import { getCountryFlag } from '../utils/countryFlags';
import { getBrandColors } from '../utils/brandColors';

export interface BrandIdentity {
  name?: string;
  logo_url?: string;
  slogan?: string;
  headquarters?: string;
  founded?: number | string;
  website?: string;
  categories?: string[];
}

interface Specification {
  key: string;
  value: string;
  category?: string;
}

interface ImageObject {
  url?: string;
  alt?: string;
}

interface Manual {
  name?: string;
  title?: string;
  url?: string;
  href?: string;
}

interface VideoObject {
  url?: string;
  title?: string;
  type?: 'youtube' | 'vimeo' | 'html5' | 'embedded';
  thumbnail?: string;
}

interface HalalitData {
  sku?: string;
  price?: number;
  currency?: string;
  availability?: string;
  match_quality?: string;
  source?: 'PRIMARY' | 'SECONDARY' | 'HALILIT_ONLY';
  halilit_name?: string;
}

interface StageProduct {
  id?: string;
  name: string;
  brand?: string;
  brand_identity?: BrandIdentity;
  category?: string;
  description?: string | null;
  short_description?: string | null;
  images?: string[] | ImageObject[] | { main?: string; thumbnail?: string; gallery?: (string | ImageObject)[] };
  image_url?: string | null;
  videos?: VideoObject[] | string[];
  specifications?: Specification[];
  manuals?: Manual[];
  knowledgebase?: Array<{ title: string; url: string; category?: string }>;
  resources?: Array<{ title: string; url: string; icon?: string }>;
  price?: number;
  production_country?: string | null;
  halilit_data?: HalalitData;
}

interface TheStageProps {
  product: StageProduct;
  onClose: () => void;
}

const normalizeImages = (p: StageProduct): string[] => {
  const urls: string[] = [];
  const trim = (v?: string | null): string => (typeof v === 'string' ? v.trim() : '');
  if (trim(p.image_url)) urls.push(trim(p.image_url));
  if (p.images) {
    if (Array.isArray(p.images)) {
      p.images.forEach((img) => {
        if (!img) return;
        if (typeof img === 'string') urls.push(trim(img));
        else if (typeof img === 'object' && 'url' in img && img.url) urls.push(trim(img.url));
      });
    } else if (typeof p.images === 'object') {
      const imgObj = p.images as { main?: string; thumbnail?: string; gallery?: (string | ImageObject)[] };
      const { main, thumbnail, gallery } = imgObj;
      if (main) urls.push(trim(main));
      if (thumbnail) urls.push(trim(thumbnail));
      if (Array.isArray(gallery)) {
        gallery.forEach((g) => {
          if (typeof g === 'string') {
            urls.push(trim(g));
          } else if (typeof g === 'object' && g && 'url' in g && g.url) {
            urls.push(trim(g.url));
          }
        });
      }
    }
  }
  return urls.filter(Boolean);
};

const normalizeVideos = (videos?: VideoObject[] | string[]): VideoObject[] => {
  if (!videos) return [];
  if (!Array.isArray(videos)) return [];
  
  return videos
    .map((v): VideoObject | null => {
      if (typeof v === 'string') {
        // Parse string URLs to determine type
        if (v.includes('youtube.com') || v.includes('youtu.be')) {
          return { url: v, type: 'youtube' };
        } else if (v.includes('vimeo.com')) {
          return { url: v, type: 'vimeo' };
        }
        return { url: v, type: 'html5' };
      }
      return v;
    })
    .filter((v): v is VideoObject => v !== null && v.url !== undefined);
};

const groupSpecifications = (specs: Specification[] | undefined): { title: string; items: { key: string; value: string }[] }[] => {
  if (!specs) return [];
  if (Array.isArray(specs)) {
    const grouped: Record<string, { key: string; value: string }[]> = {};
    specs.forEach((s) => {
      const cat = s.category || 'Specs';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ key: s.key, value: s.value });
    });
    return Object.entries(grouped).map(([title, items]) => ({ title, items }));
  }
  return [];
};

const StagePill: React.FC<{ label: string; icon?: string }> = ({ label, icon }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80">
    {icon && <span>{icon}</span>}
    <span>{label}</span>
  </span>
);

export const TheStage: React.FC<TheStageProps> = ({ product, onClose }) => {
  const gallery = useMemo(() => normalizeImages(product), [product]);
  const videos = useMemo(() => normalizeVideos(product.videos), [product.videos]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'images' | 'videos'>('images');
  const [specsExpanded, setSpecsExpanded] = useState(true); // Default expanded now
  const specs = useMemo(() => groupSpecifications(product.specifications), [product.specifications]);
  const manuals = product.manuals || [];
  const knowledgebase = product.knowledgebase || [];
  const resources = product.resources || [];
  
  // Extract top specs (first 3-4 key specs)
  const topSpecs = useMemo(() => {
    if (!product.specifications || !Array.isArray(product.specifications)) return [];
    // Prioritize: Release Year, Synthesis, Genre, Type, Category
    const priorityKeys = ['Release Year', 'Synthesis', 'Genre', 'Type', 'Category'];
    const sorted = [
      ...product.specifications.filter((s) => priorityKeys.includes(s.key)),
      ...product.specifications.filter((s) => !priorityKeys.includes(s.key))
    ];
    return sorted.slice(0, 4);
  }, [product.specifications]);

  const brandName = product.brand_identity?.name || product.brand || 'Unknown Brand';
  const brandLogo = product.brand_identity?.logo_url || '';
  const brandTheme = getBrandColors(product.brand || 'default');

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Brand Theme Accent */}
        <div 
          className="absolute top-0 left-0 w-96 h-96 opacity-5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ backgroundColor: brandTheme.primary }}
        />

        {/* Top Bar - Brand Universe Header */}
        <div 
          className="relative z-20 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-black/60 to-black/60 backdrop-blur-sm"
          style={{ 
            borderBottomColor: `${brandTheme.primary}33`,
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.6), ${brandTheme.primary}1a, rgba(0,0,0,0.6))`
          }}
        >
          <div className="flex items-center gap-4">
            {brandLogo ? (
              <motion.div 
                className="w-14 h-14 rounded-xl flex items-center justify-center p-2 shadow-lg"
                style={{ 
                  backgroundColor: `${brandTheme.primary}19`,
                  borderColor: `${brandTheme.primary}66`,
                  borderWidth: 2
                }}
                whileHover={{ scale: 1.05 }}
              >
                <img 
                  src={brandLogo} 
                  alt={brandName} 
                  className="w-full h-full object-contain drop-shadow-lg filter brightness-0 invert"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('❌ Logo failed to load:', brandLogo);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </motion.div>
            ) : (
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                style={{ 
                  backgroundColor: `${brandTheme.primary}19`,
                  borderColor: `${brandTheme.primary}66`,
                  borderWidth: 2
                }}
              >🏢</div>
            )}
            <div className="flex-1">
              <div className="text-xs text-white/50 uppercase tracking-widest font-semibold">Brand Universe</div>
              <div className="text-2xl font-bold text-white leading-tight">{brandName}</div>
              {product.brand_identity?.slogan && (
                <div className="text-xs italic mt-1 max-w-md" style={{ color: `${brandTheme.primary}cc` }}>"{product.brand_identity.slogan}"</div>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                {product.brand_identity?.headquarters && (
                  <span className="flex items-center gap-1">
                    <span>{getCountryFlag(product.brand_identity.headquarters)}</span>
                    <span>HQ: {product.brand_identity.headquarters}</span>
                  </span>
                )}
                {product.brand_identity?.founded && (
                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    <span>Est. {product.brand_identity.founded}</span>
                  </span>
                )}
              </div>
            </div>
            <div 
              className="px-3 py-2 rounded-lg text-xs font-mono font-bold"
              style={{ backgroundColor: `${brandTheme.primary}22`, color: brandTheme.primary }}
            >
              SKU: {(product.brand || 'unknown').toUpperCase()}
            </div>
            <DualSourceBadge classification={getProductClassification(product as unknown as Record<string, unknown>)} size="sm" />
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold border transition-colors"
            style={{ 
              backgroundColor: `${brandTheme.primary}33`,
              borderColor: `${brandTheme.primary}66`
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = `${brandTheme.primary}4d`;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = `${brandTheme.primary}33`;
            }}
          >
            ✕ Close Stage
          </button>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 grid grid-cols-1 xl:grid-cols-5 gap-6 p-6 overflow-y-auto">
          {/* Hero & Gallery / Videos */}
          <div 
            className="xl:col-span-3 rounded-2xl overflow-hidden shadow-2xl"
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.4)',
              backgroundImage: `linear-gradient(to bottom right, rgba(0,0,0,0.7), rgba(0,0,0,0.4))`,
              borderColor: `${brandTheme.primary}33`,
              borderWidth: 1
            }}
          >
            {/* Media Type Switcher */}
            {videos.length > 0 && gallery.length > 0 && (
              <div className="absolute top-4 right-4 z-10 flex gap-2 bg-black/60 backdrop-blur p-2 rounded-xl border border-white/10">
                <button
                  onClick={() => setViewMode('images')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${viewMode === 'images' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                >
                  📷 Images
                </button>
                <button
                  onClick={() => setViewMode('videos')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${viewMode === 'videos' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                >
                  ▶️ Videos
                </button>
              </div>
            )}

            {/* Images View */}
            {(viewMode === 'images' || videos.length === 0) && (
              <>
                <div className="relative bg-black/30 min-h-[420px] flex items-center justify-center">
                  {gallery.length > 0 ? (
                    <img
                      src={gallery[heroIndex]}
                      alt={product.name}
                      className="max-h-[500px] w-full object-contain"
                    />
                  ) : (
                    <div className="text-7xl text-white/30">🎵</div>
                  )}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {product.category && <StagePill icon="📦" label={product.category} />}
                    {product.production_country && <StagePill icon={getCountryFlag(product.production_country)} label={product.production_country} />}
                  </div>
                </div>
                {gallery.length > 1 && (
                  <div 
                    className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3"
                    style={{ 
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderTopColor: `${brandTheme.primary}33`,
                      borderTopWidth: 1
                    }}
                  >
                    {gallery.slice(0, 10).map((img, idx) => (
                      <button
                        key={img + idx}
                        onClick={() => setHeroIndex(idx)}
                        className="aspect-video rounded-lg overflow-hidden bg-white/5 hover:transition"
                        style={{ 
                          borderColor: heroIndex === idx ? brandTheme.primary : 'rgba(255,255,255,0.1)',
                          borderWidth: 1,
                          boxShadow: heroIndex === idx ? `0 0 16px ${brandTheme.primary}4d` : 'none'
                        }}
                      >
                        <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Videos View */}
            {viewMode === 'videos' && videos.length > 0 && (
              <div className="space-y-2 p-3">
                <div className="relative bg-black/30 min-h-[420px] flex items-center justify-center rounded-lg overflow-hidden">
                  {videos[heroIndex]?.type === 'youtube' && (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videos[heroIndex].url?.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/)?.[1]}`}
                      title={videos[heroIndex].title || 'Video'}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  )}
                  {videos[heroIndex]?.type === 'vimeo' && (
                    <iframe
                      src={`https://player.vimeo.com/video/${videos[heroIndex].url?.match(/vimeo\.com\/(\d+)/)?.[1]}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  )}
                  {videos[heroIndex]?.type === 'html5' && videos[heroIndex].url && (
                    <video
                      src={videos[heroIndex].url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                {videos.length > 1 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {videos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setHeroIndex(idx)}
                        className="aspect-video rounded-lg overflow-hidden bg-white/10 border flex items-center justify-center hover:bg-white/20 transition"
                        style={{
                          borderColor: heroIndex === idx ? brandTheme.primary : 'rgba(255,255,255,0.1)',
                          borderWidth: 1,
                          boxShadow: heroIndex === idx ? `0 0 16px ${brandTheme.primary}4d` : 'none'
                        }}
                      >
                        <span className="text-2xl">▶️</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detail Column */}
          <div className="xl:col-span-2 space-y-4">
            {/* Halilit Data Badge (if available) */}
            {product.halilit_data && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-3 border-l-4"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderLeftColor: product.halilit_data.source === 'PRIMARY' ? '#10b981' : '#f59e0b',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-xs uppercase tracking-wide">
                    {product.halilit_data.source === 'PRIMARY' ? '✅ Dual Source' : '📡 Brand Direct'}
                  </span>
                  {product.halilit_data.match_quality && (
                    <span className="text-xs text-white/60">({product.halilit_data.match_quality}% match)</span>
                  )}
                </div>
                <div className="space-y-1 text-xs text-white/70">
                  {product.halilit_data.sku && (
                    <div><span className="text-white/50">SKU:</span> <span className="font-mono">{product.halilit_data.sku}</span></div>
                  )}
                  {product.halilit_data.price && (
                    <div><span className="text-white/50">Price:</span> <span className="font-bold">{product.halilit_data.currency || 'ILS'} {product.halilit_data.price}</span></div>
                  )}
                  {product.halilit_data.availability && (
                    <div><span className="text-white/50">Status:</span> {product.halilit_data.availability}</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Product Header */}
            <div className="bg-bg-card/70 border border-white/10 rounded-2xl p-5 shadow-xl">
              <h1 className="text-3xl font-bold text-white mb-3 leading-tight">{product.name}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {product.brand && <StagePill label={product.brand} icon="🏢" />}
                <StagePill label="Static Mode" icon="📡" />
              </div>
            </div>

            {/* Top Specs - NOW AT TOP (Expanded by Default) */}
            <motion.div
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.5)',
                backgroundImage: `linear-gradient(135deg, ${brandTheme.primary}33 0%, rgba(0,0,0,0.3) 100%)`,
                borderColor: `${brandTheme.primary}4d`,
                borderWidth: 1
              }}
              layout
            >
              <button
                onClick={() => setSpecsExpanded(!specsExpanded)}
                className="w-full px-5 py-5 flex items-start justify-between hover:bg-white/5 transition-colors"
              >
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⚡</span>
                    <span className="text-sm uppercase tracking-widest font-semibold" style={{ color: `${brandTheme.primary}cc` }}>Key Specifications</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {topSpecs.slice(0, 2).map((spec, idx) => (
                      <div key={idx} className="text-left">
                        <div className="text-xs uppercase tracking-wide text-white/50">{spec.key}</div>
                        <div className="text-lg font-bold text-white mt-0.5">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                  {topSpecs.length > 2 && specsExpanded && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {topSpecs.slice(2, 4).map((spec, idx) => (
                        <div key={idx} className="text-left">
                          <div className="text-xs uppercase tracking-wide text-white/50">{spec.key}</div>
                          <div className="text-lg font-bold text-white mt-0.5">{spec.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-2xl ml-4 flex-shrink-0">
                  {specsExpanded ? '▼' : '▶'}
                </div>
              </button>

              {/* Expanded Full Specs */}
              <AnimatePresence>
                {specsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 py-5"
                    style={{ 
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderTopColor: `${brandTheme.primary}33`,
                      borderTopWidth: 1
                    }}
                  >
                    {/* Full Description */}
                    {(product.description || product.short_description) && (
                      <div className="mb-6 pb-6" style={{ borderBottomColor: 'rgba(255,255,255,0.1)', borderBottomWidth: 1 }}>
                        <h3 className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-3">📖 About This Product</h3>
                        <p className="text-sm leading-relaxed text-white/70">
                          {product.description || product.short_description}
                        </p>
                      </div>
                    )}

                    {/* All Specifications */}
                    {specs.length > 0 ? (
                      <div className="space-y-4">
                        {specs.map((section) => (
                          <div key={section.title} className="space-y-2">
                            <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: `${brandTheme.primary}99` }}>
                              {section.title}
                            </div>
                            <dl className="grid grid-cols-2 gap-3">
                              {section.items.map((it, idx) => (
                                <div key={section.title + idx} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                                  <dt className="text-xs uppercase tracking-wide text-white/50 mb-1">{it.key}</dt>
                                  <dd className="text-sm font-medium text-white">{it.value}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm">No additional specifications available.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="bg-bg-card/70 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span className="text-lg">📚</span>
                <span className="font-semibold">Documentation & Resources</span>
              </div>
              <div className="space-y-3">
                {/* Manuals */}
                {manuals && manuals.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-xs uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1">
                      <span>📄</span> Product Manuals
                    </div>
                    <ul className="space-y-1 text-sm">
                      {manuals.map((m, idx) => (
                        <li key={idx}>
                          <a 
                            href={m.url || m.href || '#'} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-accent-primary hover:underline truncate flex items-center gap-1"
                          >
                            <span>→</span>
                            {m.name || m.title || 'Manual'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Knowledge Base */}
                {knowledgebase && knowledgebase.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-xs uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1">
                      <span>💡</span> Knowledge Base
                    </div>
                    <ul className="space-y-1 text-sm">
                      {knowledgebase.map((kb, idx) => (
                        <li key={idx}>
                          <a 
                            href={kb.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-accent-secondary hover:underline truncate flex items-center gap-1"
                            title={kb.category ? `Category: ${kb.category}` : ''}
                          >
                            <span>→</span>
                            {kb.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Resources */}
                {resources && resources.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-xs uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1">
                      <span>🔗</span> Resources
                    </div>
                    <ul className="space-y-1 text-sm">
                      {resources.map((res, idx) => (
                        <li key={idx}>
                          <a 
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent-primary hover:underline truncate flex items-center gap-1"
                          >
                            <span>{res.icon || '→'}</span>
                            {res.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Brand Website */}
                {product.brand_identity?.website && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-xs uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1">
                      <span>🌐</span> Official Site
                    </div>
                    <a 
                      href={product.brand_identity.website} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-accent-primary hover:underline text-sm truncate flex items-center gap-1"
                    >
                      <span>→</span>
                      {product.brand_identity.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </a>
                  </div>
                )}

                {/* Fallback Search Resources */}
                {(!manuals || manuals.length === 0) && (!knowledgebase || knowledgebase.length === 0) && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-xs uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1">
                      <span>🔍</span> Search Online
                    </div>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <button
                          onClick={() => window.open(`https://www.google.com/search?q=${product.name} ${product.brand} manual`, '_blank')}
                          className="text-accent-primary hover:underline text-left flex items-center gap-1"
                        >
                          <span>→</span>
                          Search Manuals
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => window.open(`https://www.youtube.com/search?q=${product.name} ${product.brand} review`, '_blank')}
                          className="text-accent-primary hover:underline text-left flex items-center gap-1"
                        >
                          <span>→</span>
                          Watch Videos
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TheStage;
