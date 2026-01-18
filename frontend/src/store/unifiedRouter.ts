/**
 * HSC JIT v3.4 - Unified Query Router
 * Seamlessly connects Explorer and PromptBar as access points to the same intelligent engine
 * 
 * Architecture Philosophy:
 * - Single source of truth for product discovery
 * - Unified state management
 * - Context-aware routing
 * - Seamless handoff between UI components
 * - Backend fallback handling
 * - Connection state monitoring
 */

import type {
  WebSocketMessage as WSMessage,
  QueryContext as QContext,
  ProductMatch as PMatch,
  ConversationState as CState,
} from './unifiedTypes';
import { useWebSocketStore } from './useWebSocketStore';


// ============================================================================
// CORE STATE MANAGER - Single source of truth
// ============================================================================

class UnifiedStateManager {
  private currentContext: QContext | null = null;
  private conversationHistory: CState[] = [];
  private activeProducts: Map<string, PMatch> = new Map();
  private wsConnection: WebSocket | null = null;

  constructor() {
    this.initializeWebSocket();
  }

  // WebSocket initialization with reconnection logic
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  private initializeWebSocket() {
    const resolveWsUrl = (): string => {
      try {
        // Check for explicit env override
        const envUrl = (import.meta as any)?.env?.VITE_WS_URL;
        if (envUrl) return envUrl;

        // Production deployment: use configured backend URL
        const apiUrl = (import.meta as any)?.env?.VITE_API_URL;
        if (apiUrl) {
          const url = new URL(apiUrl);
          const proto = url.protocol === 'https:' ? 'wss' : 'ws';
          return `${proto}://${url.host}/ws`;
        }

        // Development: Use Vite's proxy
        const isSecure = window.location.protocol === 'https:';
        const proto = isSecure ? 'wss' : 'ws';

        // Use relative path - Vite proxy will forward to backend
        return `${proto}://${window.location.host}/ws`;
      } catch (_) {
        // Fallback
        return 'ws://localhost:8000/ws';
      }
    };

    const connect = () => {
      const wsUrl = resolveWsUrl();
      console.log('[UnifiedRouter] Attempting to connect to:', wsUrl);

      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('[UnifiedRouter] ✅ WebSocket connected to:', this.wsConnection?.url);
        this.reconnectAttempts = 0; // Reset counter on successful connection
        useWebSocketStore.setState({ connectionState: 1 }); // OPEN
        this.syncState();

        // Send initial empty typing to load the catalog with all brands
        console.log('[UnifiedRouter] 🎯 Loading initial catalog...');
        this.sendTyping('');
      };

      this.wsConnection.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('[UnifiedRouter] 📥 Received:', message.type, message);
        this.handleMessage(message);
      };

      this.wsConnection.onerror = (error) => {
        console.debug('[UnifiedRouter] WebSocket error (falling back to static mode):', error);
        useWebSocketStore.setState({ connectionState: 3 }); // CLOSED
      };

