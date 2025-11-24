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
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
