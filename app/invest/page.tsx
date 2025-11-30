"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMarkets } from '@/hooks/use-markets';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileInvest from '@/components/finflow/mobile-invest';
import Layout from '@/components/finflow/layout';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function InvestPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { markets, isLoading } = useMarkets();

  // Desktop: Redirect zu Markets
  // WICHTIG: Hooks müssen VOR jedem Return aufgerufen werden!
  useEffect(() => {
    if (!isMobile) {
      router.replace('/markets?tab=stocks');
    }
  }, [isMobile, router]);

  // Mobile: Revolut-Style Investment-Seite
  if (isMobile) {
    return (
      <MobileInvest
        stocks={markets?.stocks || []}
        etfs={[]}
        indices={markets?.indices || []}
        commodities={markets?.commodities || []}
        bonds={[]}
        news={[]}
        corporateActions={[]}
        isLoading={isLoading}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // Desktop: Show loading while redirecting
  return (
    <Layout user={user}>
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Redirecting to Markets...</p>
      </div>
    </Layout>
  );
}
