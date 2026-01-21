import { useCallback } from 'react';
import { instantSearch } from '../lib/instantSearch';
import { useNavigationStore } from '../store/navigationStore';

export const useRealtimeSearch = () => {
    // Read from global store
    const {
        searchResults,
        setSearchResults,
        isSearching,
        setIsSearching,
        searchInsight,
        setSearchInsight,
        searchQuery,
        setSearch: setStoreSearchQuery
    } = useNavigationStore();

    const search = useCallback(async (query: string) => {
        setStoreSearchQuery(query);

        if (!query.trim()) {
            setSearchResults([]);
            setSearchInsight(null);
            return;
        }

        setIsSearching(true);

        try {
            // Emulate network latency for "thinking" feel (optional, but nice)
            await new Promise(resolve => setTimeout(resolve, 300));

            // 1. Perform Client-Side Search
            // We search against "connectivity", "tier", "brand" etc.
            const results = instantSearch.search(query, {
                limit: 20,
                // We can expand this to include filters if needed
            });

            setSearchResults(results);

            // 2. Generate "Static First" Insight
            // Instead of hallucinating, we summarize the actual results
            if (results.length > 0) {
                const brands = Array.from(new Set(results.map(p => p.brand))).join(', ');
                const topTier = results.find(p => p.tier)?.tier?.level; // Assuming Product structure

                let insightText = `Found ${results.length} matches in ${brands}.`;
                if (topTier) insightText += ` Featuring ${topTier}-tier options.`;
                setSearchInsight(insightText);
            } else {
                setSearchInsight(`No exact matches for "${query}". Try standard terms like "XLR" or "Piano".`);
            }

        } catch (err) {
            console.error("Search Logic Error:", err);
            setSearchResults([]);
            // Since we don't have error in store, we just clear results
        } finally {
            setIsSearching(false);
        }
    }, [setSearchResults, setIsSearching, setSearchInsight, setStoreSearchQuery]);

    const clearResults = useCallback(() => {
        setSearchResults([]);
        setSearchInsight(null);
        setStoreSearchQuery('');
    }, [setSearchResults, setSearchInsight, setStoreSearchQuery]);

    return {
        search,
        results: searchResults,
        insight: searchInsight,
        isSearching,
        query: searchQuery,
        error: null,
        clearResults
    };
};
