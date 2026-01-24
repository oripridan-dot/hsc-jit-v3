export const BRAND_COLORS: Record<string, string> = {
  // Major Brands
  roland: "#ff6600", // Roland Orange
  boss: "#0655aa", // Boss Blue
  nord: "#d0021b", // Nord Red
  moog: "#a88e2d", // Moog Gold/Wood
  "akai-professional": "#e60012", // Akai Red
  "universal-audio": "#00a2e8", // UAD Blue link
  yamaha: "#4b0082", // Yamaha Violet
  korg: "#006cb5", // Korg Blue
  arturia: "#00b2a9", // Arturia Teal
  focusrite: "#ca1313", // Focusrite Red
  "adam-audio": "#000000", // Adam is Black/Yellow ribbon? lets go Yellow/Gold "#ffd700" to stand out against black bg
  neumann: "#2f3137", // Neumann Geometric Gray/Badge
  shure: "#22c55e", // Shure Green (often associated with their logo/branding online) or just generic Pro Audio green
  "allen-heath": "#cc0000", // A&H Red
  mackie: "#86bc25", // Mackie Green (Running Man)
  behringer: "#ffcc00", // Behringer Yellow
  esp: "#000000", // ESP Metal Black... maybe deep silvery grey? "#4b5563"
  ibanez: "#c41230", // Ibanez Red
  fender: "#e21c27", // Fender Red
  gibson: "#000000", // Gibson Black/Gold
  epiphone: "#880000", // Epiphone dark red
  marshall: "#000000", // Gold on Black?
  orange: "#ff7f00", // Orange Amps Orange
  vox: "#3a1d21", // Vox Diamond pattern color? Or Gold.

  // Default fallback
  default: "#ffffff",
};

/**
 * Gets a representative color for a list of brands.
 * Returns the color of the first brand found, or the default.
 */
export const getBrandColor = (brands?: string[]): string => {
  if (!brands || brands.length === 0) return BRAND_COLORS.default;

  for (const brand of brands) {
    const key = brand.toLowerCase();
    if (BRAND_COLORS[key]) return BRAND_COLORS[key];
  }

  return BRAND_COLORS.default;
};
