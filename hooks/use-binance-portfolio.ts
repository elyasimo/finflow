import { useEffect, useState } from 'react';
import { getPortfolio, BinancePortfolioResponse } from '@/lib/api';

export interface BinancePortfolioAsset {
  asset: string;
  free: string;
  locked: string;
  currentPrice: number | null;
  priceChange24h: number | null;
  logo: string;
}

export default function useBinancePortfolio(pollInterval = 10000) {
  const [portfolio, setPortfolio] = useState<BinancePortfolioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsConfiguration, setNeedsConfiguration] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let mounted = true;

    async function fetchPortfolio() {
      if (!mounted) return;
      
      setLoading(true);
      try {
        const response = await getPortfolio();
        
        if (!mounted) return;
        
        // Check if API keys need configuration
        if (response.needsConfiguration) {
          setNeedsConfiguration(true);
          setError(response.error || 'Binance API keys not configured');
          setPortfolio([]);
        } else {
          setNeedsConfiguration(false);
          setPortfolio(response.portfolio || []);
          setError(null);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        
        console.error('Portfolio fetch error:', err);
        const error = err as { response?: { data?: { message?: string; needsConfiguration?: boolean } }; message?: string };
        
        if (error.response?.data?.needsConfiguration) {
          setNeedsConfiguration(true);
          setError(error.response?.data?.message || 'Binance API keys not configured');
        } else {
          setError(error.response?.data?.message || error.message || 'Failed to fetch portfolio');
        }
        setPortfolio([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPortfolio();
    interval = setInterval(fetchPortfolio, pollInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pollInterval]);

  return { portfolio, loading, error, needsConfiguration };
} 