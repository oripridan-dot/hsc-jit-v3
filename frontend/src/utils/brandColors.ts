/**
 * Brand Color Palette
 * Each brand gets a primary and secondary color for visual identity
 */

export const BRAND_COLORS: Record<string, { primary: string; secondary: string }> = {
  roland: { primary: '#1f2937', secondary: '#3b82f6' }, // Dark slate + blue
  moog: { primary: '#7c2d12', secondary: '#dc2626' }, // Deep orange + red
  nord: { primary: '#9A0000', secondary: '#E31B2D' }, // Classic Red
  mackie: { primary: '#1e293b', secondary: '#f97316' }, // Slate + orange
  xotic: { primary: '#292524', secondary: '#ec4899' }, // Stone + pink
  bohemian: { primary: '#4c0519', secondary: '#f43f5e' }, // Maroon + rose
  oberheim: { primary: '#1e1b4b', secondary: '#8b5cf6' }, // Indigo + purple
  presonus: { primary: '#0c4a6e', secondary: '#0ea5e9' }, // Sky blue
  ashdown: { primary: '#7f1d1d', secondary: '#ef4444' }, // Dark red
  headliner: { primary: '#292524', secondary: '#a16207' }, // Stone + amber
  hiwatt: { primary: '#0f766e', secondary: '#20c997' }, // Teal + mint
  cordoba: { primary: '#78350f', secondary: '#f59e0b' }, // Amber brown
  maybach: { primary: '#3f3f46', secondary: '#d97706' }, // Zinc + orange
  asm: { primary: '#1c1917', secondary: '#f97316' }, // Stone + orange
  breedlove: { primary: '#b45309', secondary: '#d97706' }, // Golden brown
  xvive: { primary: '#1e293b', secondary: '#06b6d4' }, // Slate + cyan
  'drumdots': { primary: '#1f2937', secondary: '#6366f1' }, // Gray + indigo
  'teenage-engineering': { primary: '#000000', secondary: '#fbbf24' }, // Black + gold
  'ultimate-support': { primary: '#3730a3', secondary: '#4f46e5' }, // Indigo
  'universal-audio': { primary: '#2c2c2c', secondary: '#a855f7' }, // Dark gray + purple
  'warm-audio': { primary: '#92400e', secondary: '#fbbf24' }, // Warm brown + gold
  'blue-microphones': { primary: '#1e3a8a', secondary: '#3b82f6' }, // Dark blue
  krk: { primary: '#15803d', secondary: '#22c55e' }, // Green
  'sound-reference': { primary: '#374151', secondary: '#6366f1' }, // Gray + indigo
  'steinberg': { primary: '#1f2937', secondary: '#f59e0b' }, // Gray + amber
  'studio-logic': { primary: '#3730a3', secondary: '#8b5cf6' }, // Purple
};

/**
 * Get brand colors with fallback to default neutral
 */
export function getBrandColors(brandId: string) {
  const colors = BRAND_COLORS[brandId.toLowerCase().replace(/[^a-z0-9-]/g, '')];
  return colors || { primary: '#475569', secondary: '#64748b' }; // Default slate
}

/**
 * Get brand color classes for Tailwind (if using dynamic colors)
 * Fallback: use inline style for hex colors
 */
export function getBrandColorStyle(brandId: string) {
  const { primary, secondary } = getBrandColors(brandId);
  return {
    '--brand-primary': primary,
    '--brand-secondary': secondary,
  } as React.CSSProperties;
}
