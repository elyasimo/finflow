'use client';

import { useAuth } from './use-auth';
import { DEFAULT_CURRENCY } from '@/lib/constants';

/**
 * Hook to get the user's default currency
 * Falls back to EUR if not set
 */
export function useCurrency() {
  const { user } = useAuth();
  
  const currency = user?.defaultCurrency || DEFAULT_CURRENCY;
  
  return {
    currency,
    isLoading: !user,
  };
}
