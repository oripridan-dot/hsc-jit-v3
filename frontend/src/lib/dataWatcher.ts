/**
 * Real-Time Data Watcher
 * Auto-updates frontend when catalog files change
 * Enables HMR-like experience for static JSON data
 */

type DataChangeCallback = (type: 'index' | 'brand', id?: string) => void;

class DataWatcher {
    private callbacks: Set<DataChangeCallback> = new Set();
    private lastIndex: string = '';
    private lastBrands: Map<string, string> = new Map();
    private polling: boolean = false;
    private pollInterval: number = 1000; // Check every 1 second in dev

    constructor() {
        // DISABLED: Auto-polling causes deadlock with Vite dev server
        // Auto-start watching in development
        // if (import.meta.env.DEV) {
        //     this.startWatching();
        // }
    }

    /**
     * Subscribe to data changes
     */
    onChange(callback: DataChangeCallback): () => void {
        this.callbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
        };
    }

    /**
     * Start polling for data changes
     */
    private startWatching() {
        if (this.polling) return;

        this.polling = true;
        console.log('🔄 Data Watcher: Real-time updates enabled');

        // Initial load
        this.checkForUpdates();

        // Poll for changes
        setInterval(() => this.checkForUpdates(), this.pollInterval);
    }

    /**
     * Check if index.json has changed
     */
    private async checkForUpdates() {
        try {
            // Check index.json
            let indexText = '';
            try {
                const indexRes = await fetch(`/data/index.json?t=${Date.now()}`, {
                    method: 'GET',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (!indexRes.ok) return;
                indexText = await indexRes.text();
            } catch {
                return; // Silently fail on fetch errors
            }

            const indexHash = this.hashString(indexText);

            if (indexHash !== this.lastIndex) {
                this.lastIndex = indexHash;
                console.log('🔄 Data changed: index.json');
                this.notifyListeners('index');
            }

            // Check each brand catalog
            const brands = ['boss', 'roland'];
            for (const brand of brands) {
                let brandText = '';
                try {
                    const brandRes = await fetch(`/data/${brand}.json?t=${Date.now()}`, {
                        method: 'GET',
                        headers: { 'Cache-Control': 'no-cache' }
                    });
                    if (!brandRes.ok) continue;
                    brandText = await brandRes.text();
                } catch {
                    continue;
                }

                const brandHash = this.hashString(brandText);
                const lastHash = this.lastBrands.get(brand);

                if (brandHash !== lastHash) {
                    this.lastBrands.set(brand, brandHash);
                    console.log(`🔄 Data changed: ${brand}.json`);
                    this.notifyListeners('brand', brand);
                }
            }
        } catch (error) {
            // Silently fail - network errors are expected
        }
    }

    /**
     * Simple string hash for change detection
     */
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    /**
     * Notify all listeners of data changes
     */
    private notifyListeners(type: 'index' | 'brand', id?: string) {
        this.callbacks.forEach(callback => {
            try {
                callback(type, id);
            } catch (error) {
                console.error('Error in data watcher callback:', error);
            }
        });
    }

    /**
     * Manually trigger refresh (for debugging)
     */
    forceRefresh(type: 'index' | 'brand' = 'index', id?: string) {
        console.log('🔄 Force refresh triggered');
        this.notifyListeners(type, id);
    }
}

export const dataWatcher = new DataWatcher();
