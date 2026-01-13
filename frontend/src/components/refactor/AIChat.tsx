/**
 * AIChat Component
 * Streaming AI chat interface with product context
 */

import { useState, useRef, useEffect } from 'react';
import type { Product, AIMessage } from '../../types';

interface AIChatProps {
  product: Product;
}

export function AIChat({ product }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isStreaming) return;

    // Add user message
    const userMessage: AIMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Simulate streaming response
    setTimeout(() => {
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: `I can help you with information about the ${product.name}. Based on your question about "${input}", here's what I found...`,
        markers: {
          suggestions: ['Technical specifications', 'Availability', 'Warranty information'],
          relatedProducts: [],
          manualRefs: product.manual_url ? [product.manual_url] : [],
        },
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
        <h3 className="font-semibold text-slate-100 text-sm">AI Assistant</h3>
        <p className="text-xs text-slate-400 mt-1">Ask about this product</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-400">No messages yet</p>
              <p className="text-xs text-slate-500">Ask a question about this product to get started</p>
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-100 rounded-bl-none'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>

              {/* Message Markers */}
              {message.role === 'assistant' && message.markers && (
                <div className="mt-2 space-y-1">
                  {message.markers.suggestions && message.markers.suggestions.length > 0 && (
                    <div className="text-xs text-slate-300">
                      <p className="font-semibold mb-1">Related topics:</p>
                      <div className="flex flex-wrap gap-1">
                            {message.markers.suggestions.map((suggestion: string, i: number) => (
                          <button
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-slate-600/50 hover:bg-slate-600 transition-colors text-xs"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg rounded-bl-none px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isStreaming}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
