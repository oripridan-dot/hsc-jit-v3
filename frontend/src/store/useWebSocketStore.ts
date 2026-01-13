import { create } from 'zustand';

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
  images?: { main: string }; 
  img?: string; // from blueprint example "img" in prediction event
  brand?: string;
  production_country?: string;
  brand_identity?: BrandIdentity;
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

  actions: {
    connect: (url?: string) => void;
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

  actions: {
    connect: (url?: string) => {
      if (get().socket) return;

      // Resolve WebSocket endpoint with fallbacks:
      // 1) VITE_WS_URL if provided
      // 2) Relative path /ws (proxied by Vite dev server)
      // 3) Same host with port 8000 (Codespaces/port-forward default)
      // 4) Same origin
      const resolvedUrl = (() => {
        if (url) return url;

        const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
        if (envUrl) return envUrl;

        const envPort = import.meta.env.VITE_WS_PORT as string | undefined;
        const loc = window.location;
        const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';

        // 1) Explicit port override
        if (envPort && loc.hostname) {
          return `${protocol}//${loc.hostname}:${envPort}/ws`;
        }

        // 2) GitHub Codespaces / app.github.dev: swap to -8000 suffix for backend
        if (loc.hostname.endsWith('.app.github.dev')) {
          const replaced = loc.hostname.replace(/-\d+\.app\.github\.dev$/, '-8000.app.github.dev');
          return `${protocol}//${replaced}/ws`;
        }

        // 3) Use relative path (works with Vite proxy)
        return `${protocol}//${loc.host}/ws`;
      })();

      const ws = new WebSocket(resolvedUrl);
      
      ws.onopen = () => {
        console.log('🔌 Connected to Psychic Engine');
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const { type, data, msg, content } = payload;
        
        if (type === 'prediction') {
           // data is list of predictions with hydrated products
           if (Array.isArray(data) && data.length > 0) {
             const topPred = data[0];
             const product = topPred.product;
             // Map backend format to frontend format if needed
             const mappedPredictions = data.map((item: any) => ({
                ...(item.product || {}),
                confidence: item.confidence,
                match_text: item.match_text
             }));

             const relatedItems = topPred.context?.related_items || [];
             
             set({ 
               predictions: mappedPredictions,
               lastPrediction: product, 
               relatedItems: relatedItems,
               status: 'SNIFFING' 
             });
           } else {
             set({ predictions: [], lastPrediction: null, status: 'IDLE' });
           }
        }
        
        if (type === 'status') {
            set((state) => ({ 
                status: 'ANSWERING',
                messages: [...state.messages, `[STATUS] ${msg}`]
            }));
        }
        
        if (type === 'answer_chunk') {
             set((state) => ({
                 messages: [...state.messages, content]
             }));
        }

        // NEW: Rich context event with brand + related items
        if (type === 'context') {
            const relatedItems = data?.related_items || [];
            const brand = data?.brand;
            
            set({ relatedItems });
            
            // Auto-open brand modal if a brand is provided
            if (brand) {
              set({ selectedBrand: brand });
            }
        }

        // NEW: Image enhancements event
        if (type === 'image_enhancements') {
            console.log('✨ Received image enhancements:', data);
            set({ imageEnhancements: data });
        }

        // Legacy fallback for old 'relations' event
        if (type === 'relations') {
            set({ relatedItems: data });
        }
      };

      set({ socket: ws });
    },

    sendTyping: (text: string) => {
      const { socket } = get();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'typing', content: text }));
      }
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
