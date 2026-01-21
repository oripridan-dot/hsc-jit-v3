import { useState, useCallback } from 'react';
import type { Product } from '../types';
import { instantSearch } from '../lib/instantSearch';

interface SearchResult {
    products: Product[];
    insight: string | null;
}

export const useRealtimeSearch = () => {
    const [results, setResults] = useState<Product[]>([]);
    const [insight, setInsight] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            // Emulate network latency for "thinking" feel (optional, but nice)
            await new Promise(resolve => setTimeout(resolve, 300));

            // 1. Perform Client-Side Search
            // We search against "connectivity", "tier", "brand" etc.
            const searchResults = instantSearch.search(query, {
                limit: 20,
                // We can expand this to include filters if needed
            });

            setResults(searchResults);

            // 2. Generate "Static First" Insight
            // Instead of hallucinating, we summarize the actual results
            if (searchResults.length > 0) {
                const brands = Array.from(new Set(searchResults.map(p => p.brand))).join(', ');
                const topCategory = searchResults[0].category;
                const topTier = searchResults.find(p => p.tier)?.tier?.level;

                let insightText = `Found ${searchResults.length} matches in ${brands}.`;
                if (topTier) insightText += ` Featuring ${topTier}-tier options.`;
                setInsight(insightText);
            } else {
                setInsight(`No exact matches for "${query}". Try standard terms like "XLR" or "Piano".`);
            }

        } catch (err) {
            console.error("Search Logic Error:", err);
            setResults([]);
            setError("Could not perform search.");
        } finally {
            setIsSearching(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
        setInsight(null);
        setError(null);
    }, []);

    return {
        search,
        results,
        insight,
        isSearching,
        error,
        clearResults
    };
};
