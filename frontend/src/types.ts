/**
 * Core type definitions for HSC JIT v3
 */

export interface BrandIdentity {
  name: string;
  logo_url?: string;
  hq?: string;
  website?: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  brand_identity?: BrandIdentity;
  description: string;
  category?: string;
  price?: number;
  production_country?: string;
  image: string;
  images?: string[];
  manual_url?: string;
  manual_urls?: string[];
  specs: Record<string, string | number>;
  score?: number;
  availability?: 'in-stock' | 'pre-order' | 'discontinued';
  tags?: string[];
  warranty?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
  };
}

export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  hq?: string;
  website?: string;
  description?: string;
  products?: Product[];
  productCount?: number;
}

export interface SearchResult {
  products: Product[];
  brands: Brand[];
  query: string;
  timestamp: number;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  markers?: {
    suggestions?: string[];
    relatedProducts?: string[];
    manualRefs?: string[];
  };
  timestamp?: number;
}

export interface WebSocketMessage {
  type: 'prediction' | 'query' | 'status' | 'answer_chunk' | 'error';
  data: Record<string, any>;
  timestamp: string;
  session_id: string;
}

export interface PredictionEvent extends WebSocketMessage {
  type: 'prediction';
  data: {
    products: Product[];
    confidence: number;
  };
}

export interface StatusEvent extends WebSocketMessage {
  type: 'status';
  data: {
    message: string;
    progress?: number;
  };
}

export interface AnswerChunkEvent extends WebSocketMessage {
  type: 'answer_chunk';
  data: {
    chunk: string;
    isComplete: boolean;
  };
}

export interface ErrorEvent extends WebSocketMessage {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}
