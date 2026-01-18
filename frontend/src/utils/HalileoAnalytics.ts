/**
 * Halileo Analytics Viewer
 * View and analyze user interactions with Halileo components
 */

interface AnalyticsEvent {
    timestamp: string;
    event: string;
    data?: Record<string, string | number | undefined>;
    component: string;
}

export class HalileoAnalytics {
    private static readonly NAVIGATOR_KEY = 'halileo_analytics';
    private static readonly INSIGHTS_KEY = 'halileo_insights_analytics';

    /**
     * Get all analytics events
     */
    static getAll(): { navigator: AnalyticsEvent[]; insights: AnalyticsEvent[] } {
        const navigator = JSON.parse(localStorage.getItem(this.NAVIGATOR_KEY) || '[]');
        const insights = JSON.parse(localStorage.getItem(this.INSIGHTS_KEY) || '[]');
        return { navigator, insights };
    }

    /**
     * Get events by type
     */
    static getByEvent(eventName: string): AnalyticsEvent[] {
        const { navigator, insights } = this.getAll();
        const allEvents = [...navigator, ...insights];
        return allEvents.filter(e => e.event === eventName);
    }

    /**
     * Get events in date range
     */
    static getByDateRange(startDate: Date, endDate: Date): AnalyticsEvent[] {
        const { navigator, insights } = this.getAll();
        const allEvents = [...navigator, ...insights];
        return allEvents.filter(e => {
            const eventDate = new Date(e.timestamp);
            return eventDate >= startDate && eventDate <= endDate;
        });
    }

    /**
     * Get summary statistics
     */
    static getSummary() {
        const { navigator, insights } = this.getAll();
        const allEvents = [...navigator, ...insights];

        const summary = {
            total_events: allEvents.length,
            navigator_events: navigator.length,
            insights_events: insights.length,
            voice_searches: this.getByEvent('voice_search').length,
            ai_searches: this.getByEvent('ai_search').length,
            suggestion_clicks: this.getByEvent('ai_suggestion_clicked').length,
            insights_viewed: this.getByEvent('insights_viewed').length,
            insights_clicked: this.getByEvent('insight_clicked').length,
            insights_dismissed: this.getByEvent('insight_dismissed').length,
            last_event: allEvents.length > 0 ? allEvents[allEvents.length - 1].timestamp : null
        };

        return summary;
    }

    /**
     * Get most popular searches
     */
    static getPopularSearches(limit: number = 10): Array<{ query: string; count: number }> {
        const searches = this.getByEvent('ai_search');
        const queryCounts = new Map<string, number>();

        searches.forEach(search => {
            const query = search.data?.query;
            if (query && typeof query === 'string') {
                queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
            }
        });

        return Array.from(queryCounts.entries())
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Get most clicked products
     */
    static getPopularProducts(limit: number = 10): Array<{ product: string; clicks: number }> {
        const clicks = this.getByEvent('ai_suggestion_clicked');
        const productCounts = new Map<string, number>();

        clicks.forEach(click => {
            const product = click.data?.product;
            if (product && typeof product === 'string') {
                productCounts.set(product, (productCounts.get(product) || 0) + 1);
            }
        });

        return Array.from(productCounts.entries())
            .map(([product, clicks]) => ({ product, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, limit);
    }

    /**
     * Clear all analytics data
     */
    static clear() {
        localStorage.removeItem(this.NAVIGATOR_KEY);
        localStorage.removeItem(this.INSIGHTS_KEY);
        console.log('📊 Analytics data cleared');
    }

    /**
     * Export analytics as JSON
     */
    static export(): string {
        const data = {
            exported_at: new Date().toISOString(),
            summary: this.getSummary(),
            events: this.getAll()
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Print analytics report to console
     */
    static printReport() {
        const summary = this.getSummary();
        const popularSearches = this.getPopularSearches(5);
        const popularProducts = this.getPopularProducts(5);

        console.log('📊 ═══════════════════════════════════════════════');
        console.log('📊 HALILEO ANALYTICS REPORT');
        console.log('📊 ═══════════════════════════════════════════════');
        console.log('');
        console.log('📈 Summary:');
        console.table(summary);
        console.log('');
        console.log('🔍 Top Searches:');
        console.table(popularSearches);
        console.log('');
        console.log('🎯 Most Clicked Products:');
        console.table(popularProducts);
        console.log('');
        console.log('📊 ═══════════════════════════════════════════════');
        console.log('💡 Use HalileoAnalytics.export() to get full JSON');
        console.log('🗑️  Use HalileoAnalytics.clear() to reset data');
        console.log('📊 ═══════════════════════════════════════════════');
    }
}

// Make it available globally in development
if (typeof window !== 'undefined') {
    (window as unknown as { HalileoAnalytics: typeof HalileoAnalytics }).HalileoAnalytics = HalileoAnalytics;
}

export default HalileoAnalytics;
