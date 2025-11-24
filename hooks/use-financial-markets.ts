import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Market } from '@/lib/api';

export function useFinancialMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setIsLoading(true);
        const data = await api.markets.getFinancialMarkets();
        setMarkets(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch market data'));
        console.error('Error fetching markets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
    // Set up polling every minute
    const interval = setInterval(fetchMarkets, 60000);
    return () => clearInterval(interval);
  }, []);

  return { markets, isLoading, error };
} 