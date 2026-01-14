/**
 * HSC JIT v3.3 - React Component Integration
 * Unified Explorer and PromptBar using shared state and logic
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { unifiedStateManager } from '../store/unifiedRouter';
import type { ProductMatch, ProgressUpdate } from '../store/unifiedTypes';

// ============================================================================
// SHARED HOOKS
// ============================================================================

/**
 * Unified query hook - works for both Explorer and PromptBar
 */
function useUnifiedQuery(source: 'explorer' | 'promptbar') {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<ProductMatch[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [progress, setProgress] = useState<ProgressUpdate>({ stage: 'analyze', progress: 0 });

  useEffect(() => {
    // Subscribe to unified state updates
    const handlePredictions = (products: ProductMatch[]) => {
      setPredictions(products);
      setIsLoading(true);
    };

    const handleProgress = (update: ProgressUpdate) => {
      setProgress(update);
    };

    const handleStream = (chunk: string) => {
      setStreamedResponse(prev => prev + chunk);
    };

    const handleComplete = (data: any) => {
      setIsLoading(false);
      if (data.product) {
        setSelectedProduct(data.product);
      }
    };

    const handleError = (error: any) => {
      setIsLoading(false);
      console.error('[useUnifiedQuery] Error:', error);
    };

    unifiedStateManager.subscribe('predictions', handlePredictions);
    unifiedStateManager.subscribe('progress', handleProgress);
    unifiedStateManager.subscribe('stream', handleStream);
    unifiedStateManager.subscribe('complete', handleComplete);
    unifiedStateManager.subscribe('error', handleError);

    return () => {
      unifiedStateManager.unsubscribe('predictions', handlePredictions);
      unifiedStateManager.unsubscribe('progress', handleProgress);
      unifiedStateManager.unsubscribe('stream', handleStream);
      unifiedStateManager.unsubscribe('complete', handleComplete);
      unifiedStateManager.unsubscribe('error', handleError);
    };
  }, []);

  const submitQuery = useCallback((queryText: string, filters?: any) => {
    setQuery(queryText);
    setStreamedResponse(''); // Clear previous response
    if (queryText.trim()) {
      setIsLoading(true);
      unifiedStateManager.sendQuery(queryText, source, filters);
    }
  }, [source]);

  const selectProduct = useCallback((productId: string) => {
    unifiedStateManager.selectProduct(productId);
    const product = predictions.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
    }
  }, [predictions]);

  return {
    query,
    predictions,
    selectedProduct,
    isLoading,
    streamedResponse,
    progress,
    submitQuery,
    selectProduct,
  };
}

// ============================================================================
// EXPLORER COMPONENT
// ============================================================================

export const Explorer: React.FC = () => {
  const {
    query,
    predictions,
    selectedProduct,
    isLoading,
    streamedResponse,
    progress,
    submitQuery,
    selectProduct,
  } = useUnifiedQuery('explorer');

  const [filters, setFilters] = useState({
    brand: '',
    category: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(query, filters);
  };

  return (
    <div className="explorer-container">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => submitQuery(e.target.value)}
          placeholder="Search products..."
          className="search-input"
        />
        
        {/* Filters */}
        <div className="filters">
          <select
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          >
            <option value="">All Brands</option>
            {/* Brand options */}
          </select>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            {/* Category options */}
          </select>
        </div>
      </form>

      {/* Progress Indicator */}
      {isLoading && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress.progress * 100}%` }}
          />
          <span className="progress-stage">{progress.stage}</span>
        </div>
      )}

      {/* Product Grid */}
      <div className="product-grid">
        {predictions.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectedProduct?.id === product.id}
            onSelect={() => selectProduct(product.id)}
          />
        ))}
      </div>

      {/* Response Panel */}
      {selectedProduct && (
        <div className="response-panel">
          <div className="product-header">
            <img src={selectedProduct.image_url} alt={selectedProduct.name} />
            <div>
              <h3>{selectedProduct.name}</h3>
              <p>{selectedProduct.brand}</p>
            </div>
          </div>
          
          <div className="response-content">
            <ReactMarkdown>{streamedResponse}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PROMPTBAR COMPONENT
// ============================================================================

export const PromptBar: React.FC = () => {
  const {
    predictions,
    selectedProduct,
    isLoading,
    streamedResponse,
    progress,
    submitQuery,
    selectProduct,
  } = useUnifiedQuery('promptbar');

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      submitQuery(inputValue);
      setInputValue('');
    }
  };

  // Auto-submit on typing (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length > 2) {
        submitQuery(inputValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, submitQuery]);

  return (
    <div className="promptbar-container">
      {/* Chat Interface */}
      <div className="chat-messages">
        {/* Previous messages */}
        
        {/* Current Response */}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">
              {streamedResponse || (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Suggestions (appears as query is typed) */}
      {predictions.length > 0 && (
        <div className="product-suggestions">
          <div className="suggestions-header">
            <span>Detected Products:</span>
          </div>
          <div className="suggestions-list">
            {predictions.slice(0, 5).map((product) => (
              <button
                key={product.id}
                className={`suggestion-chip ${
                  selectedProduct?.id === product.id ? 'selected' : ''
                }`}
                onClick={() => selectProduct(product.id)}
              >
                <img src={product.image_url} alt="" />
                <span>{product.name}</span>
                <span className="score">{(product.score * 100).toFixed(0)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="input-form">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about any product..."
          className="prompt-input"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          Send
        </button>
      </form>

      {/* Progress indicator */}
      {isLoading && (
        <div className="progress-indicator">
          <span>{progress.stage}</span>
          <div className="progress-dots">
            <span className={progress.progress > 0.2 ? 'active' : ''}></span>
            <span className={progress.progress > 0.5 ? 'active' : ''}></span>
            <span className={progress.progress > 0.8 ? 'active' : ''}></span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

const ProductCard: React.FC<{
  product: any;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ product, isSelected, onSelect }) => {
  return (
    <div 
      className={`product-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="product-image">
        <img src={product.image_url} alt={product.name} />
      </div>
      <div className="product-info">
        <h4>{product.name}</h4>
        <p className="brand">{product.brand}</p>
        <p className="category">{product.category}</p>
        <div className="score-badge">
          {(product.score * 100).toFixed(0)}% match
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// APP LAYOUT - Shows both components working together
// ============================================================================

export const UnifiedApp: React.FC = () => {
  const [activeView, setActiveView] = useState<'explorer' | 'promptbar'>('promptbar');

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="app-nav">
        <button
          className={activeView === 'explorer' ? 'active' : ''}
          onClick={() => setActiveView('explorer')}
        >
          <span>🔍</span> Explorer
        </button>
        <button
          className={activeView === 'promptbar' ? 'active' : ''}
          onClick={() => setActiveView('promptbar')}
        >
          <span>💬</span> Chat
        </button>
      </nav>

      {/* Content */}
      <main className="app-content">
        {activeView === 'explorer' ? <Explorer /> : <PromptBar />}
      </main>
    </div>
  );
};

// Import required for markdown rendering
