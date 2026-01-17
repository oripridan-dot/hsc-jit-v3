import React, { useState, useRef, useEffect } from 'react';
import './AIAssistant.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  currentProduct?: any;
  allProducts: any[];
  isOpen: boolean;
  onToggle: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentProduct,
  allProducts,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && allProducts.length > 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Hi! I'm **Halileo Haliley**, your Halilit Support Center AI Assistant.\n\nI have access to **${allProducts.length} products** across all brands.\n\nI can help you with:\n• Product specifications and features\n• Pricing information\n• Brand history\n• Category exploration\n\nJust ask me anything!`,
        timestamp: new Date(),
      }]);
    } else if (messages.length === 0) {
       // Loading state or empty
       setMessages([{
        role: 'assistant',
        content: `👋 Hi! I'm **Halileo Haliley**. I'm loading the product catalog...`,
        timestamp: new Date(),
      }]);
    }
  }, [allProducts.length]);

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
        if (currentProduct.pricing) {
          const { regular_price, eilat_price, sale_price } = currentProduct.pricing;
          let response = `💰 **Pricing for ${currentProduct.name}:**\n\n`;
          if (sale_price && sale_price < regular_price) {
            response += `🔥 **Sale Price:** ₪${sale_price.toLocaleString()}\n`;
            response += `~~Regular: ₪${regular_price.toLocaleString()}~~\n`;
          } else if (regular_price) {
            response += `**Regular Price:** ₪${regular_price.toLocaleString()}\n`;
          }
          if (eilat_price) {
            response += `**Eilat Price:** ₪${eilat_price.toLocaleString()} (Tax-Free Zone)\n`;
          }
          return response;
        } else {
          return `I don't have pricing information for ${currentProduct.name} yet. This product may be available through the brand's official website.`;
        }
      }

      if (lowerMsg.includes('spec') || lowerMsg.includes('feature') || lowerMsg.includes('detail')) {
        const specs = currentProduct.specifications || [];
        const features = currentProduct.features || [];
        let response = `📋 **${currentProduct.name} Details:**\n\n`;
        
        if (features.length > 0) {
          response += `**Key Features:**\n`;
          features.slice(0, 5).forEach((f: string) => {
            response += `✓ ${f}\n`;
          });
          if (features.length > 5) response += `\n_...and ${features.length - 5} more features_\n`;
        }
        
        if (specs.length > 0) {
          response += `\n**Specifications:** ${specs.length} specs available in the product detail view.\n`;
        }
        
        return response || 'I can see this product but don\'t have detailed specifications yet.';
      }

      if (lowerMsg.includes('accessor') || lowerMsg.includes('compatible') || lowerMsg.includes('goes with')) {
        const accessories = currentProduct.accessories || [];
        const related = currentProduct.related_products || [];
        
        if (accessories.length > 0 || related.length > 0) {
          let response = `🔌 **Compatible Products for ${currentProduct.name}:**\n\n`;
          
          if (accessories.length > 0) {
            response += `**Recommended Accessories:**\n`;
            accessories.slice(0, 3).forEach((acc: any) => {
              response += `• ${acc.target_product_name}\n`;
            });
            if (accessories.length > 3) response += `_...and ${accessories.length - 3} more accessories_\n`;
          }
          
          if (related.length > 0) {
            response += `\n**Related Products:**\n`;
            related.slice(0, 3).forEach((rel: any) => {
              response += `• ${rel.target_product_name}\n`;
            });
          }
          
          return response;
        } else {
          return `I don't have accessory information for ${currentProduct.name} yet.`;
        }
      }
    }

    // General queries
    if (lowerMsg.includes('brand') || lowerMsg.includes('manufacturer')) {
       // Search for brand info in allProducts (heuristic)
       const brandName = allProducts[0]?.brand || "Halilit"; // Fallback
       return `🏢 **${brandName}**\n\nI have ${allProducts.filter(p => p.brand === brandName).length} products from this brand in my catalog.`;
    }

    if (lowerMsg.includes('how many') || lowerMsg.includes('count')) {
      const categories = allProducts.reduce((acc: any, p: any) => {
        const cat = p.main_category || p.category || 'Uncategorized';
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
                p.model_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.short_description?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (matches.length === 1) {
                const p = matches[0];
                return `🔎 **Found it!**\n\n**${p.name}** (${p.file_path ? 'Saved File' : 'Catalog Item'})\n\n${p.short_description || p.description || 'No description available.'}\n\nAsk me specifically about its **price**, **features**, or **specs**!`;
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
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ params: '0ms' }}></span>
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
