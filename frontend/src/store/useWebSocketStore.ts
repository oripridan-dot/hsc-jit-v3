import { create } from 'zustand';

type AppStatus = 'IDLE' | 'SNIFFING' | 'LOCKED' | 'ANSWERING';

export interface BrandIdentity {
    id: string;
    name: string;
    hq: string;
    founded?: number;
    website: string;
    logo_url: string;
    description?: string;
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
  lastPrediction: Prediction | null;
  socket: WebSocket | null;
  messages: string[]; // For chat history / answers
  relations: any[]; // For accessories rail
  selectedBrand: BrandIdentity | null;

  actions: {
    connect: (url: string) => void;
    sendTyping: (text: string) => void;
    lockAndQuery: (product: Prediction, query: string) => void;
    openBrandModal: (brand: BrandIdentity) => void;
    closeBrandModal: () => void;
  };
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  status: 'IDLE',
  lastPrediction: null,
  socket: null,
  messages: [],
  relations: [],
  selectedBrand: null,

  actions: {
    connect: (url: string) => {
      if (get().socket) return;
      
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('🔌 Connected to Psychic Engine');
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const { type, data, msg, content } = payload;
        
        if (type === 'prediction') {
           // data is list of predictions.
           if (Array.isArray(data) && data.length > 0) {
             const topPred = data[0].product; 
             set({ lastPrediction: topPred, status: 'SNIFFING' });
           } else {
             set({ lastPrediction: null, status: 'IDLE' });
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

        if (type === 'relations') {
            set({ relations: data });
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

    lockAndQuery: (product: Prediction, query: string) => {
      const { socket } = get();
      set({ status: 'LOCKED', lastPrediction: product, messages: [] });
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
            type: 'lock_and_query', 
            product_id: product.id, 
            query 
        }));
      }
    },

    openBrandModal: (brand: BrandIdentity) => set({ selectedBrand: brand }),
    closeBrandModal: () => set({ selectedBrand: null })
  }
}));
