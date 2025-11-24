import axios from 'axios';
import { createHmac } from 'crypto';

interface OrderResult {
  success: boolean;
  orderId?: string;
  executedQty?: string;
  executedPrice?: string;
  status?: string;
  error?: string;
}

interface Balance {
  asset: string;
  free: string;
  locked: string;
}

interface PriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
}

export class BinanceTradingService {
  private apiKey: string;
  private apiSecret: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY || '';
    this.apiSecret = process.env.BINANCE_API_SECRET || '';
    const useTestnet = process.env.BINANCE_USE_TESTNET === 'true';
    this.baseURL = useTestnet
      ? process.env.BINANCE_API_TESTNET_BASE || 'https://testnet.binance.vision'
      : process.env.BINANCE_API_BASE || 'https://api.binance.com';
  }

  private sign(queryString: string): string {
    return createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  private async signedRequest(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<any> {
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
      timestamp: String(timestamp),
    });

    const signature = this.sign(queryParams.toString());
    queryParams.append('signature', signature);

    const url = `${this.baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await axios({
      method,
      url,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    });

    return response.data;
  }

  /**
   * Get account balances
   */
  async getBalances(): Promise<Balance[]> {
    const account = await this.signedRequest('GET', '/api/v3/account');
    return account.balances.filter(
      (b: Balance) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: string): Promise<number> {
    const response = await axios.get(
      `${this.baseURL}/api/v3/ticker/price?symbol=${symbol}`
    );
    return parseFloat(response.data.price);
  }

  /**
   * Get prices for multiple symbols
   */
  async getPrices(assets: string[], quoteCurrency: string = 'EUR'): Promise<Map<string, PriceData>> {
    // For EUR, we need to use USDT as intermediate and convert
    // because not all coins have EUR pairs
    if (quoteCurrency === 'EUR') {
      return this.getPricesViaUSDT(assets);
    }

    const symbols = assets.map(a => `${a}${quoteCurrency}`);
    const symbolsParam = encodeURIComponent(JSON.stringify(symbols));

    const response = await axios.get(
      `${this.baseURL}/api/v3/ticker/24hr?symbols=${symbolsParam}`
    );

    const priceMap = new Map<string, PriceData>();
    response.data.forEach((ticker: any) => {
      const asset = ticker.symbol.replace(quoteCurrency, '');
      priceMap.set(asset, {
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        priceChange24h: parseFloat(ticker.priceChangePercent),
      });
    });

    return priceMap;
  }

  /**
   * Get prices via USDT pairs and convert to EUR
   */
  private async getPricesViaUSDT(assets: string[]): Promise<Map<string, PriceData>> {
    try {
      // Get EURUSDT rate first
      const eurUsdtResponse = await axios.get(
        `${this.baseURL}/api/v3/ticker/24hr?symbol=EURUSDT`
      );
      const eurRate = parseFloat(eurUsdtResponse.data.lastPrice);

      // Get all available USDT pairs - Binance will return only valid pairs
      const symbols = assets.map(a => `${a}USDT`);
      const symbolsParam = encodeURIComponent(JSON.stringify(symbols));

      try {
        const response = await axios.get(
          `${this.baseURL}/api/v3/ticker/24hr?symbols=${symbolsParam}`
        );

        const priceMap = new Map<string, PriceData>();
        response.data.forEach((ticker: any) => {
          const asset = ticker.symbol.replace('USDT', '');
          const usdtPrice = parseFloat(ticker.lastPrice);
          const eurPrice = usdtPrice / eurRate; // Convert USDT to EUR

          priceMap.set(asset, {
            symbol: ticker.symbol,
            price: eurPrice,
            priceChange24h: parseFloat(ticker.priceChangePercent),
          });
        });

        return priceMap;
      } catch (error: any) {
        // If bulk request fails with invalid symbols, fetch valid pairs only
        console.log('Fetching prices individually for valid pairs...');
        const priceMap = new Map<string, PriceData>();
        
        // Fetch in smaller batches to avoid rate limits
        const batchSize = 10;
        for (let i = 0; i < assets.length; i += batchSize) {
          const batch = assets.slice(i, i + batchSize);
          
          for (const asset of batch) {
            try {
              const response = await axios.get(
                `${this.baseURL}/api/v3/ticker/24hr?symbol=${asset}USDT`
              );
              
              const usdtPrice = parseFloat(response.data.lastPrice);
              const eurPrice = usdtPrice / eurRate;

              priceMap.set(asset, {
                symbol: `${asset}USDT`,
                price: eurPrice,
                priceChange24h: parseFloat(response.data.priceChangePercent),
              });
            } catch (assetError) {
              // Skip assets without USDT pairs
              console.log(`No USDT pair for ${asset}`);
            }
          }
          
          // Small delay to avoid rate limiting
          if (i + batchSize < assets.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        return priceMap;
      }
    } catch (error) {
      console.error('Error fetching prices via USDT:', error);
      throw error;
    }
  }

  /**
   * Get minimum order quantity for a symbol
   */
  async getMinOrderQty(symbol: string): Promise<{ minQty: number; stepSize: number; minNotional: number }> {
    const response = await axios.get(`${this.baseURL}/api/v3/exchangeInfo?symbol=${symbol}`);
    const symbolInfo = response.data.symbols[0];

    let minQty = 0;
    let stepSize = 0;
    let minNotional = 10; // default

    for (const filter of symbolInfo.filters) {
      if (filter.filterType === 'LOT_SIZE') {
        minQty = parseFloat(filter.minQty);
        stepSize = parseFloat(filter.stepSize);
      }
      if (filter.filterType === 'NOTIONAL') {
        minNotional = parseFloat(filter.minNotional);
      }
    }

    return { minQty, stepSize, minNotional };
  }

  /**
   * Round quantity to valid step size
   */
  private roundToStepSize(quantity: number, stepSize: number): number {
    const precision = Math.max(0, -Math.floor(Math.log10(stepSize)));
    return Math.floor(quantity / stepSize) * stepSize;
  }

  /**
   * Place a market buy order
   */
  async marketBuy(asset: string, quoteCurrency: string, amountInQuote: number): Promise<OrderResult> {
    const symbol = `${asset}${quoteCurrency}`;

    try {
      // Get current price to calculate quantity
      const price = await this.getPrice(symbol);
      const { minQty, stepSize, minNotional } = await this.getMinOrderQty(symbol);

      // Check minimum notional
      if (amountInQuote < minNotional) {
        return {
          success: false,
          error: `Order value ${amountInQuote} ${quoteCurrency} is below minimum ${minNotional} ${quoteCurrency}`,
        };
      }

      // Calculate and round quantity
      let quantity = amountInQuote / price;
      quantity = this.roundToStepSize(quantity, stepSize);

      if (quantity < minQty) {
        return {
          success: false,
          error: `Calculated quantity ${quantity} is below minimum ${minQty}`,
        };
      }

      const result = await this.signedRequest('POST', '/api/v3/order', {
        symbol,
        side: 'BUY',
        type: 'MARKET',
        quantity: quantity.toFixed(8),
      });

      return {
        success: true,
        orderId: result.orderId.toString(),
        executedQty: result.executedQty,
        executedPrice: result.fills?.[0]?.price || String(price),
        status: result.status,
      };
    } catch (error: any) {
      console.error('Market buy error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message,
      };
    }
  }

  /**
   * Place a market sell order
   */
  async marketSell(asset: string, quoteCurrency: string, quantity: number): Promise<OrderResult> {
    const symbol = `${asset}${quoteCurrency}`;

    try {
      const { minQty, stepSize, minNotional } = await this.getMinOrderQty(symbol);
      const price = await this.getPrice(symbol);

      // Round quantity to step size
      quantity = this.roundToStepSize(quantity, stepSize);

      // Check minimum quantity
      if (quantity < minQty) {
        return {
          success: false,
          error: `Quantity ${quantity} is below minimum ${minQty}`,
        };
      }

      // Check minimum notional
      const notionalValue = quantity * price;
      if (notionalValue < minNotional) {
        return {
          success: false,
          error: `Order value ${notionalValue.toFixed(2)} ${quoteCurrency} is below minimum ${minNotional} ${quoteCurrency}`,
        };
      }

      const result = await this.signedRequest('POST', '/api/v3/order', {
        symbol,
        side: 'SELL',
        type: 'MARKET',
        quantity: quantity.toFixed(8),
      });

      return {
        success: true,
        orderId: result.orderId.toString(),
        executedQty: result.executedQty,
        executedPrice: result.fills?.[0]?.price || String(price),
        status: result.status,
      };
    } catch (error: any) {
      console.error('Market sell error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message,
      };
    }
  }

  /**
   * Sell a percentage of holdings
   */
  async sellPercentage(asset: string, quoteCurrency: string, percentage: number): Promise<OrderResult> {
    try {
      const balances = await this.getBalances();
      const balance = balances.find(b => b.asset === asset);

      if (!balance || parseFloat(balance.free) === 0) {
        return {
          success: false,
          error: `No ${asset} balance available`,
        };
      }

      const quantity = parseFloat(balance.free) * (percentage / 100);
      return this.marketSell(asset, quoteCurrency, quantity);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if API credentials are valid
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.signedRequest('GET', '/api/v3/account');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const binanceTradingService = new BinanceTradingService();
