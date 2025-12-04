import { useEffect, useState, useRef } from 'react';

interface PriceData {
  price: number;
  priceChange24h: number;
}

interface WebSocketPriceUpdate {
  prices: Record<string, PriceData>;
  timestamp: string;
}

export function useWebSocketPrices(enabled: boolean = true) {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081/ws';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
          
          // Send ping every 30 seconds to keep connection alive
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);

          ws.addEventListener('close', () => {
            clearInterval(pingInterval);
          });
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'price-update') {
              const data: WebSocketPriceUpdate = message.data;
              const priceMap = new Map<string, PriceData>();
              
              Object.entries(data.prices).forEach(([asset, priceData]) => {
                priceMap.set(asset, priceData);
              });
              
              setPrices(priceMap);
            }
          } catch (err) {
            // Error parsing WebSocket message
          }
        };

        ws.onerror = () => {
          setError('WebSocket connection error');
        };

        ws.onclose = () => {
          setIsConnected(false);
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        };
      } catch (err) {
        setError('Failed to create WebSocket connection');
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enabled]);

  const subscribe = (assets: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        assets,
      }));
    }
  };

  return {
    prices,
    isConnected,
    error,
    subscribe,
  };
}
