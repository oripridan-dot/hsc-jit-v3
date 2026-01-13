import type { Prediction } from '../store/useWebSocketStore';

export interface FileNode {
  id: string;
  name: string;
  type: 'root' | 'folder' | 'brand' | 'category' | 'file';
  icon?: string; // Emoji fallback
  image?: string; // URL for brand logo or product thumbnail (preferred over icon)
  logoUrl?: string; // Explicit brand logo URL from brand_identity
  children?: FileNode[];
  meta?: Record<string, unknown>; // Stores stats like { count: 12, totalValue: 50000 }
  items?: Prediction[]; // The actual products inside
}

// Comprehensive Brand Logo Mapping - All 90+ Brands (Exact Names from Catalogs)
const BRAND_LOGOS: Record<string, string> = {
  // Keyboards & Synthesizers
  'Roland Corporation': '🎹',
  'Nord Keyboards': '🎹',
  'Moog Music': '🎛️',
  'Korg': '🎹',
  'Akai Professional': '🎮',
  'Teenage Engineering': '🎮',
  'Studiologic': '🎹',
  'Oberheim': '🎛️',
  'M-Audio': '🎚️',
  'Medeli': '🎹',
  
  // Drums & Percussion
  'Pearl': '🥁',
  'Paiste': '🥁',
  'Remo': '🥁',
  'Dixon': '🥁',
  'Adams': '🥁',
  'Rogers': '🥁',
  'Gon Bops': '🪘',
  'Rhythm Tech': '🪘',
  'Regal Tip': '🥁',
  'Drumdots': '🥁',
  'Turkish Cymbals': '🥁',
  'Marimba One': '🎼',
  
  // Guitars & Basses
  'ESP': '🎸',
  'Washburn': '🎸',
  'Spector': '🎸',
  'Breedlove': '🎸',
  'Córdoba': '🎸',
  "D'Angelico": '🎸',
  'Maton': '🎸',
  'Maybach': '🎸',
  'Waterstone': '🎸',
  'Heritage Audio': '🎸',
  'Solar Guitars': '🎸',
  'LSG Guitars': '🎸',
  'Bohemian': '🎸',
  'Antigua': '🎸',
  'Ortega': '🎸',
  'Encore': '🎸',
  'Jasmine': '🎸',
  'Ocean Schmidt': '🎸',
  'Vintage': '🎸',
  
  // Guitar Effects & Pedals
  'BOSS': '🎛️',
  'Xotic': '🎛️',
  'Foxgear': '🎛️',
  'HeadRush': '🎛️',
  'Xvive': '🎛️',
  
  // Amplifiers
  'Ampeg': '🔊',
  'Ashdown': '🔊',
  'Eden': '🔊',
  'Hiwatt': '🔊',
  
  // Pro Audio & Monitors
  'RCF': '🔊',
  'PreSonus': '🎚️',
  'ADAM Audio': '🔊',
  'Dynaudio': '🔊',
  'Eve Audio': '🔊',
  'KRK': '🔊',
  'Amphion': '🔊',
  'EAW': '🔊',
  'Mackie': '🔊',
  'Montarbo': '🔊',
  'Soundking': '🔊',
  
  // Microphones
  'Blue Microphones': '🎤',
  'Austrian Audio': '🎤',
  'MXL': '🎤',
  
  // Mixing & Recording
  'Allen & Heath': '🎚️',
  'Avid': '🎚️',
  'Steinberg': '🎚️',
  'Universal Audio': '🎚️',
  'Warm Audio': '🎚️',
  'Lynx Studio Technology': '🎚️',
  
  // Accessories
  'Halilit': '🎵',
  'Halilit AKD-1': '🎵',
  "D'Addario": '🎼',
  "Perri's Leathers": '🎼',
  'On Stage Stands': '🎼',
  'Ultimate Support': '🎼',
  'Guitar Pro': '🎼',
  'Show': '🎼',
  'Bespeco': '🎼',
  'Magma': '🎼',
  'FZone': '🎼',
  'ASM': '🎼',
  'Maestro': '🎼',
  
  // DJ & Production
  'V-MODA': '🎧',
  'Keith McMillen Instruments': '🎮',
  'Fusion': '🎚️',
  'Fusion (Alternate)': '🎚️',
  'Sound Reference': '🎚️',
  'Sound Reference (Ultimate Ears)': '🎚️',
  'Tombo': '🎵',
  'Headliner': '🎧'
};

