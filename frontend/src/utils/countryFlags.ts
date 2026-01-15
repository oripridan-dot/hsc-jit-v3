/**
 * Country to flag emoji mapping
 */
export const COUNTRY_FLAGS: Record<string, string> = {
  // Europe
  'Sweden': '🇸🇪',
  'Stockholm, Sweden': '🇸🇪',
  'Germany': '🇩🇪',
  'UK': '🇬🇧',
  'United Kingdom': '🇬🇧',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Netherlands': '🇳🇱',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Spain': '🇪🇸',
  'Portugal': '🇵🇹',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',

  // Asia
  'Japan': '🇯🇵',
  'Osaka, Japan': '🇯🇵',
  'Tokyo, Japan': '🇯🇵',
  'China': '🇨🇳',
  'South Korea': '🇰🇷',
  'Taiwan': '🇹🇼',
  'Singapore': '🇸🇬',
  'India': '🇮🇳',
  'Thailand': '🇹🇭',
  'Malaysia': '🇲🇾',
  'Indonesia': '🇮🇩',

  // Americas
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Los Angeles, USA': '🇺🇸',
  'New York, USA': '🇺🇸',
  'California, USA': '🇺🇸',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',

  // Oceania
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
};

export function getCountryFlag(location: string): string {
  // Try exact match first
  if (COUNTRY_FLAGS[location]) {
    return COUNTRY_FLAGS[location];
  }

  // Try partial match (e.g., "Stockholm, Sweden" -> "Sweden")
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (location.includes(key) || key.includes(location)) {
      return flag;
    }
  }

  // Default to globe
  return '🌍';
}
