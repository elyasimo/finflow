import axios, { AxiosInstance } from 'axios';

/**
 * Alpha Vantage Service
 * Free stock quotes API
 * Docs: https://www.alphavantage.co/documentation/
 */

export interface AlphaVantageQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

export class AlphaVantageService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_KEY || '';
    
    this.client = axios.create({
      baseURL: process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query',
      timeout: 10000,
    });
  }

  /**
   * Get latest quote for a symbol
   */
  async getQuote(symbol: string): Promise<AlphaVantageQuote> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey,
        },
      });

      if (response.data['Error Message']) {
        throw new Error(`Invalid symbol: ${symbol}`);
      }

      if (response.data['Note']) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      const quote = response.data['Global Quote'];
      if (!quote || !quote['01. symbol']) {
        throw new Error(`No data available for ${symbol}`);
      }

      return quote;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch quote: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get multiple quotes (with rate limiting consideration)
   * Alpha Vantage free tier: 5 API requests per minute, 500 per day
   */
  async getQuotes(symbols: string[]): Promise<Map<string, AlphaVantageQuote>> {
    const quotes = new Map<string, AlphaVantageQuote>();
    
    // Process in batches with delays to respect rate limits
    const batchSize = 5;
    const delayBetweenBatches = 60000; // 1 minute

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const quote = await this.getQuote(symbol);
          return { symbol, quote };
        } catch (error) {
          console.error(`Error fetching quote for ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(batchPromises);
      
      results.forEach((result) => {
        if (result && result.quote) {
          quotes.set(result.symbol, result.quote);
        }
      });

      // Wait between batches (except for the last batch)
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return quotes;
  }

  /**
   * Search for symbols
   */
  async searchSymbols(keywords: string): Promise<any[]> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: keywords,
          apikey: this.apiKey,
        },
      });

      return response.data.bestMatches || [];
    } catch (error) {
      console.error('Symbol search error:', error);
      return [];
    }
  }
}
