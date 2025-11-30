"use client";

import { useMarkets } from '@/hooks/use-markets';
import MobileInvest from '@/components/finflow/mobile-invest';

export default function InvestPage() {
  const { markets, isLoading } = useMarkets();

  // Immer Revolut-Style Investment-Seite anzeigen
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
