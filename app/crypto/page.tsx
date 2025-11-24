"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CryptocurrencyPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /markets with crypto tab
    router.replace('/markets');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirecting to Markets...</p>
    </div>
  );
}
