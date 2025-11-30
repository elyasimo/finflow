"use client";

import { useCryptoMarkets } from '@/hooks/use-crypto-markets';
import MobileCrypto from '@/components/finflow/mobile-crypto';

export default function CryptoPage() {
  const { markets: cryptoMarkets, isLoading } = useCryptoMarkets();

  // Immer Revolut-Style Krypto-Seite anzeigen
  return (
    <MobileCrypto
      cryptoMarkets={cryptoMarkets || []}
      isLoading={isLoading}
      onRefresh={() => window.location.reload()}
    />
  );
}
