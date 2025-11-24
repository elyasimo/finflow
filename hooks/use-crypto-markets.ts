import { useState, useEffect } from 'react';
import { Market } from '@/types/market';
import { marketsApi } from '@/lib/api';

const POLLING_INTERVAL = 10000; // 10 seconds

export function useCryptoMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const data = await marketsApi.getCryptoMarkets();
        setMarkets(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        console.error('Error fetching crypto markets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMarkets();

    // Set up polling
    const interval = setInterval(fetchMarkets, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return { markets, isLoading, error };
} 