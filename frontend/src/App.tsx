import { useEffect, useState, useRef } from 'react';
import './index.css';

interface Prediction {
  product: {
    product_name?: string;
    model?: string;
    brand?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  confidence: number;
  match_text: string;
}

function App() {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to backend WebSocket
    ws.current = new WebSocket('ws://localhost:8000/ws/predict');

    ws.current.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'prediction') {
          setPredictions(data.data);
        }
      } catch (e) {
        console.error('Error parsing message', e);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    }

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'typing', content: val }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        HSC JIT v3
      </h1>
      
      <div className="w-full max-w-2xl relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Type to search..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg text-white placeholder-gray-500"
          autoFocus
        />
        
        {predictions.length > 0 && query && (
          <div className="absolute w-full mt-4 bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700 shadow-2xl overflow-hidden z-10 transition-all duration-300 ease-in-out">
            {predictions.map((p, i) => (
              <div key={i} className="p-4 hover:bg-gray-700/50 border-b border-gray-700/50 last:border-0 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-purple-300">
                      {p.product.product_name || p.product.model || p.match_text}
                    </h3>
                    <p className="text-sm text-gray-400">{p.product.brand}</p>
                  </div>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 h-fit">
                    {p.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
