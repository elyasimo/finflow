const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface CoinGeckoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_7d_in_currency: number;
}

// Cache for CoinGecko data
let coinGeckoCache: CoinGeckoData[] = [];
let lastCoinGeckoFetch = 0;
const COINGECKO_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchWithRetry(url: string, options?: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        // Rate limit hit, wait and retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export interface BinanceTicker {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export async function getBinanceTickers(): Promise<BinanceTicker[]> {
  const response = await fetchWithRetry(`${BINANCE_API_BASE}/ticker/24hr`);
  return response.json();
}

// Get additional market data from CoinGecko for images and market cap
export async function getCoinGeckoData() {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (coinGeckoCache.length > 0 && now - lastCoinGeckoFetch < COINGECKO_CACHE_DURATION) {
    return coinGeckoCache;
  }

  const response = await fetchWithRetry(
    `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
  );
  const data = await response.json();
  
  // Update cache
  coinGeckoCache = data;
  lastCoinGeckoFetch = now;
  
  return data;
}

// Combine Binance and CoinGecko data
export async function getCombinedCryptoData() {
  try {
    const [binanceData, coinGeckoData] = await Promise.all([
      getBinanceTickers(),
      getCoinGeckoData()
    ]);

    // Filter for USDT pairs and combine data
    return binanceData
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .map(ticker => {
        const symbol = ticker.symbol.replace('USDT', '').toLowerCase();
        const coinGeckoInfo = coinGeckoData.find(
          (coin: CoinGeckoData) => coin.symbol.toLowerCase() === symbol
        );
        if (!coinGeckoInfo) {
          console.warn('No CoinGecko match for', symbol, 'Binance:', ticker.symbol);
        }
        return {
          id: symbol,
          symbol: symbol.toUpperCase(),
          name: coinGeckoInfo?.name || symbol.toUpperCase(),
          image: coinGeckoInfo?.image || '',
          current_price: parseFloat(ticker.price),
          market_cap: coinGeckoInfo?.market_cap || 0,
          market_cap_rank: coinGeckoInfo?.market_cap_rank || 0,
          price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
          price_change_percentage_7d_in_currency: coinGeckoInfo?.price_change_percentage_7d_in_currency || 0,
          total_volume: parseFloat(ticker.volume)
        };
      })
      .filter(coin => coin.market_cap > 0 && coin.current_price > 0) // Only include coins with market cap and price data
      .sort((a, b) => b.market_cap - a.market_cap); // Sort by market cap
  } catch (error) {
    console.error('Error in getCombinedCryptoData:', error);
    throw error;
  }
} 