// Helper to calculate folder stats
const getStats = (items: Prediction[]) => {
  if (!items.length) return { count: 0, value: 0, avg: 0 };
  const value = items.reduce((acc, i) => acc + ((i as any).price || 0), 0);
  return {
    count: items.length,
    value,
    avg: Math.round(value / items.length)
  };
};

export const buildFileSystem = (products: Prediction[]): FileNode => {
  // 1. Group by Brand
  const brands: Record<string, Prediction[]> = {};
  const categories: Record<string, Prediction[]> = {};

  products.forEach(p => {
    // Brand Grouping
    const bName = p.brand || 'Misc';
    if (!brands[bName]) brands[bName] = [];
    brands[bName].push(p);

    // Category Grouping
    const cName = ((p as any).category as string | undefined) || 'Uncategorized';
    if (!categories[cName]) categories[cName] = [];
    categories[cName].push(p);
  });

  // 2. Build Brand Nodes with categories and products
  const brandNodes: FileNode[] = Object.keys(brands)
    .map((brand) => {
      // Group products within this brand by category
      const brandProducts = brands[brand];
      const brandCategories: Record<string, Prediction[]> = {};
      
      // Extract brand logo from first product's brand_identity
      const brandLogoUrl = brandProducts[0]?.brand_identity?.logo_url || '';
      const brandIdentityName = brandProducts[0]?.brand_identity?.name || brand;
      
      brandProducts.forEach(p => {
        const catName = ((p as any).category as string | undefined) || 'Products';
        if (!brandCategories[catName]) brandCategories[catName] = [];
        brandCategories[catName].push(p);
      });
      
      // Create category folders with product files
      const categoryChildren: FileNode[] = Object.keys(brandCategories).map(cat => ({
        id: `${brand}-${cat}`,
        name: cat,
        type: 'category' as const,
        icon: '📦',
        meta: getStats(brandCategories[cat]),
        children: brandCategories[cat].map(product => ({
          id: product.id,
          name: product.name,
          type: 'file' as const,
          icon: '📄',
          image: product.images?.main || (product as any).img || '',
          items: [product],
          meta: { price: (product as any).price || 0 }
        }))
      }));
      
      return {
        id: `brand-${brand}`,
        name: brandIdentityName,
        type: 'brand' as const,
        icon: BRAND_LOGOS[brandIdentityName] || '🏢', // Emoji fallback only
        image: brandLogoUrl, // Real brand logo (preferred)
        logoUrl: brandLogoUrl,
        items: brandProducts,
        meta: getStats(brandProducts),
        children: categoryChildren
      };
    })
    .sort((a, b) => (b.meta?.count as number) - (a.meta?.count as number)); // Sort by biggest brands

  // 3. Build Category Nodes
  const categoryNodes: FileNode[] = Object.keys(categories)
    .map((cat) => ({
      id: `cat-${cat}`,
      name: cat,
      type: 'category' as const,
      icon: '📦',
      items: categories[cat],
      meta: getStats(categories[cat]),
      children: []
    }))
    .sort((a, b) => (b.meta?.count as number) - (a.meta?.count as number));

  // 4. Return Root
  return {
    id: 'root',
    name: 'Halilit Master',
    type: 'root',
    icon: '🌌',
    children: [
      {
        id: 'brands-root',
        name: 'Brands',
        type: 'folder',
        icon: '📁',
        children: brandNodes,
        meta: { count: brandNodes.length }
      },
      {
        id: 'categories-root',
        name: 'Categories',
        type: 'folder',
        icon: '📁',
        children: categoryNodes,
        meta: { count: categoryNodes.length }
      }
    ]
  };
};
