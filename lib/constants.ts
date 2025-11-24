// Currency constants
export const CURRENCIES = [
  { value: 'EUR', label: '€ EUR - Euro', symbol: '€' },
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
  { value: 'USD', label: '$ USD - US Dollar', symbol: '$' },
  { value: 'MAD', label: 'MAD - Moroccan Dirham', symbol: 'MAD' },
] as const;

export const DEFAULT_CURRENCY = 'EUR';

export type CurrencyCode = typeof CURRENCIES[number]['value'];

// Helper to get currency symbol
export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.value === code);
  return currency?.symbol || code;
}

// Helper to format currency
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
