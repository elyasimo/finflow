import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';

const CurrencyContext = createContext<{
  currency: string;
  setCurrency: (currency: string) => void;
  updateCurrencyInBackend: (currency: string) => Promise<void>;
}>({
  currency: 'CHF', // Default to CHF instead of EUR
  setCurrency: () => {},
  updateCurrencyInBackend: async () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currency, setCurrencyState] = useState('CHF'); // Default to CHF instead of EUR
  const [hasInitialized, setHasInitialized] = useState(false);

  // Force refresh profile on first mount to ensure we have fresh data
  useEffect(() => {
    if (!hasInitialized) {
      console.log('🔄 CurrencyContext - Force refreshing profile on mount');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setHasInitialized(true);
    }
  }, [hasInitialized, queryClient]);

  // Debug: Log user object when it changes
  useEffect(() => {
    console.log('🔍 CurrencyContext - User changed:', {
      user: user ? {
        id: user.id,
        email: user.email,
        defaultCurrency: user.defaultCurrency
      } : null,
      userLoading,
      currentCurrency: currency
    });
  }, [user, userLoading, currency]);

  // Synchronisiere mit User-Daten - IMMER wenn sich user.defaultCurrency ändert
  useEffect(() => {
    // Support both camelCase and snake_case
    const userDefaultCurrency = user?.defaultCurrency || (user as any)?.default_currency;
    
    if (userDefaultCurrency) {
      console.log(`💱 CurrencyContext - Updating currency from ${currency} to ${userDefaultCurrency}`);
      setCurrencyState(userDefaultCurrency);
    } else if (user && !userDefaultCurrency) {
      console.warn('⚠️ CurrencyContext - User loaded but no defaultCurrency!', user);
      // Fallback to CHF if user exists but no currency set
      console.log('🔄 CurrencyContext - Falling back to CHF');
      setCurrencyState('CHF');
    } else if (!user && !userLoading) {
      console.log('👤 CurrencyContext - No user loaded, keeping default EUR');
    }
  }, [user, userLoading, currency]);

  // Funktion zum Aktualisieren der Währung im Backend
  const updateCurrencyInBackend = async (newCurrency: string) => {
    // Update local state FIRST - synchronously!
    console.log(`Updating currency from ${currency} to ${newCurrency}`);
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
      
      // Invalidiere alle React Query Caches, damit Daten neu geladen werden
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      // WICHTIG: Invalidiere auch Exchange Rates damit neue Kurse geladen werden
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
      
      console.log(`Currency changed to ${newCurrency} - all queries invalidated`);
    } catch (error) {
      console.error('Currency update error:', error);
      throw error;
    }
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, updateCurrencyInBackend }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  
  const { user } = useAuth();
  
  // CRITICAL FIX: If user is loaded and has defaultCurrency, use it directly!
  // This prevents race conditions where currency is EUR while user is loading
  if (user?.defaultCurrency && context.currency !== user.defaultCurrency) {
    console.log(`🚨 useCurrency() - Context has ${context.currency} but user has ${user.defaultCurrency}! Using user's currency.`);
    return {
      ...context,
      currency: user.defaultCurrency
    };
  }
  
  return context;
} 