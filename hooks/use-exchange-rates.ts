'use client';

import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '@/lib/api';
import { useCurrency } from '@/components/finflow/CurrencyContext';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: string;
}

/**
 * Hook to get exchange rates and convert currencies
 */
export function useExchangeRates() {
  const { currency: baseCurrency } = useCurrency();

  // Fetch exchange rates
  const { data, isLoading, error } = useQuery<ExchangeRates>({
    queryKey: ['exchangeRates', baseCurrency],
    queryFn: async () => {
      console.log(`Fetching exchange rates for base currency: ${baseCurrency}`);
      const result = await currencyApi.getExchangeRates(baseCurrency);
      console.log(`Exchange rates loaded:`, result);
      return result;
    },
    staleTime: 3600000, // 1 hour
    gcTime: 7200000, // 2 hours
  });

  /**
   * Convert amount from one currency to another
   */
  const convert = (amount: number, fromCurrency: string, toCurrency?: string): number => {
    // Use baseCurrency if toCurrency not specified
    const targetCurrency = toCurrency || baseCurrency;
    
    // Same currency, no conversion needed
    if (fromCurrency === targetCurrency) {
      return amount;
    }

    // No rates available yet
    if (!data?.rates) {
      console.warn('Exchange rates not loaded yet');
      return amount;
    }

    try {
      // Die API gibt uns Rates mit baseCurrency als Ausgangspunkt
      // z.B. wenn baseCurrency=EUR: { USD: 1.09, CHF: 0.95, ... }
      // Das bedeutet: 1 EUR = 1.09 USD, 1 EUR = 0.95 CHF
      
      // If converting from base currency
      if (fromCurrency === baseCurrency) {
        const rate = data.rates[targetCurrency];
        if (!rate) {
          console.warn(`No rate found for ${baseCurrency} -> ${targetCurrency}`);
          return amount;
        }
        const result = amount * rate;
        console.log(`Convert ${amount} ${fromCurrency} -> ${result.toFixed(2)} ${targetCurrency} (rate: ${rate})`);
        return result;
      }

      // If converting to base currency
      if (targetCurrency === baseCurrency) {
        const rate = data.rates[fromCurrency];
        if (!rate) {
          console.warn(`No rate found for ${fromCurrency} -> ${baseCurrency}`);
          return amount;
        }
        const result = amount / rate;
        console.log(`Convert ${amount} ${fromCurrency} -> ${result.toFixed(2)} ${targetCurrency} (rate: 1/${rate})`);
        return result;
      }

      // Converting between two non-base currencies
      // Step 1: Convert from source to base
      // Step 2: Convert from base to target
      const rateFrom = data.rates[fromCurrency];
      const rateTo = data.rates[targetCurrency];
      
      if (!rateFrom || !rateTo) {
        console.warn(`Missing rates for conversion ${fromCurrency} -> ${targetCurrency}`);
        return amount;
      }
      
      // First to base, then to target
      const inBase = amount / rateFrom;
      const result = inBase * rateTo;
      console.log(`Convert ${amount} ${fromCurrency} -> ${result.toFixed(2)} ${targetCurrency} (via ${baseCurrency})`);
      return result;
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount;
    }
  };

  /**
   * Format amount with currency symbol
   */
  const formatAmount = (amount: number, currency?: string, locale: string = 'de-DE'): string => {
    const targetCurrency = currency || baseCurrency;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
    }).format(amount);
  };

  /**
   * Convert and format in one step
   */
  const convertAndFormat = (
    amount: number,
    fromCurrency: string,
    toCurrency?: string,
    locale?: string
  ): string => {
    const targetCurrency = toCurrency || baseCurrency;
    const converted = convert(amount, fromCurrency, targetCurrency);
    return formatAmount(converted, targetCurrency, locale);
  };

  return {
    rates: data?.rates || {},
    baseCurrency,
    isLoading,
    error,
    convert,
    formatAmount,
    convertAndFormat,
  };
}
