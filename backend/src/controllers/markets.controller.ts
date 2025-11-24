import { Request, Response } from 'express';
import axios from 'axios';
import { createHmac } from 'crypto';

export class MarketsController {
  /**
   * Get Binance portfolio with current prices
   */
  async getBinancePortfolio(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = process.env.BINANCE_API_KEY;
      const apiSecret = process.env.BINANCE_API_SECRET;
      const useTestnet = process.env.BINANCE_USE_TESTNET === 'true';
      
      if (!apiKey || !apiSecret) {
        res.status(500).json({ 
          error: 'Binance API credentials not configured',
          portfolio: [],
          totalValue: 0 
        });
        return;
      }

      const baseURL = useTestnet 
        ? process.env.BINANCE_API_TESTNET_BASE || 'https://testnet.binance.vision'
        : process.env.BINANCE_API_BASE || 'https://api.binance.com';

      // 1. Get account information
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');

      const accountResponse = await axios.get(
        `${baseURL}/api/v3/account?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': apiKey,
          },
        }
      );

      const balances = accountResponse.data.balances
        .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map((b: any) => ({
          asset: b.asset,
          free: b.free,
          locked: b.locked,
        }));

      // 2. Get current prices for all assets (in EUR)
      const pricesResponse = await axios.get(`${baseURL}/api/v3/ticker/24hr`);
      const pricesMap = new Map();
      
      pricesResponse.data.forEach((ticker: any) => {
        pricesMap.set(ticker.symbol, {
          price: parseFloat(ticker.lastPrice),
          priceChange24h: parseFloat(ticker.priceChangePercent),
        });
      });

      // 2.1. Get USDT to EUR conversion rate
      const usdtEurPrice = pricesMap.get('USDTEUR')?.price || null;
      
      // If no direct USDTEUR, try EURUSDT (inverted)
      let eurConversionRate = 1.0;
      if (usdtEurPrice) {
        eurConversionRate = usdtEurPrice;
      } else {
        const eurUsdtPrice = pricesMap.get('EURUSDT')?.price;
        if (eurUsdtPrice && eurUsdtPrice > 0) {
          eurConversionRate = 1 / eurUsdtPrice;
        }
      }

      // 3. Combine balances with prices (converted to EUR)
      const portfolio = balances.map((balance: any) => {
        // Try to get direct EUR pair first
        const eurSymbol = `${balance.asset}EUR`;
        const usdtSymbol = `${balance.asset}USDT`;
        
        let priceInEur = null;
        let priceChange24h = null;
        
        // First try direct EUR pair
        const eurPriceData = pricesMap.get(eurSymbol);
        if (eurPriceData) {
          priceInEur = eurPriceData.price;
          priceChange24h = eurPriceData.priceChange24h;
        } else {
          // Fallback to USDT pair converted to EUR
          const usdtPriceData = pricesMap.get(usdtSymbol);
          if (usdtPriceData) {
            priceInEur = usdtPriceData.price * eurConversionRate;
            priceChange24h = usdtPriceData.priceChange24h;
          }
        }
        
        return {
          asset: balance.asset,
          free: balance.free,
          locked: balance.locked,
          currentPrice: priceInEur,
          priceChange24h: priceChange24h,
          logo: `/logos/cryptocurrency/${balance.asset.toLowerCase()}.png`,
        };
      });

      // 4. Calculate total value
      const totalValue = portfolio.reduce((sum: number, item: any) => {
        const value = item.currentPrice 
          ? parseFloat(item.free) * item.currentPrice 
          : 0;
        return sum + value;
      }, 0);

      res.json({
        portfolio,
        totalValue,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Binance portfolio error:', error.response?.data || error.message);
      res.status(500).json({ 
        error: 'Failed to fetch Binance portfolio',
        message: error.response?.data?.msg || error.message,
        portfolio: [],
        totalValue: 0 
      });
    }
  }

  /**
   * Get cryptocurrency market data
   */
  async getCryptoMarkets(req: Request, res: Response): Promise<void> {
    try {
      const baseURL = process.env.BINANCE_API_BASE || 'https://api.binance.com';

      // Get 24hr ticker data for all USDT pairs
      const response = await axios.get(`${baseURL}/api/v3/ticker/24hr`);

      // Filter and sort by volume
      const usdtPairs = response.data
        .filter((ticker: any) =>
          ticker.symbol.endsWith('USDT') &&
          !ticker.symbol.includes('UP') &&
          !ticker.symbol.includes('DOWN') &&
          !ticker.symbol.includes('BEAR') &&
          !ticker.symbol.includes('BULL')
        )
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 100);

      // Get additional data from CoinGecko for market cap, images, etc.
      const symbols = usdtPairs.map((p: any) => p.symbol.replace('USDT', '').toLowerCase());

      // Map common symbol names to CoinGecko IDs
      const symbolToId: { [key: string]: string } = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'bnb': 'binancecoin',
        'xrp': 'ripple',
        'ada': 'cardano',
        'doge': 'dogecoin',
        'sol': 'solana',
        'dot': 'polkadot',
        'matic': 'matic-network',
        'shib': 'shiba-inu',
        'trx': 'tron',
        'avax': 'avalanche-2',
        'link': 'chainlink',
        'uni': 'uniswap',
        'atom': 'cosmos',
        'ltc': 'litecoin',
        'etc': 'ethereum-classic',
        'xlm': 'stellar',
        'bch': 'bitcoin-cash',
        'algo': 'algorand',
        'vet': 'vechain',
        'icp': 'internet-computer',
        'fil': 'filecoin',
        'hbar': 'hedera-hashgraph',
        'near': 'near',
        'apt': 'aptos',
        'arb': 'arbitrum',
        'op': 'optimism',
        'sui': 'sui',
        'pepe': 'pepe',
      };

      let coinGeckoData: any[] = [];
      try {
        const ids = symbols
          .map((s: string) => symbolToId[s] || s)
          .slice(0, 50) // CoinGecko has limits
          .join(',');

        const cgResponse = await axios.get(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=7d`
        );
        coinGeckoData = cgResponse.data;
      } catch (cgError) {
        console.warn('CoinGecko API error, continuing without additional data:', cgError);
      }

