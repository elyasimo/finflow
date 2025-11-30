"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCryptoMarkets } from '@/hooks/use-crypto-markets';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileCrypto from '@/components/finflow/mobile-crypto';
import Layout from '@/components/finflow/layout';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function CryptoPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { markets: cryptoMarkets, isLoading } = useCryptoMarkets();

  // Desktop: Redirect zu Markets mit Crypto-Tab
  // WICHTIG: Hooks müssen VOR jedem Return aufgerufen werden!
  useEffect(() => {
    if (!isMobile) {
      router.replace('/markets?tab=crypto');
    }
  }, [isMobile, router]);

  // Mobile: Revolut-Style Krypto-Seite
  if (isMobile) {
    return (
      <MobileCrypto
        cryptoMarkets={cryptoMarkets || []}
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
