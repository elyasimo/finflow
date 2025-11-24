import { useEffect, useRef, useState } from 'react';

export function useBinanceLivePrice(symbol = 'btcusdt', maxPoints = 100) {
  const [prices, setPrices] = useState<{ time: number, price: number }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      const price = parseFloat(trade.p);
      const time = trade.E;
      setPrices(prev => {
        const next = [...prev, { time, price }];
        return next.slice(-maxPoints);
      });
    };

    return () => ws.close();
  }, [symbol, maxPoints]);

  return prices;
} 