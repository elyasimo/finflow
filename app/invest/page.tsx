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
  const { markets, isLoading, error } = useMarkets();

  // Mobile: Revolut-Style Investment-Seite
  if (isMobile) {
    return (
      <MobileInvest
        stocks={markets?.stocks || []}
        etfs={[]} // TODO: Add ETFs hook
        indices={markets?.indices || []}
        commodities={markets?.commodities || []}
        bonds={[]} // TODO: Add bonds hook
        news={[]} // TODO: Add news hook
        corporateActions={[]} // TODO: Add corporate actions hook
        isLoading={isLoading}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // Desktop: Redirect zu Markets
  useEffect(() => {
    if (!isMobile) {
      router.replace('/markets?tab=stocks');
    }
  }, [isMobile, router]);

  return (
    <Layout user={user}>
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Redirecting to Markets...</p>
      </div>
    </Layout>
  );
}
