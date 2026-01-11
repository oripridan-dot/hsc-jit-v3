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

export interface RelatedItem {
  id: string;
  name: string;
  category?: string;
  production_country?: string;
  type: string;
  image?: string;
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
  relatedItems: RelatedItem[]; // Hydrated related items from context
  selectedBrand: BrandIdentity | null;
  attachedImage: string | null;

  actions: {
    connect: (url: string) => void;
    sendTyping: (text: string) => void;
    lockAndQuery: (product: Prediction, query: string, imageData?: string | null) => void;
    navigateToProduct: (productId: string, query: string) => void;
    openBrandModal: (brand: BrandIdentity) => void;
    closeBrandModal: () => void;
  };
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  status: 'IDLE',
  lastPrediction: null,
  socket: null,
  messages: [],
  relatedItems: [],
  selectedBrand: null,
  attachedImage: null,

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
           // data is list of predictions with hydrated products
           if (Array.isArray(data) && data.length > 0) {
             const topPred = data[0];
             const product = topPred.product;
             const relatedItems = topPred.context?.related_items || [];
             
             // Debug logging
             console.log('🔍 Prediction received:', {
               productId: product?.id,
               productName: product?.name,
               hasImages: !!product?.images,
               imageMain: product?.images?.main,
               hasBrandIdentity: !!product?.brand_identity,
               brandLogo: product?.brand_identity?.logo_url,
               relatedCount: relatedItems.length
             });
             
             set({ 
               lastPrediction: product, 
               relatedItems: relatedItems,
               status: 'SNIFFING' 
             });
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

    lockAndQuery: (product: Prediction, query: string, imageData?: string | null) => {
      const { socket } = get();
      set({ status: 'LOCKED', lastPrediction: product, messages: [], relatedItems: [], attachedImage: imageData || null });
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
            type: 'query', 
            product_id: product.id, 
            query,
            content: query,
            image: imageData || undefined
        }));
      }
    },

    navigateToProduct: (productId: string, query: string) => {
      const { socket } = get();
      set({ status: 'LOCKED', messages: [], relatedItems: [], attachedImage: null });
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
            type: 'lock_and_query', 
            product_id: productId, 
            query 
        }));
      }
    },

    openBrandModal: (brand: BrandIdentity) => set({ selectedBrand: brand }),
    closeBrandModal: () => set({ selectedBrand: null })
  }
}));
