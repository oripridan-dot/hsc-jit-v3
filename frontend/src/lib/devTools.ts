/**
 * Development Helpers
 * Tools for real-time development with auto-updating catalogs
 *
 * Usage in browser console:
 * ```
 * window.__hscdev.refreshData()
 * window.__hscdev.refreshBrand('roland')
 * window.__hscdev.status()
 * ```
 */

import { catalogLoader } from "./catalogLoader";

interface HSCDevTools {
  /**
   * Force refresh all data
   */
  refreshData: () => Promise<void>;

  /**
   * Force refresh specific brand
   */
  refreshBrand: (brandId: string) => Promise<void>;

  /**
   * Show current status
   */
  status: () => void;

  /**
   * Clear all caches
   */
  clearCache: () => void;

  /**
   * Check data files for changes (manually trigger watcher)
   */
  checkUpdates: () => Promise<void>;
}

const devTools: HSCDevTools = {
  async refreshData() {
    catalogLoader.clearCache();
  },

  async refreshBrand(brandId: string) {
    catalogLoader.clearCache();
  },

  status() {
  },

  clearCache() {
    catalogLoader.clearCache();
  },

  async checkUpdates() {
  },
};

// Export for use in App
export function initializeDevTools() {
  if (import.meta.env.DEV) {
    try {
      // @ts-expect-error - Intentionally adding to window for dev access
      window.__hscdev = devTools;

      console.log(
        "%c🔧 HSC Development Tools Initialized",
        "color: cyan; font-weight: bold",
      );
      console.log(
        "%cUse: window.__hscdev.status() for available commands",
        "color: gray",
      );
    } catch (error) {
    }
  }
}

export { devTools };
