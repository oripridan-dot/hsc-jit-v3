import { z } from 'zod';

/**
 * Safe Fetcher - v3.7
 * Wraps fetch with Zod schema validation to ensure data integrity.
 */
export async function safeFetch<T>(
  url: string, 
  schema: z.ZodType<T>, 
  fallback?: T
): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const rawData = await response.json();
    
    // 🛡️ The Guard: Validate data before it touches UI components
    const result = schema.safeParse(rawData);
    
    if (!result.success) {
      console.error(`🚨 Data Corruption at ${url}:`, result.error.flatten());
      // Here we could report to a backend logging endpoint
      if (fallback) return fallback;
      throw new Error(`Data contract violation at ${url}`);
    }
    
    return result.data;
  } catch (err) {
    console.warn(`⚠️ Fetch failed for ${url}, using fallback strategies.`);
    if (fallback) return fallback;
    throw err;
  }
}
