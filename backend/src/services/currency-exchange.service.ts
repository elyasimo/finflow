import axios from 'axios';

// Cache for exchange rates (valid for 1 hour)
interface RatesCache {
  rates: Record<string, number>;
  timestamp: number;
  baseCurrency: string;
}

let ratesCache: RatesCache | null = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export class CurrencyExchangeService {
  private static baseUrl = 'https://api.frankfurter.app';

  /**
   * Get latest exchange rates from Frankfurter API (European Central Bank)
   * @param baseCurrency Base currency (default: EUR)
   * @returns Exchange rates object
   */
  static async getExchangeRates(baseCurrency: string = 'EUR'): Promise<Record<string, number>> {
    try {
      // Check cache first
      const now = Date.now();
      if (ratesCache && 
          ratesCache.baseCurrency === baseCurrency && 
          now - ratesCache.timestamp < CACHE_DURATION) {
        console.log('Using cached exchange rates');
        return ratesCache.rates;
      }

      // Fetch fresh rates
      console.log(`Fetching exchange rates for base currency: ${baseCurrency}`);
      const response = await axios.get(`${this.baseUrl}/latest`, {
        params: {
          from: baseCurrency,
        },
        timeout: 5000,
      });

      const rates = response.data.rates;
      
      // Add base currency rate (always 1.0)
      rates[baseCurrency] = 1.0;

      // Update cache
      ratesCache = {
        rates,
        timestamp: now,
        baseCurrency,
      };

      console.log(`Exchange rates updated for ${baseCurrency}:`, rates);
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Return fallback rates if API fails
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Convert amount from one currency to another
   * @param amount Amount to convert
   * @param fromCurrency Source currency
   * @param toCurrency Target currency
   * @returns Converted amount
   */
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    // Same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      // Get rates with fromCurrency as base
      const rates = await this.getExchangeRates(fromCurrency);
      
      // Convert
      const rate = rates[toCurrency];
      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} -> ${toCurrency}`);
      }

      const convertedAmount = amount * rate;
      console.log(`Converted ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency} (rate: ${rate})`);
      
      return convertedAmount;
    } catch (error) {
      console.error('Currency conversion error:', error);
      // Return original amount if conversion fails
      return amount;
    }
  }

  /**
   * Get supported currencies
   */
  static async getSupportedCurrencies(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/currencies`, {
        timeout: 5000,
      });
      return Object.keys(response.data);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return ['EUR', 'USD', 'CHF', 'GBP', 'JPY', 'MAD', 'CAD', 'AUD'];
    }
  }

  /**
   * Fallback rates if API is unavailable
   * These are approximate rates and should be updated regularly
   */
  private static getFallbackRates(baseCurrency: string): Record<string, number> {
    // Approximate rates as of Nov 2024 (EUR as base)
    const eurRates: Record<string, number> = {
      EUR: 1.0,
      USD: 1.09,
      CHF: 0.95,
      GBP: 0.86,
      JPY: 163.5,
      MAD: 10.8,
      CAD: 1.48,
      AUD: 1.67,
    };

    // If base is EUR, return directly
    if (baseCurrency === 'EUR') {
      return eurRates;
    }

    // Convert all rates to new base
    const baseRate = eurRates[baseCurrency];
    if (!baseRate) {
      return eurRates; // Fallback to EUR
    }

    const convertedRates: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(eurRates)) {
      convertedRates[currency] = rate / baseRate;
    }

    return convertedRates;
  }

  /**
   * Clear the cache (useful for testing)
   */
  static clearCache(): void {
    ratesCache = null;
    console.log('Exchange rates cache cleared');
  }
}
