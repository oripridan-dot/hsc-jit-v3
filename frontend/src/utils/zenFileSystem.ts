import type { Prediction } from '../store/useWebSocketStore';

export interface FileNode {
  id: string;
  name: string;
  type: 'root' | 'folder' | 'brand' | 'category' | 'file';
  icon?: string; // Emoji fallback
  image?: string; // URL for brand logo or product thumbnail (preferred over icon)
  logoUrl?: string; // Explicit brand logo URL from brand_identity
  brandIdentity?: {
    id: string;
    name: string;
    slogan?: string;
    logo_url?: string;
    headquarters?: string;
    production_locations?: string[];
    founded?: number;
    website?: string;
  };
  children?: FileNode[];
  meta?: Record<string, unknown>; // Stores stats like { count: 12, totalValue: 50000 }
  items?: Prediction[]; // The actual products inside
}

// Comprehensive Brand Logo Mapping - All 90+ Brands (Exact Names from Catalogs)
const BRAND_LOGOS: Record<string, { emoji: string; image?: string }> = {
  // Keyboards & Synthesizers
  'Roland Corporation': { emoji: '🎹', image: 'https://cdnjs.cloudflare.com/ajax/libs/simple-icons/7.23.0/roland.svg' },
  'Nord Keyboards': { emoji: '🎹' },
  'Moog Music': { emoji: '🎛️' },
  'Korg': { emoji: '🎹' },
  'Akai Professional': { emoji: '🎮' },
  'Teenage Engineering': { emoji: '🎮' },
  'Studiologic': { emoji: '🎹' },
  'Oberheim': { emoji: '🎛️' },
  'M-Audio': { emoji: '🎚️' },
  'Medeli': { emoji: '🎹' },

  // Drums & Percussion
  'Pearl': { emoji: '🥁' },
  'Paiste': { emoji: '🥁' },
  'Remo': { emoji: '🥁' },
  'Dixon': { emoji: '🥁' },
  'Adams': { emoji: '🥁' },
  'Rogers': { emoji: '🥁' },
  'Gon Bops': { emoji: '🪘' },
  'Rhythm Tech': { emoji: '🪘' },
  'Regal Tip': { emoji: '🥁' },
  'Drumdots': { emoji: '🥁' },
  'Turkish Cymbals': { emoji: '🥁' },
  'Marimba One': { emoji: '🎼' },

  // Guitars & Basses
  'ESP': { emoji: '🎸' },
  'Washburn': { emoji: '🎸' },
  'Spector': { emoji: '🎸' },
  'Breedlove': { emoji: '🎸' },
  'Córdoba': { emoji: '🎸' },
  "D'Angelico": { emoji: '🎸' },
  'Maton': { emoji: '🎸' },
  'Maybach': { emoji: '🎸' },
  'Waterstone': { emoji: '🎸' },
  'Heritage Audio': { emoji: '🎸' },
  'Solar Guitars': { emoji: '🎸' },
  'LSG Guitars': { emoji: '🎸' },
  'Bohemian': { emoji: '🎸' },
  'Antigua': { emoji: '🎸' },
  'Ortega': { emoji: '🎸' },
  'Encore': { emoji: '🎸' },
  'Jasmine': { emoji: '🎸' },
  'Ocean Schmidt': { emoji: '🎸' },
  'Vintage': { emoji: '🎸' },

  // Guitar Effects & Pedals
  'BOSS': { emoji: '🎛️' },
  'Xotic': { emoji: '🎛️' },
  'Foxgear': { emoji: '🎛️' },
  'HeadRush': { emoji: '🎛️' },
  'Xvive': { emoji: '🎛️' },

  // Amplifiers
  'Ampeg': { emoji: '🔊' },
  'Ashdown': { emoji: '🔊' },
  'Eden': { emoji: '🔊' },
  'Hiwatt': { emoji: '🔊' },

  // Pro Audio & Monitors
  'RCF': { emoji: '🔊' },
  'PreSonus': { emoji: '🎚️' },
  'ADAM Audio': { emoji: '🔊' },
  'Dynaudio': { emoji: '🔊' },
  'Eve Audio': { emoji: '🔊' },
  'KRK': { emoji: '🔊' },
  'Amphion': { emoji: '🔊' },
  'EAW': { emoji: '🔊' },
  'Mackie': { emoji: '🔊', image: 'https://cdnjs.cloudflare.com/ajax/libs/simple-icons/7.23.0/mackie.svg' },
  'Montarbo': { emoji: '🔊' },
  'Soundking': { emoji: '🔊' },

  // Microphones
  'Blue Microphones': { emoji: '🎤' },
  'Austrian Audio': { emoji: '🎤' },
  'MXL': { emoji: '🎤' },

  // Mixing & Recording
  'Allen & Heath': { emoji: '🎚️' },
  'Avid': { emoji: '🎚️' },
  'Steinberg': { emoji: '🎚️' },
  'Universal Audio': { emoji: '🎚️' },
  'Warm Audio': { emoji: '🎚️' },
  'Lynx Studio Technology': { emoji: '🎚️' },

  // Accessories
  'Halilit': { emoji: '🎵' },
  'Halilit AKD-1': { emoji: '🎵' },
  "D'Addario": { emoji: '🎼' },
  "Perri's Leathers": { emoji: '🎼' },
  'On Stage Stands': { emoji: '🎼' },
  'Ultimate Support': { emoji: '🎼' },
  'Guitar Pro': { emoji: '🎼' },
  'Show': { emoji: '🎼' },
  'Bespeco': { emoji: '🎼' },
  'Magma': { emoji: '🎼' },
  'FZone': { emoji: '🎼' },
  'ASM': { emoji: '🎼' },
  'Maestro': { emoji: '🎼' },

  // DJ & Production
  'V-MODA': { emoji: '🎧' },
  'Keith McMillen Instruments': { emoji: '🎮' },
  'Fusion': { emoji: '🎚️' },
  'Fusion (Alternate)': { emoji: '🎚️' },
  'Sound Reference': { emoji: '🎚️' },
  'Sound Reference (Ultimate Ears)': { emoji: '🎚️' },
  'Tombo': { emoji: '🎵' },
  'Headliner': { emoji: '🎧' }
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

      // Populate brand categories
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

      // Extract brand logo from first product's brand_identity or BRAND_LOGOS mapping
      const brandLogoUrl = brandProducts[0]?.brand_identity?.logo_url || '';
      const brandIdentityName = brandProducts[0]?.brand_identity?.name || brand;
      const brandIdentityData = brandProducts[0]?.brand_identity;
      const logoMapping = BRAND_LOGOS[brandIdentityName];
      const finalLogoUrl = brandLogoUrl || logoMapping?.image || '';
      const emojiIcon = logoMapping?.emoji || '🏢';

      return {
        id: `brand-${brand}`,
        name: brandIdentityName,
        type: 'brand' as const,
        icon: emojiIcon, // Emoji fallback
        image: finalLogoUrl, // Real brand logo (preferred)
        logoUrl: finalLogoUrl,
        brandIdentity: brandIdentityData,
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

// Find a path from root to a node by id. Returns an array of FileNodes from root to target.
export const findPathById = (root: FileNode, targetId: string): FileNode[] => {
  const path: FileNode[] = [];

  const dfs = (node: FileNode): boolean => {
    path.push(node);
    if (node.id === targetId) return true;
    if (node.children) {
      for (const child of node.children) {
        if (dfs(child)) return true;
      }
    }
    path.pop();
    return false;
  };

  const found = dfs(root);
  return found ? path : [root];
};
