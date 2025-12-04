import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  updateCurrencyInBackend: (currency: string) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [currency, setCurrencyState] = useState('CHF');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get user profile using React Query directly (avoids hook dependency issues)
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Force refresh profile on first mount to ensure we have fresh data
  useEffect(() => {
    if (!hasInitialized) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setHasInitialized(true);
    }
  }, [hasInitialized, queryClient]);

  // Synchronize with user data when user.defaultCurrency changes
  useEffect(() => {
    if (userLoading) return;
    
    // Support both camelCase and snake_case
    const userDefaultCurrency = user?.defaultCurrency || (user as any)?.default_currency;
    
    if (userDefaultCurrency) {
      setCurrencyState(userDefaultCurrency);
    } else if (user && !userDefaultCurrency) {
      // Fallback to CHF if user exists but no currency set
      setCurrencyState('CHF');
    }
  }, [user, userLoading]);

  // Function to update currency in backend
  const updateCurrencyInBackend = useCallback(async (newCurrency: string) => {
    // Update local state FIRST - synchronously!
    setCurrencyState(newCurrency);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/auth/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ defaultCurrency: newCurrency }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update currency');
      }
      
      // Invalidate all React Query caches to reload data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
      
    } catch (error) {
      throw error;
    }
  }, [queryClient]);

  const setCurrency = useCallback((newCurrency: string) => {
    setCurrencyState(newCurrency);
  }, []);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    updateCurrencyInBackend,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  
  if (!context) {
    // Return safe defaults if used outside provider
    return {
      currency: 'CHF',
      setCurrency: () => {},
      updateCurrencyInBackend: async () => {},
    };
  }
  
  return context;
} 