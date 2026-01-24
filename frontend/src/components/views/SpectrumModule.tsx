import { ArrowLeft, BarChart3, Maximize2, ScanLine } from "lucide-react";
import { useMemo, useState } from "react";
import { useCategoryProducts } from "../../hooks/useCategoryProducts";
import { useNavigationStore } from "../../store/navigationStore";
import type { TierBarProduct } from "../smart-views/TierBar";
import { TierBar } from "../smart-views/TierBar";
import { Control } from "../ui/Control";
import { Surface } from "../ui/Surface";

export const SpectrumModule = () => {
  const { activeSubcategoryId, activeFilters, goToGalaxy, openProductPop } =
    useNavigationStore();

  // Fetch Data
  const { products: rawProducts } = useCategoryProducts(activeSubcategoryId);

  // Local State
  const [hoveredProduct, setHoveredProduct] = useState<TierBarProduct | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState("ALL");

  // Filter Logic (Layer 3 Buttons)
  const filteredProducts = useMemo<TierBarProduct[]>(() => {
    let base = rawProducts;
    if (activeFilter !== "ALL") {
      base = rawProducts.filter(
        (p) =>
          // Best effort filtering based on available props
          p.tags?.includes(activeFilter) ||
          p.brand === activeFilter ||
          p.specs?.some((s) => s.value === activeFilter),
      );
    }

    // Transform to TierBarProduct format
    const transformed = base.map((p) => {
      const price = p.halilit_data?.price || p.pricing?.regular_price || 0;

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: price,
        logo_url: `/data/logos/${p.brand.toLowerCase()}_logo.jpg`,
        image_url: p.image_url || p.image || "",
        stock_status: p.availability || "unknown",
        specs_preview:
          p.specs
            ?.slice(0, 4)
            .map((s) => ({ key: s.key, val: s.value.toString() })) || [],
        description: p.description,
      };
    });

    // Sort by price for the TierBar logic
    return transformed.sort((a, b) => a.price - b.price);
  }, [rawProducts, activeFilter]);

  return (
    <div className="flex flex-col h-full bg-[#0b0c10] text-white overflow-hidden relative">
      {/* -----------------------------------------------------------
          1. TOP DECK (1176 Filters)
         ----------------------------------------------------------- */}
      <Surface
        variant="panel"
        className="h-16 flex items-center px-4 gap-4 z-30 !bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 shadow-2xl"
      >
        <Control
          onClick={goToGalaxy}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Control>

        <div className="h-8 w-px bg-zinc-800 mx-2" />

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 mask-linear-fade flex-1">
          <Control
            variant="1176"
            label="ALL"
            active={activeFilter === "ALL"}
            onClick={() => setActiveFilter("ALL")}
          />
          {activeFilters.map((filter) => (
            <Control
              key={filter}
              variant="1176"
              label={filter}
              active={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            />
          ))}
        </div>
      </Surface>

      {/* -----------------------------------------------------------
          2. DATA SCREENS (Three-Panel Display)
         ----------------------------------------------------------- */}
      <div className="h-64 grid grid-cols-12 gap-1 p-1 bg-black border-b border-zinc-800 z-20">
        {/* LEFT: Visual */}
        <Surface
          variant="screen"
          active={!!hoveredProduct}
          className="col-span-3 bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden"
        >
          {hoveredProduct ? (
            <>
              <img
                src={hoveredProduct.image_url}
                className="max-w-full max-h-full object-contain animate-fade-in z-10"
                alt="Preview"
              />
              {/* Scan Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
            </>
          ) : (
            <ScanLine className="w-8 h-8 text-zinc-800 animate-pulse" />
          )}
          <div className="absolute top-2 left-2 text-[9px] text-zinc-600 font-mono">
            VISUAL_FEED
          </div>
        </Surface>

        {/* CENTER: Data */}
        <Surface
          variant="screen"
          active={!!hoveredProduct}
          className="col-span-6 bg-zinc-950 p-6 flex flex-col relative overflow-hidden"
        >
          {hoveredProduct ? (
            <div className="z-10 animate-fade-in space-y-4 h-full flex flex-col justify-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={hoveredProduct.logo_url}
                    className="h-5 opacity-80 invert"
                    alt={hoveredProduct.brand}
                  />
                  <span className="text-[9px] px-1.5 py-0.5 border border-emerald-900 bg-emerald-950/30 text-emerald-500 rounded font-mono">
                    {hoveredProduct.stock_status}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase truncate">
                  {hoveredProduct.name}
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-zinc-900 pt-4">
                {hoveredProduct.specs_preview?.map((spec: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-baseline border-b border-zinc-900/50 pb-1"
                  >
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      {spec.key}
                    </span>
                    <span className="text-sm text-zinc-300 font-mono truncate max-w-[120px] text-right">
                      {spec.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
              <BarChart3 className="w-12 h-12 opacity-20" />
              <span className="text-xs font-mono">HOVER TO DECODE SIGNAL</span>
            </div>
          )}
          <div className="absolute top-2 left-2 text-[9px] text-emerald-700 font-mono">
            DATA_STREAM
          </div>
        </Surface>

        {/* RIGHT: Action */}
        <Surface
          variant="screen"
          active={!!hoveredProduct}
          className="col-span-3 bg-zinc-950 flex flex-col justify-center items-center p-6"
        >
          {hoveredProduct && (
            <div className="animate-slide-up text-center w-full space-y-4">
              <div>
                <div className="text-4xl font-black text-white tracking-tighter">
                  ₪{hoveredProduct.price.toLocaleString()}
                </div>
                <div className="text-[9px] text-zinc-500 mt-1">
                  VAT INCLUDED
                </div>
              </div>
              <button
                onClick={() => openProductPop(hoveredProduct.id)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 uppercase text-xs tracking-widest transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-3 h-3" /> Inspect
              </button>
            </div>
          )}
          <div className="absolute top-2 left-2 text-[9px] text-zinc-600 font-mono">
            TRANSACTION
          </div>
        </Surface>
      </div>

      {/* -----------------------------------------------------------
          3. TIER BAR (The Main Engine)
         ----------------------------------------------------------- */}
      <div className="flex-1 relative bg-gradient-to-b from-[#050505] to-[#0e0e10] p-8 flex flex-col justify-center">
        {/* Background Grid Lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)",
            backgroundSize: "10% 25%",
          }}
        />

        <div className="w-full max-w-[95%] mx-auto relative z-10 h-full flex items-end pb-12">
          <TierBar
            products={filteredProducts}
            onHoverProduct={setHoveredProduct}
            onSelectProduct={openProductPop}
          />
        </div>
      </div>
    </div>
  );
};
