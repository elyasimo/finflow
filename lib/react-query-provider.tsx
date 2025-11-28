'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface ReactQueryProviderProps {
  children: ReactNode;
}

export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Create a new QueryClient instance for each session
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Default options for all queries
        staleTime: 5 * 60 * 1000, // 5 minutes - increased for better mobile experience
        gcTime: 30 * 60 * 1000, // 30 minutes cache time (formerly cacheTime)
        refetchOnWindowFocus: true, // Refetch when app comes to foreground
        refetchOnReconnect: true, // Refetch when network reconnects
        retry: 2, // Retry twice on failure
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
