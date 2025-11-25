import { useEffect, useState } from 'react';
import axios from 'axios';

export interface BinancePortfolioAsset {
  asset: string;
  free: string;
  locked: string;
  currentPrice: number | null;
  priceChange24h: number | null;
  logo: string;
}

// Create API client for portfolio - use Backend API
const portfolioApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
  withCredentials: true,
});

export default function useBinancePortfolio(pollInterval = 10000) {
  const [portfolio, setPortfolio] = useState<BinancePortfolioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchPortfolio() {
      setLoading(true);
      try {
        // Get auth token from localStorage
        const token = localStorage.getItem('accessToken');
        const response = await portfolioApi.get('/markets/portfolio', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPortfolio(response.data.portfolio || []);
        setError(null);
      } catch (err: unknown) {
        console.error('Portfolio fetch error:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        setError(error.response?.data?.message || error.message || 'Failed to fetch portfolio');
        setPortfolio([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
    interval = setInterval(fetchPortfolio, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return { portfolio, loading, error };
} 