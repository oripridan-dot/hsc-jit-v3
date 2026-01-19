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

import { catalogLoader } from './lib/catalogLoader';
import { dataWatcher } from './lib/dataWatcher';

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
    console.log('🔄 Forcing data refresh...');
    catalogLoader.clearCache();
    dataWatcher.forceRefresh('index');
    console.log('✅ Data refresh triggered');
  },

  async refreshBrand(brandId: string) {
    console.log(`🔄 Forcing refresh for brand: ${brandId}`);
    catalogLoader.clearCache();
    dataWatcher.forceRefresh('brand', brandId);
    console.log(`✅ Brand refresh triggered: ${brandId}`);
  },

  status() {
    console.log('📊 HSC Development Status:');
    console.log('  Real-time updates: ✅ Enabled');
    console.log('  Data watcher: ✅ Active');
    console.log('  Polling interval: 1000ms');
    console.log('');
    console.log('Available commands:');
    console.log('  window.__hscdev.refreshData()');
    console.log('  window.__hscdev.refreshBrand("roland")');
    console.log('  window.__hscdev.status()');
    console.log('  window.__hscdev.clearCache()');
    console.log('  window.__hscdev.checkUpdates()');
  },

  clearCache() {
    console.log('🗑️ Clearing all caches...');
    catalogLoader.clearCache();
    console.log('✅ Caches cleared');
  },

  async checkUpdates() {
    console.log('🔍 Checking for data updates...');
    dataWatcher.forceRefresh('index');
    console.log('✅ Update check completed');
  }
};

// Export for use in App
export function initializeDevTools() {
  if (import.meta.env.DEV) {
    // @ts-ignore - Intentionally adding to window for dev access
    window.__hscdev = devTools;
    
    console.log('%c🔧 HSC Development Tools Initialized', 'color: cyan; font-weight: bold');
    console.log('%cUse: window.__hscdev.status() for available commands', 'color: gray');
  }
}

export { devTools };
