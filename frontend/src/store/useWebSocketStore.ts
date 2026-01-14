import { create } from 'zustand';
import { unifiedStateManager } from './unifiedRouter';

type AppStatus = 'IDLE' | 'SNIFFING' | 'LOCKED' | 'ANSWERING';
type ScenarioMode = 'general' | 'studio' | 'live';

export interface BrandIdentity {
  id: string;
  name: string;
  hq: string;
  founded?: number;
  website: string;
  logo_url: string;
  description?: string;
}

export interface RelatedItem {
  id: string;
  name: string;
  category?: string;
  production_country?: string;
  type: string;
  image?: string;
}

export interface ImageEnhancement {
  product_id: string;
  product_name: string;
  annotations: Array<{
    type: 'display' | 'button' | 'control' | 'port' | 'indicator';
    feature: string;
    description: string;
    position: 'center' | 'auto' | 'sides' | 'top' | 'bottom';
    importance: 'high' | 'medium' | 'low';
  }>;
  display_content: Record<string, string>;
  has_enhancements: boolean;
}

export interface Prediction {
  id: string;
  name: string;
  // Support both schema structures just in case
  images?: { main: string; thumbnail?: string };
  img?: string; // from blueprint example "img" in prediction event
  brand?: string;
  production_country?: string;
  brand_identity?: BrandIdentity;
  score: number; // The user used score in App.tsx "item.score > 0.8" but it was missing in the interface shown before?
  category?: string; // Also used in App.tsx
}

interface WebSocketStore {
  status: AppStatus;
  predictions: Prediction[]; // List of all predictions
  lastPrediction: Prediction | null; // Top prediction or selected
  socket: WebSocket | null;
  messages: string[]; // For chat history / answers
  relatedItems: RelatedItem[]; // Hydrated related items from context
  selectedBrand: BrandIdentity | null;
  attachedImage: string | null;
  imageEnhancements: ImageEnhancement | null;
  scenarioMode: ScenarioMode; // New: scenario context (studio/live/general)
  connectionState: number; // WebSocket connection state (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)

  actions: {
    connect: () => void;
    sendTyping: (text: string) => void;
    lockAndQuery: (product: Prediction, query: string, imageData?: string | null, scenario?: ScenarioMode) => void;
    navigateToProduct: (productId: string, query: string, scenario?: ScenarioMode) => void;
    setScenarioMode: (mode: ScenarioMode) => void;
    openBrandModal: (brand: BrandIdentity) => void;
    closeBrandModal: () => void;
    reset: () => void;
  };
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  status: 'IDLE',
  predictions: [],
  lastPrediction: null,
  socket: null,
  messages: [],
  relatedItems: [],
  selectedBrand: null,
  attachedImage: null,
  imageEnhancements: null,
  scenarioMode: 'general', // New: default scenario mode
  connectionState: 0, // CONNECTING state initially

  actions: {
    connect: () => {
      // Use unified state manager's WebSocket connection
      // It already handles connection logic and auto-reconnect
      console.log('🔌 Using unified state manager connection');

      // Subscribe to unified state manager events
      const handlePredictions = (products: Prediction[]) => {
        if (products && products.length > 0) {
          set({
            predictions: products,
            lastPrediction: products[0],
            status: 'SNIFFING'
          });
        } else {
          set({ predictions: [], lastPrediction: null, status: 'IDLE' });
        }
      };

      const handleProgress = (data: { stage?: string }) => {
        if (data.stage === 'complete') {
          set({ status: 'IDLE' });
        } else {
          set({ status: 'ANSWERING' });
        }
      };

      const handleStream = (chunk: string) => {
        set((state) => ({
          messages: [...state.messages, chunk]
        }));
      };

      const handleComplete = () => {
        set({ status: 'IDLE' });
      };

      const handleError = (data: Record<string, unknown>) => {
        console.error("WebSocket error", data);
        set({ status: 'IDLE' });
      };

      unifiedStateManager.subscribe('predictions', handlePredictions);
      unifiedStateManager.subscribe('progress', handleProgress);
      unifiedStateManager.subscribe('stream', handleStream);
      unifiedStateManager.subscribe('complete', handleComplete);
      unifiedStateManager.subscribe('error', handleError);

      // Store cleanup
      set({
        socket: null // Not storing raw socket since unified manager handles it
      });
    },

    sendTyping: (text: string) => {
      // Send typing event for real-time predictions
      unifiedStateManager.sendTyping(text);
      set({ status: 'SNIFFING' });
    },

    lockAndQuery: (product: Prediction, query: string, imageData?: string | null, scenario?: ScenarioMode) => {
      const { socket, scenarioMode } = get();
      const activeScenario = scenario || scenarioMode;
      set({ status: 'LOCKED', lastPrediction: product, messages: [], relatedItems: [], attachedImage: imageData || null, imageEnhancements: null });

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'query',
          product_id: product.id,
          query,
          content: query,
          image: imageData || undefined,
          scenario: activeScenario
        }));
      }
    },

    navigateToProduct: (productId: string, query: string, scenario?: ScenarioMode) => {
      const { socket, scenarioMode } = get();
      const activeScenario = scenario || scenarioMode;
      set({ status: 'LOCKED', messages: [], relatedItems: [], attachedImage: null, imageEnhancements: null });

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'lock_and_query',
          product_id: productId,
          query,
          scenario: activeScenario
        }));
      }
    },

    setScenarioMode: (mode: ScenarioMode) => set({ scenarioMode: mode }),

    openBrandModal: (brand: BrandIdentity) => set({ selectedBrand: brand }),
    closeBrandModal: () => set({ selectedBrand: null }),
    reset: () => set({ status: 'IDLE', predictions: [], lastPrediction: null, messages: [], relatedItems: [], attachedImage: null, imageEnhancements: null, scenarioMode: 'general' })
  }
}));