      // Create a map for quick lookup
      const cgMap = new Map();
      coinGeckoData.forEach((coin: any) => {
        cgMap.set(coin.symbol.toUpperCase(), coin);
      });

      // Combine Binance and CoinGecko data
      const cryptoMarkets = usdtPairs.map((ticker: any, index: number) => {
        const baseAsset = ticker.symbol.replace('USDT', '');
        const cgInfo = cgMap.get(baseAsset);

        return {
          id: cgInfo?.id || baseAsset.toLowerCase(),
          symbol: `${baseAsset}EUR`, // Frontend expects EUR pairs for display
          name: cgInfo?.name || baseAsset,
          image: cgInfo?.image || `https://cryptoicons.org/api/icon/${baseAsset.toLowerCase()}/64`,
          current_price: parseFloat(ticker.lastPrice),
          market_cap: cgInfo?.market_cap || 0,
          market_cap_rank: cgInfo?.market_cap_rank || index + 1,
          price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
          price_change_percentage_7d_in_currency: cgInfo?.price_change_percentage_7d_in_currency || 0,
          total_volume: parseFloat(ticker.quoteVolume),
        };
      });

      res.json(cryptoMarkets);
    } catch (error: any) {
      console.error('Crypto markets error:', error.message);
      res.status(500).json({
        error: 'Failed to fetch crypto markets',
        message: error.message
      });
    }
  }

  /**
   * Get financial markets data (stocks, forex, etc.)
   */
  async getFinancialMarkets(req: Request, res: Response): Promise<void> {
    // Placeholder for future implementation
    res.json({
      message: 'Financial markets data coming soon',
      markets: []
    });
  }
}
