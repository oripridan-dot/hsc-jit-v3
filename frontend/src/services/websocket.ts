/**
 * WebSocket Service
 * Manages real-time communication with backend
 */

import type { WebSocketMessage } from '../types';

type MessageHandler = (message: WebSocketMessage) => void;
type EventType = 'prediction' | 'answer_chunk' | 'status' | 'error' | 'open' | 'close';

/**
 * WebSocket Service for JIT streaming
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected = false;
  private handlers: Map<EventType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private sessionId: string;

  constructor(url: string = 'ws://localhost:8000/ws') {
    this.url = url;
    this.sessionId = this.generateSessionId();
    this.initializeHandlers();
  }

  private initializeHandlers() {
    const eventTypes: EventType[] = [
      'prediction',
      'answer_chunk',
      'status',
      'error',
      'open',
      'close',
    ];
    eventTypes.forEach((type) => {
      this.handlers.set(type, new Set());
    });
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('open', {
            type: 'open' as any,
            data: {},
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
          });

          // Flush message queue
          this.flushQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.emit(message.type as EventType, message);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', {
            type: 'error',
            data: { message: 'WebSocket connection error' },
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
          } as WebSocketMessage);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.emit('close', {
            type: 'close' as any,
            data: {},
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
          });
          this.attemptReconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Reconnecting in ${delay}ms...`);

      setTimeout(() => {
        this.connect().catch((e) => {
          console.error('Reconnect failed:', e);
        });
      }, delay);
    }
  }

  /**
   * Send a prediction query
   */
  sendPrediction(query: string): void {
    const message: WebSocketMessage = {
      type: 'prediction',
      data: { query },
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };
    this.send(message);
  }

  /**
   * Send a query for AI response
   */
  sendQuery(query: string, productId: string): void {
    const message: WebSocketMessage = {
      type: 'query',
      data: { query, product_id: productId },
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };
    this.send(message);
  }

  /**
   * Send a raw message
   */
  send(message: WebSocketMessage): void {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (e) {
        console.error('Failed to send message:', e);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
      if (!this.isConnected) {
        this.connect().catch((e) => {
          console.error('Failed to connect:', e);
        });
      }
    }
  }

  /**
   * Flush queued messages
   */
  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Subscribe to an event type
   */
  on(type: EventType, handler: MessageHandler): () => void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.add(handler);
    }

    // Return unsubscribe function
    return () => {
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Emit event to all subscribed handlers
   */
  private emit(type: EventType, message: WebSocketMessage): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (e) {
          console.error(`Error in handler for ${type}:`, e);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
let wsInstance: WebSocketService | null = null;

export function getWebSocketService(
  url: string = 'ws://localhost:8000/ws'
): WebSocketService {
  if (!wsInstance) {
    wsInstance = new WebSocketService(url);
  }
  return wsInstance;
}

export const wsService = getWebSocketService();
