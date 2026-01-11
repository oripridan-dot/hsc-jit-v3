import React, { useMemo } from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';

interface SmartMessageProps {
  content: string;
  relatedItems?: Array<{ id: string; name: string }>;
}

/**
 * SmartMessage: Renders bot responses with automatic keyword detection.
 * If the response mentions a product name (from relatedItems), it becomes clickable.
 */
export const SmartMessage: React.FC<SmartMessageProps> = ({ content, relatedItems = [] }) => {
  const { actions } = useWebSocketStore();

  // Build a regex to detect product names in the text
  const highlightedContent = useMemo(() => {
    if (!relatedItems || relatedItems.length === 0) {
      return content;
    }

    // Sort by length (longest first) to match longer names first
    const sortedItems = [...relatedItems].sort((a, b) => b.name.length - a.name.length);
    
    // Escape special regex characters and create pattern
    const patterns = sortedItems.map(item => ({
      product: item,
      // Create a case-insensitive regex that matches the product name
      // but not if it's already part of a longer word
      regex: new RegExp(`\\b(${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi')
    }));

    // Split content and insert React elements
    let elements: (string | React.ReactElement)[] = [content];

    patterns.forEach(({ product, regex }) => {
      elements = elements.flatMap((element) => {
        if (typeof element !== 'string') {
          return element;
        }

        const parts: (string | React.ReactElement)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(element)) !== null) {
          // Add text before match
          if (match.index > lastIndex) {
            parts.push(element.substring(lastIndex, match.index));
          }

          // Add clickable product name
          parts.push(
            <button
              key={`${product.id}-${match.index}`}
              onClick={() => {
                // Navigate to this product with a contextual query
                actions.navigateToProduct(
                  product.id,
                  `Tell me more about the ${product.name}`
                );
              }}
              className="text-blue-400 hover:text-blue-300 underline cursor-pointer font-medium transition-colors active:text-blue-500"
              title={`Click to learn more about ${product.name}`}
            >
              {match[1]}
            </button>
          );

          lastIndex = regex.lastIndex;
          // Reset regex for next iteration (need to reset exec pointer)
          regex.lastIndex = 0;
          while ((match = regex.exec(element)) && match.index < lastIndex) {
            // Skip matches we've already processed
          }
          if (match) {
            regex.lastIndex = lastIndex;
          }
        }

        // Add remaining text
        if (lastIndex < element.length) {
          parts.push(element.substring(lastIndex));
        }

        return parts.length > 0 ? parts : [element];
      });
    });

    return elements;
  }, [content, relatedItems, actions]);

  return (
    <div className="text-slate-200 bg-white/5 p-4 rounded-r-xl rounded-bl-xl border-l-2 border-slate-700 text-sm leading-relaxed shadow-sm animate-fade-in-up">
      {highlightedContent}
    </div>
  );
};
