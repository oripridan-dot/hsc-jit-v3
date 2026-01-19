import React, { useState, useRef, useEffect } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import type { Product } from '../lib';
import './AIAssistant.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  currentProduct?: Product | null;
  allProducts: Product[];
  isOpen: boolean;
  onToggle: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentProduct,
  allProducts,
  isOpen,
  onToggle,
}) => {
  // Initialize messages with welcome message
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: 'assistant',
      content: `👋 Hi! I'm **Halileo Haliley**, your Halilit Support Center AI Assistant.\n\nI'm ready to help you explore the product catalog!`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProductRef = useRef<string | null>(null);
  
  // Navigation context awareness
  const { currentLevel, selectedProduct, ecosystem } = useNavigationStore();

  // Ref to track if welcome message has been updated
  const welcomeUpdatedRef = useRef(false);
  
  // React to navigation changes - only add message if product changed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentLevel === 'product' && selectedProduct) {
      const productId = selectedProduct.id || selectedProduct.name;
      
      // Only add context message if we switched to a different product
      if (productId && productId !== lastProductRef.current) {
        lastProductRef.current = productId;
        
        const accessoriesCount = (selectedProduct.accessories?.length || 0) as number;
        const relatedCount = (selectedProduct.related?.length || 0) as number;
        
        const contextMessage: Message = {
          role: 'assistant',
          content: `🎯 I see you're viewing **${selectedProduct.name}**.\n\nThis is a product from **${selectedProduct.brand || 'Unknown'}**.\n\n${
            accessoriesCount > 0 
              ? `💡 This product requires **${accessoriesCount} accessories**.` 
              : ''
          }\n${
            relatedCount > 0
              ? `🔗 There are **${relatedCount} related products** that work well with this.`
              : ''
          }\n\nWhat would you like to know about it?`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, contextMessage]);
      }
    } else if (currentLevel !== 'product') {
      lastProductRef.current = null;
    }
  }, [currentLevel, selectedProduct]);
  
  // Update welcome message when catalog loads - only once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (allProducts.length > 0 && !welcomeUpdatedRef.current) {
      welcomeUpdatedRef.current = true;
      setMessages([{
        role: 'assistant',
        content: `👋 Hi! I'm **Halileo Haliley**, your Halilit Support Center AI Assistant.\n\nI have access to **${allProducts.length} products** across **${ecosystem?.children?.length || 0} domains**.\n\nI can help you with:\n• Product specifications and features\n• Pricing information\n• Brand history\n• Category exploration\n• Product relationships and dependencies\n\nJust ask me anything!`,
        timestamp: new Date(),
      }]);
    }
  }, [allProducts.length, ecosystem?.children?.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const generateResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();

    // Context-aware responses based on current product
    if (currentProduct) {
      if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('how much')) {
        if (currentProduct.halilit_data?.price || currentProduct.halilit_price) {
          const price = currentProduct.halilit_data?.price || currentProduct.halilit_price;
          const currency = currentProduct.halilit_data?.currency || 'ILS';
          let response = `💰 **Pricing for ${currentProduct.name}:**\n\n`;
          if (price) {
            response += `**Price:** ${currency} ${price.toLocaleString()}\n`;
          }
          if (currentProduct.halilit_data?.availability) {
            response += `**Availability:** ${currentProduct.halilit_data.availability}\n`;
          }
          return response;
        } else {
          return `I don't have pricing information for ${currentProduct.name} yet. This product may be available through the brand's official website.`;
        }
      }

      if (lowerMsg.includes('spec') || lowerMsg.includes('feature') || lowerMsg.includes('detail')) {
        const description = currentProduct.description || currentProduct.short_description;
        let response = `📋 **${currentProduct.name} Details:**\n\n`;
        
        if (description) {
          response += `${description}\n\n`;
        }
        
        if (currentProduct.category) {
          response += `**Category:** ${currentProduct.category}\n`;
        }
        
        if (currentProduct.item_code) {
          response += `**Item Code:** ${currentProduct.item_code}\n`;
        }
        
        return response || 'I can see this product but don\'t have detailed specifications yet.';
      }

      if (lowerMsg.includes('accessor') || lowerMsg.includes('compatible') || lowerMsg.includes('goes with')) {
        return `I don't have accessory information for ${currentProduct.name} yet. Please check the product detail view for more information.`;
      }
    }

    // General queries
    if (lowerMsg.includes('brand') || lowerMsg.includes('manufacturer')) {
       // Search for brand info in allProducts (heuristic)
       const brandName = allProducts[0]?.brand || "Halilit"; // Fallback
       return `🏢 **${brandName}**\n\nI have ${allProducts.filter(p => p.brand === brandName).length} products from this brand in my catalog.`;
    }

    if (lowerMsg.includes('how many') || lowerMsg.includes('count')) {
      const categories = allProducts.reduce<Record<string, number>>((acc, p) => {
        const cat = p.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      let response = `📊 **Catalog Stats:**\n\n`;
      Object.entries(categories).slice(0, 10).forEach(([cat, count]) => {
        response += `• ${cat}: ${count} products\n`;
      });
      response += `\n**Total:** ${allProducts.length} products available`;
      return response;
    }

    if (lowerMsg.includes('help') || lowerMsg.includes('what can you')) {
      return `🎯 **I can help you with:**\n\n✓ **Product Information** - Specs, features, history\n✓ **Pricing** - Regular and Eilat tax-free pricing\n✓ **Categories** - Browse by product type\n✓ **Search** - Find specific products\n\n💡 **Try asking:**\n• "What is the price of..."\n• "Show me synthesizers"\n• "How many products do you have?"`;
    }

    // Product Search / "What is"
    if (lowerMsg.includes('what is') || lowerMsg.includes('show me') || lowerMsg.includes('tell me about') || lowerMsg.includes('find')) {
        const searchTerm = userMessage.replace(/what is|show me|tell me about|find/gi, '').trim();
        if (searchTerm.length > 2) {
            const matches = allProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.short_description?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (matches.length === 1) {
                const p = matches[0];
                return `🔎 **Found it!**\n\n**${p.name}** (Catalog Item)\n\n${p.short_description || p.description || 'No description available.'}\n\nAsk me specifically about its **price**, **features**, or **specs**!`;
            } else if (matches.length > 1) {
                 return `🔎 **Found ${matches.length} products matching "${searchTerm}":**\n\n` + 
                        matches.slice(0, 5).map(p => `• **${p.name}**`).join('\n') + 
                        (matches.length > 5 ? `\n...and ${matches.length - 5} others.` : '');
            }
        }
    }

    // Default response
    return `I understand you're asking about "${userMessage}". ${currentProduct ? `I'm currently viewing ${currentProduct.name}.` : `I have access to ${allProducts.length} products.`}\n\nCould you be more specific?`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Simulate thinking delay for better UX
    setTimeout(() => {
      const response = generateResponse(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsThinking(false);
    }, 600);
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
      <div key={i} className="mb-1 text-sm leading-relaxed whitespace-pre-wrap">
        {line.split(/(\*\*.*?\*\*|~~.*?~~|_.*?_)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold text-accent-primary">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('_') && part.endsWith('_')) {
            return <em key={j} className="italic text-text-secondary">{part.slice(1, -1)}</em>;
          }
           if (part.startsWith('~~') && part.endsWith('~~')) {
            return <span key={j} className="line-through opacity-70">{part.slice(2, -2)}</span>;
          }
          return part;
        })}
      </div>
    ));
  };

  if (!isOpen) {
    return (
      <button className="ai-assistant-trigger shadow-lg hover:shadow-xl transform hover:scale-105 transition-all" onClick={onToggle} title="Open AI Assistant">
        <span className="ai-icon text-2xl">🤖</span>
        <span className="ai-badge font-semibold px-2">Halileo Haliley</span>
      </button>
    );
  }

  return (
    <div className="ai-assistant-container shadow-2xl border border-border-subtle backdrop-blur-md bg-bg-card/95">
      <div className="ai-assistant-header bg-bg-surface/80 border-b border-border-subtle p-3">
        <div className="ai-assistant-title flex items-center gap-2">
          <span className="ai-avatar text-2xl bg-accent-primary/10 p-1 rounded-full">🤖</span>
          <div>
            <h3 className="font-bold text-text-primary">Halileo Haliley</h3>
            <p className="text-xs text-text-muted">AI Support Assistant</p>
          </div>
        </div>
        <button className="ai-close hover:bg-bg-hover rounded-full p-1 w-8 h-8 flex items-center justify-center transition-colors" onClick={onToggle}>×</button>
      </div>

      <div className="ai-assistant-messages p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-message ${msg.role} flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`message-content p-3 rounded-2xl max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-accent-primary text-white rounded-br-none' 
                : 'bg-bg-surface border border-border-subtle rounded-bl-none'
            }`}>
              {formatMessage(msg.content)}
            </div>
            <div className="message-time text-[10px] text-text-muted mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="ai-message assistant">
             <div className="message-content bg-bg-surface border border-border-subtle p-3 rounded-2xl rounded-bl-none inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-assistant-input p-3 border-t border-border-subtle bg-bg-surface/50" onSubmit={handleSubmit}>
        <div className="relative flex items-center gap-2">
            <input
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isThinking}
            />
            <button 
                type="submit" 
                disabled={!input.trim() || isThinking}
                className="absolute right-1 p-1.5 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
            </button>
        </div>
      </form>

      {currentProduct && (
        <div className="ai-context-indicator text-xs text-center py-1 bg-accent-secondary/10 text-accent-secondary border-t border-accent-secondary/20">
          📦 Viewing: <b>{currentProduct.name}</b>
        </div>
      )}
    </div>
  );
};
