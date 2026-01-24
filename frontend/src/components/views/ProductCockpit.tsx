/**
 * ProductCockpit - v3.8.0 SCREEN 3
 * "Product Pop Interface - Official Product Knowledge"
 *
 * The comprehensive product detail view featuring:
 * - Full specifications
 * - Media gallery (images + videos)
 * - Documentation & manuals
 * - Related products & accessories
 *
 * This is the deepest drill-down in the 3-screen architecture.
 */
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Book,
  Box,
  ExternalLink,
  FileText,
  Globe,
  Headphones,
  Info,
  Layers,
  Share2,
  Youtube,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product, ProductRelationship } from "../../types";

interface ProductCockpitProps {
  product: Product;
}

export const ProductCockpit: React.FC<ProductCockpitProps> = ({ product }) => {
  const { goBack } = useNavigationStore();
  const [activeTab, setActiveTab] = useState<"specs" | "docs" | "accessories">(
    "specs",
  );
  const [showEilat, setShowEilat] = useState(false);

  // Safely extract manual list
  const manuals = product.manuals || [];

  // Pricing Logic
  const pricing = product.pricing || {};
  const regularPrice = pricing.regular_price || product.halilit_price || 0;
  const eilatPrice = pricing.eilat_price;
  const listPrice = pricing.sale_price; // Backend maps "old/list price" to sale_price

  // Display Logic
  const currentPrice = showEilat && eilatPrice ? eilatPrice : regularPrice;
  const isEilatMode = showEilat && !!eilatPrice;


  // Safely extract accessories
  const accessories = product.accessories || [];

  // Safely extract related products
  const related = product.related || [];

  // Combine media (Images + Videos)
  // Logic to build a media gallery list
  const mediaGallery = React.useMemo(() => {
    let images: string[] = [];
    const mainImg = product.image_url || product.image;
    if (mainImg) images.push(mainImg);

    if (product.images) {
      if (Array.isArray(product.images)) {
        images = [
          ...images,
          ...product.images.map((img) =>
            typeof img === "string" ? img : img.url,
          ),
        ];
      } else {
        const imgObj = product.images as Record<string, unknown>;
        if (imgObj.main) images.push(imgObj.main as string);
        if (imgObj.gallery && Array.isArray(imgObj.gallery)) {
          images = [...images, ...(imgObj.gallery as string[])];
        }
      }
    }

    const uniqueImages = Array.from(new Set(images.filter(Boolean)));
    const videos = product.video_urls || [];

    return [...uniqueImages, ...videos];
  }, [product]);

  const [selectedMedia, setSelectedMedia] = useState<string>(
    mediaGallery[0] || "",
  );

  const isVideo = (url: string) =>
    url && (url.includes("youtube") || url.includes("vimeo"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      {/* Main Cockpit Container - The "Pop Window" */}
      <div className="w-full max-w-7xl h-full md:h-[90vh] bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header Bar */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0c0c0e]">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                {product.brand}
              </span>
              <span className="text-sm font-bold text-white">
                {product.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Indicators */}
            {product.availability && (
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                  ${
                    product.availability === "in-stock"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
              >
                {product.availability}
              </div>
            )}
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Share2 size={18} />
            </button>
            <button
              onClick={goBack} // Close acts as go back
              className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: Visual Stage */}
          <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col bg-gradient-to-br from-[#0c0c0e] to-[#050505] relative">
            {/* Main Stage */}
            <div className="flex-1 flex items-center justify-center p-8 relative group">
              {isVideo(selectedMedia) ? (
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 relative">
                  {/* Naive embed for demo - in real app use robust player */}
                  <iframe
                    src={selectedMedia.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <motion.img
                  key={selectedMedia}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={selectedMedia}
                  alt={product.name}
                  className="max-w-full max-h-[50vh] object-contain drop-shadow-2xl z-10"
                />
              )}

              {/* Background Glow */}
              <div className="absolute inset-0 bg-indigo-500/5 blur-3xl pointer-events-none" />
            </div>

            {/* Media Strip */}
            <div className="h-24 bg-[#0a0a0a] border-t border-white/5 flex items-center px-6 gap-3 overflow-x-auto scrollbar-hide">
              {mediaGallery.map((media, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMedia(media)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedMedia === media
                      ? "border-[#00ff94] opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  {isVideo(media) ? (
                    <div className="w-full h-full bg-red-900/20 flex items-center justify-center">
                      <Youtube size={20} className="text-red-500" />
                    </div>
                  ) : (
                    <img
                      src={media}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Data Deck */}
          <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col bg-[#09090b] border-l border-white/5">
            {/* Product Summary */}
            <div className="p-8 pb-4">
              <div className="flex flex-col mb-4">
                <div className="flex items-baseline justify-between w-full">
                  <div
                    className={`text-4xl font-mono tracking-tighter transition-colors duration-300 ${
                      isEilatMode ? "text-orange-400" : "text-[#00ff94]"
                    }`}
                  >
                    {currentPrice
                      ? `₪${currentPrice.toLocaleString()}`
                      : "Price on Request"}
                  </div>

                  {eilatPrice && (
                    <button
                      onClick={() => setShowEilat(!showEilat)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-300 flex items-center gap-2 ${
                        isEilatMode
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30"
                          : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {isEilatMode ? (
                        <>
                          <span>☀️</span> Eilat Price
                        </>
                      ) : (
                        <>
                          <span>🏙️</span> Standard Price
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Strikethrough Logic */}
                {!isEilatMode && listPrice && listPrice > regularPrice && (
                  <div className="text-zinc-500 line-through text-sm font-mono mt-1">
                    List: ₪{listPrice.toLocaleString()}
                  </div>
                )}

                {/* Eilat Savings */}
                {isEilatMode && (
                  <div className="text-orange-400/60 text-sm font-mono mt-1">
                    VAT Free Savings: ₪{(
                      regularPrice - (eilatPrice || 0)
                    ).toLocaleString()}
                  </div>
                )}
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 md:line-clamp-none">
                {product.description ||
                  product.short_description ||
                  "No description available."}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center px-8 border-b border-white/5 gap-6">
              <TabButton
                active={activeTab === "specs"}
                onClick={() => setActiveTab("specs")}
                icon={Info}
                label="Specs"
              />
              <TabButton
                active={activeTab === "docs"}
                onClick={() => setActiveTab("docs")}
                icon={Book}
                label="Docs"
                count={manuals.length}
              />
              <TabButton
                active={activeTab === "accessories"}
                onClick={() => setActiveTab("accessories")}
                icon={Headphones}
                label="Gear"
                count={accessories.length + related.length}
              />
            </div>

            {/* Scrollable Panel Content */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-custom">
              {/* SPECS PANEL */}
              {activeTab === "specs" && (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h3 className="text-xs font-bold text-white uppercase mb-4 flex items-center gap-2">
                      <Layers size={14} className="text-indigo-400" />
                      Key Findings
                    </h3>
                    <ul className="space-y-2">
                      {product.features?.slice(0, 5).map((f, i) => (
                        <li
                          key={i}
                          className="text-sm text-zinc-300 flex items-start gap-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff94] mt-1.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {product.specs && (
                    <div className="grid grid-cols-1 gap-y-4">
                      {product.specs.slice(0, 10).map((spec, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 border-b border-white/5"
                        >
                          <span className="text-xs text-zinc-500 uppercase">
                            {spec.key}
                          </span>
                          <span className="text-sm text-white font-medium text-right">
                            {spec.value.toString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DOCS PANEL */}
              {activeTab === "docs" && (
                <div className="space-y-4">
                  <div className="text-zinc-400 text-sm mb-4">
                    Official manuals, guides, and firmware updates.
                  </div>

                  {manuals.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {manuals.map((manual, i) => (
                        <a
                          key={i}
                          href={manual.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-[#00ff94]/50 hover:bg-zinc-800 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 group-hover:bg-[#00ff94]/20 flex items-center justify-center transition-colors">
                            <FileText
                              size={20}
                              className="text-zinc-400 group-hover:text-[#00ff94]"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate group-hover:text-[#00ff94] transition-colors">
                              {manual.title}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {manual.language || "English"} •{" "}
                              {manual.format?.toUpperCase() || "PDF"}
                            </div>
                          </div>
                          <ExternalLink
                            size={16}
                            className="text-zinc-600 group-hover:text-white"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-600 italic">
                      No documentation available currently.
                    </div>
                  )}

                  {product.knowledgebase &&
                    product.knowledgebase.length > 0 && (
                      <div className="mt-8">
                        <h4 className="text-xs font-bold text-white uppercase mb-3">
                          Knowledge Base
                        </h4>
                        <div className="space-y-2">
                          {product.knowledgebase.map((kb, i) => (
                            <a
                              key={i}
                              href={kb.url}
                              target="_blank"
                              className="block text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                            >
                              {kb.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* ACCESSORIES PANEL */}
              {activeTab === "accessories" && (
                <div className="space-y-6">
                  {accessories.length > 0 ? (
                    <AccessoryList
                      items={accessories}
                      title="Essential Accessories"
                    />
                  ) : null}

                  {related.length > 0 ? (
                    <AccessoryList items={related} title="Related Products" />
                  ) : null}

                  {accessories.length === 0 && related.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                      <Box size={48} className="mb-4 opacity-20" />
                      <p>No specific accessories linked.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-white/5 bg-[#0c0c0e]">
              <a
                href={product.detail_url || product.brand_product_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#00ff94] hover:bg-[#00ff94]/90 text-black font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                View on {product.brand || "Official Site"} <Globe size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
}

const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}) => (
  <button
    onClick={onClick}
    className={`relative py-4 text-sm font-medium transition-colors flex items-center gap-2
            ${active ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
        `}
  >
    <Icon size={16} className={active ? "text-[#00ff94]" : ""} />
    {label}
    {count !== undefined && (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-[#00ff94]/20 text-[#00ff94]" : "bg-zinc-800"}`}
      >
        {count}
      </span>
    )}
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff94]"
      />
    )}
  </button>
);

const AccessoryList = ({
  items,
  title,
}: {
  items: ProductRelationship[];
  title: string;
}) => (
  <div>
    <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4">{title}</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors"
        >
          {/* Placeholder icon since we might not have accessory images loaded here yet */}
          <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center shrink-0">
            <Box size={16} className="text-zinc-600" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {item.name}
            </div>
            <div className="text-xs text-zinc-500 capitalize">{item.type}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
