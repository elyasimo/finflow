import { useEffect, useRef, useState } from 'react';

interface PortfolioAsset {
  symbol: string;
  amount: string;
}

// assets = [{ symbol: 'BTC', amount: '0.1' }, ...]
export function useLivePortfolioValue(assets: PortfolioAsset[], maxPoints = 100) {
  const [history, setHistory] = useState<{ time: number, value: number }[]>([]);
  const pricesRef = useRef<Record<string, number>>({}); // { BTC: price, ETH: price, ... }

  useEffect(() => {
    if (!assets || !assets.length) return;
    const streams = assets
      .map((a: PortfolioAsset) => `${(a.symbol || '').toLowerCase()}usdt@trade`)
      .join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const stream = data.stream; // e.g. btcusdt@trade
      const symbol = stream.split('@')[0].replace('usdt', '').toUpperCase();
      const price = parseFloat(data.data.p);
      pricesRef.current[symbol] = price;
      const total = assets.reduce((sum: number, a: PortfolioAsset) => {
        const price = pricesRef.current[a.symbol] || 0;
        return sum + (parseFloat(a.amount) * price);
      }, 0);
      setHistory(prev => {
        const next = [...prev, { time: Date.now(), value: total }];
        return next.slice(-maxPoints);
      });
    };
    return () => ws.close();
  }, [assets, maxPoints]);

  return history;
} 