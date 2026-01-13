import React, { useMemo } from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';

interface SmartMessageProps {
  content: string;
  relatedItems?: Array<{ id: string; name: string }>;
}

interface ContentSection {
  type: 'answer' | 'suggestion' | 'pro_tip' | 'raw';
  text: string;
  product?: string; // For suggestions
}

/**
 * Parse content into sections separated by [SUGGESTION:], [PRO TIP:], etc.
 */
function parseContentSections(content: string): ContentSection[] {
  const sections: ContentSection[] = [];
  
  // Split by markers
  const suggestionRegex = /\[SUGGESTION:\s*([^\]]+)\]/gi;
  const proTipRegex = /\[PRO TIP:\s*([^\]]+)\]/gi;
  const manualRegex = /\[MANUAL:\s*([^\]]+)\]/gi;

  let lastIndex = 0;
  let match;

  // Find all markers and their positions
  const markers: Array<{ type: string; start: number; end: number; value?: string }> = [];

  // Find suggestions
  suggestionRegex.lastIndex = 0;
  while ((match = suggestionRegex.exec(content)) !== null) {
    markers.push({
      type: 'suggestion',
      start: match.index,
      end: match.index + match[0].length,
      value: match[1].trim()
    });
  }

  // Find pro tips
  proTipRegex.lastIndex = 0;
  while ((match = proTipRegex.exec(content)) !== null) {
    markers.push({
      type: 'pro_tip',
      start: match.index,
      end: match.index + match[0].length,
      value: match[1].trim()
    });
  }

  // Find manual references
  manualRegex.lastIndex = 0;
  while ((match = manualRegex.exec(content)) !== null) {
    markers.push({
      type: 'manual',
      start: match.index,
      end: match.index + match[0].length,
      value: match[1].trim()
    });
  }

  // Sort markers by position
  markers.sort((a, b) => a.start - b.start);

  // Build sections
  lastIndex = 0;
  for (const marker of markers) {
    // Add text before marker
    if (marker.start > lastIndex) {
      const text = content.substring(lastIndex, marker.start).trim();
      if (text) {
        sections.push({ type: 'answer', text });
      }
    }

    // Add marker content
    if (marker.type === 'suggestion') {
      sections.push({ type: 'suggestion', text: marker.value || '', product: marker.value });
    } else if (marker.type === 'pro_tip') {
      sections.push({ type: 'pro_tip', text: marker.value || '' });
    } else if (marker.type === 'manual') {
      sections.push({ type: 'raw', text: marker.value || '' });
    }

    lastIndex = marker.end;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const text = content.substring(lastIndex).trim();
    if (text) {
      sections.push({ type: 'answer', text });
    }
  }

  // If no sections found, return as single answer
  if (sections.length === 0) {
    return [{ type: 'answer', text: content }];
  }

  return sections;
}
/**
 * SmartMessage: Renders bot responses with automatic keyword detection and section parsing.
 * Separates answers, suggestions, and pro tips into visually distinct sections.
 */
export const SmartMessage: React.FC<SmartMessageProps> = ({ content, relatedItems = [] }) => {
  const { actions } = useWebSocketStore();

  // Parse content into sections
  const sections = useMemo(() => parseContentSections(content), [content]);

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

  // Render sections with appropriate styling
  const renderSections = () => {
    return sections.map((section, idx) => {
      if (section.type === 'answer') {
        return (
          <div key={idx} className="space-y-2">
            {highlightedContent}
          </div>
        );
      }

      if (section.type === 'suggestion') {
        return (
          <div key={idx} className="mt-4 p-3 bg-amber-500/10 rounded-lg border-l-2 border-amber-500/50">
            <div className="flex items-start space-x-2">
              <span className="text-amber-400 text-lg flex-shrink-0">💡</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold uppercase text-amber-300/70 tracking-widest">Smart Pairing</div>
                <div className="text-sm text-amber-100 mt-1">{section.text}</div>
              </div>
            </div>
          </div>
        );
      }

      if (section.type === 'pro_tip') {
        return (
          <div key={idx} className="mt-4 p-3 bg-indigo-500/10 rounded-lg border-l-2 border-indigo-500/50">
            <div className="flex items-start space-x-2">
              <span className="text-indigo-400 text-lg flex-shrink-0">⚡</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold uppercase text-indigo-300/70 tracking-widest">Pro Tip</div>
                <div className="text-sm text-indigo-100 mt-1">{section.text}</div>
              </div>
            </div>
          </div>
        );
      }

      // Raw/manual references
      return (
        <div key={idx} className="text-xs text-slate-400 italic mt-2 pl-2 border-l border-slate-600">
          📖 {section.text}
        </div>
      );
    });
  };

  return (
    <div className="text-slate-200 bg-white/5 p-4 rounded-r-xl rounded-bl-xl border-l-2 border-slate-700 text-sm leading-relaxed shadow-sm animate-fade-in-up">
      {renderSections()}
    </div>
  );
};