      this.wsConnection.onclose = () => {
        useWebSocketStore.setState({ connectionState: 3 }); // CLOSED
        this.reconnectAttempts++;

        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
          console.debug(`[UnifiedRouter] WebSocket disconnected, retrying... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          useWebSocketStore.setState({ connectionState: 0 }); // CONNECTING
          setTimeout(connect, 3000);
        } else {
          console.log('[UnifiedRouter] ℹ️ Operating in Static Mode (backend optional for now)');
          console.debug('ℹ️ To enable backend features: Start backend with `uvicorn` on port 8000');
        }
      };
    };

    connect();
  }

  // Unified message handler - processes all backend responses
  private handleMessage(message: WSMessage) {
    switch (message.type) {
      case 'prediction':
        // Handle typing predictions (array of enriched products)
        console.log('[UnifiedRouter] Processing prediction event with', message.data?.length, 'items');
        if (Array.isArray(message.data)) {
          const products = message.data.map((item: any) => ({
            ...(item.product || item),
            confidence: item.confidence,
            match_text: item.match_text,
            brand: item.brand?.name || item.brand,
            brand_identity: item.brand
          }));
          console.log('[UnifiedRouter] Mapped products:', products.length);
          this.updatePredictions(products);
        }
        break;
      case 'predictions':
        this.updatePredictions(message.data.products || []);
        break;
      case 'product_selected':
        if (message.data.product) {
          this.activeProducts.set(message.data.product.id, message.data.product);
          if (this.currentContext) {
            this.currentContext.selectedProduct = message.data.product;
          }
        }
        break;
      case 'progress':
        this.notifySubscribers('progress', message.data);
        break;
      case 'llm_stream':
        this.streamResponse(message.data.chunk || '');
        break;
      case 'complete':
        this.finalizeResponse(message.data);
        break;
      case 'error':
        this.notifySubscribers('error', message.data);
        break;
    }
  }

  // Sync current state to backend
  private syncState() {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) return;

    this.wsConnection.send(JSON.stringify({
      type: 'sync_state',
      context: this.currentContext,
      history: this.conversationHistory.slice(-5) // Last 5 exchanges
    }));
  }

  // Update prediction results
  private updatePredictions(products: PMatch[]) {
    products.forEach(product => {
      this.activeProducts.set(product.id, product);
    });
    this.notifySubscribers('predictions', products);
  }

  // Update context when product is selected

  // Stream LLM response chunks
  private streamResponse(chunk: string) {
    this.notifySubscribers('stream', chunk);
  }

  // Finalize complete response
  private finalizeResponse(data: any) {
    this.conversationHistory.push({
      timestamp: Date.now(),
      query: this.currentContext?.query || '',
      response: data.response,
      products: Array.from(this.activeProducts.values())
    });
    this.notifySubscribers('complete', data);
  }

  // Subscriber pattern for UI components
  private subscribers: Map<string, Set<Function>> = new Map();

  subscribe(event: string, callback: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);
  }

  unsubscribe(event: string, callback: Function) {
    this.subscribers.get(event)?.delete(callback);
  }

  private notifySubscribers(event: string, data: any) {
    this.subscribers.get(event)?.forEach(callback => callback(data));
  }

  // Public API
  sendQuery(query: string, source: string, filters?: any) {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      console.error('[UnifiedRouter] WebSocket not connected');
      return;
    }

    this.wsConnection.send(JSON.stringify({
      type: 'unified_query',
      query,
      source,
      filters,
      timestamp: Date.now()
    }));
  }

  // Real-time typing predictions (for Explorer search as you type)
  sendTyping(text: string) {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      console.error('[UnifiedRouter] WebSocket not connected, state:', this.wsConnection?.readyState);
      return;
    }

    console.log('[UnifiedRouter] 📤 Sending typing:', text);
    this.wsConnection.send(JSON.stringify({
      type: 'typing',
      content: text,
      timestamp: Date.now()
    }));
  }

  selectProduct(productId: string) {
    const product = this.activeProducts.get(productId);
    if (!product) return;

    this.currentContext = {
      query: this.currentContext?.query || '',
      intent: this.currentContext?.intent || '',
      keywords: this.currentContext?.keywords || [],
      selectedProduct: product,
      conversationHistory: this.currentContext?.conversationHistory || [],
      timestamp: Date.now()
    };

    this.syncState();
  }

  getState() {
    return {
      context: this.currentContext,
      history: this.conversationHistory,
      products: Array.from(this.activeProducts.values())
    };
  }
}

// ============================================================================
// QUERY ANALYZER - Intelligent routing and context building
// ============================================================================

class QueryAnalyzer {
  // Determine query intent
  analyzeIntent(query: string): {
    type: 'product_search' | 'technical_question' | 'comparison' | 'troubleshooting';
    confidence: number;
    keywords: string[];
  } {
    const lower = query.toLowerCase();

    // Product search patterns
    if (/\b(show|find|search|list|get)\b/.test(lower)) {
      return {
        type: 'product_search',
        confidence: 0.9,
        keywords: this.extractKeywords(query)
      };
    }

    // Technical question patterns
    if (/\b(how|why|what|when|explain)\b/.test(lower)) {
      return {
        type: 'technical_question',
        confidence: 0.85,
        keywords: this.extractKeywords(query)
      };
    }

    // Comparison patterns
    if (/\b(vs|versus|compare|difference|better)\b/.test(lower)) {
      return {
        type: 'comparison',
        confidence: 0.88,
        keywords: this.extractKeywords(query)
      };
    }

    // Troubleshooting patterns
    if (/\b(fix|broken|error|issue|problem|not working)\b/.test(lower)) {
      return {
        type: 'troubleshooting',
        confidence: 0.92,
        keywords: this.extractKeywords(query)
      };
    }

    return {
      type: 'technical_question',
      confidence: 0.5,
      keywords: this.extractKeywords(query)
    };
  }

  // Extract meaningful keywords
  private extractKeywords(query: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  // Build context from conversation history
  buildContext(
    currentQuery: string,
    history: CState[],
    selectedProduct?: PMatch
  ): QContext {
    const intent = this.analyzeIntent(currentQuery);

    return {
      query: currentQuery,
      intent: intent.type,
      keywords: intent.keywords,
      selectedProduct,
      conversationHistory: history.slice(-3), // Last 3 exchanges
      timestamp: Date.now()
    };
  }
}

// ============================================================================
// EXPLORER-PROMPTBAR BRIDGE - Seamless component integration
// ============================================================================

class ComponentBridge {
  private stateManager: UnifiedStateManager;
  private queryAnalyzer: QueryAnalyzer;

  constructor(stateManager: UnifiedStateManager) {
    this.stateManager = stateManager;
    this.queryAnalyzer = new QueryAnalyzer();
  }

  // Handle Explorer interactions
  handleExplorerQuery(
    query: string,
    filters?: { brand?: string; category?: string }
  ) {
    const state = this.stateManager.getState();
    const context = this.queryAnalyzer.buildContext(
      query,
      state.history,
      state.context?.selectedProduct
    );

    // Send enriched query to backend
    this.stateManager.sendQuery(
      JSON.stringify({ query, filters, context }),
      'explorer'
    );
  }

  // Handle PromptBar interactions
  handlePromptBarQuery(query: string) {
    const state = this.stateManager.getState();
    const context = this.queryAnalyzer.buildContext(
      query,
      state.history,
      state.context?.selectedProduct
    );

    // Send enriched query to backend
    this.stateManager.sendQuery(
      JSON.stringify({ query, context }),
      'promptbar'
    );
  }

  // Handle product selection from either component
  handleProductSelection(productId: string, source: 'explorer' | 'promptbar') {
    this.stateManager.selectProduct(productId);

    // Trigger context update in both components
    const state = this.stateManager.getState();
    this.notifyComponents('product_selected', {
      product: state.context?.selectedProduct,
      source
    });
  }

  // Cross-component navigation
  navigateToProduct(productId: string, targetComponent: 'explorer' | 'promptbar') {
    this.stateManager.selectProduct(productId);
    this.notifyComponents('navigate', { productId, target: targetComponent });
  }

  // Component notification system
  private componentSubscribers: Map<string, Set<Function>> = new Map();

  subscribeComponent(event: string, callback: Function) {
    if (!this.componentSubscribers.has(event)) {
      this.componentSubscribers.set(event, new Set());
    }
    this.componentSubscribers.get(event)!.add(callback);
  }

  private notifyComponents(event: string, data: any) {
    this.componentSubscribers.get(event)?.forEach(callback => callback(data));
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const unifiedStateManager = new UnifiedStateManager();
export const componentBridge = new ComponentBridge(unifiedStateManager);
export { QueryAnalyzer };
