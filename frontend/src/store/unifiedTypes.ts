/**
 * HSC JIT v3.3 - Unified Router Type Definitions
 */

export interface WebSocketMessage {
  type: 'prediction' | 'predictions' | 'product_selected' | 'progress' | 'llm_stream' | 'complete' | 'error' | 'context_ready';
  data: any;
}

export interface QueryContext {
  query: string;
  intent: string;
  keywords: string[];
  selectedProduct?: ProductMatch;
  conversationHistory?: ConversationState[];
  timestamp: number;
}

export interface ProductMatch {
  id: string;
  name: string;
  brand: string;
  score: number;
  category: string;
  imageUrl?: string;
  image_url?: string;
  manual_url?: string;
}

export interface ConversationState {
  timestamp: number;
  query: string;
  response: string;
  products: ProductMatch[];
}

export interface ProgressUpdate {
  stage: 'analyze' | 'predict' | 'fetch' | 'contextualize' | 'generate' | 'complete';
  progress: number;
}

export type QuerySource = 'explorer' | 'promptbar';
