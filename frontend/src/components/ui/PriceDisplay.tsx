import React, { useEffect, useState } from 'react';

interface PriceDisplayProps {
  price: number;
  currency?: string;
  availability?: string;
  history?: number[]; // Simple array of recent prices
  loading?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  currency = 'ILS', 
  availability = 'In Stock',
  loading = false 
}) => {
  const [displayPrice, setDisplayPrice] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    // Animate number
    let start = 0;
    const end = price;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      
      setDisplayPrice(Math.round(start + (end - start) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [price, loading]);

  if (loading) {
    return (
      <div className="h-24 w-full bg-gray-100 rounded-xl animate-pulse flex flex-col justify-center p-4">
        <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('he-IL', { 
    style: 'currency', 
    currency: currency,
    maximumFractionDigits: 0
  }).format(displayPrice);

  const isAvailable = availability.toLowerCase().includes('in stock');

  return (
    <div className="p-4 bg-white/80 backdrop-blur rounded-xl border border-gray-100 shadow-sm animate-scale-in">
      <div className="flex flex-col">
        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
          {formattedPrice}
        </span>
        
        {/* Mock USD conversion */}
        <span className="text-sm text-gray-500 mt-1">
          ≈ ${(price / 3.75).toFixed(0)} USD
        </span>
      </div>

      <div className="mt-4 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        <span className={`text-sm font-medium ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
          {availability}
        </span>
      </div>
      
      <div className="mt-1 text-xs text-gray-400 flex items-center">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Updated just now
      </div>
    </div>
  );
};
