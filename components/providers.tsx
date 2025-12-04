'use client';

import { ReactNode, useState, useEffect } from 'react';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import dynamic from 'next/dynamic';

// Dynamically import the splash to avoid SSR issues with Capacitor
const AnimatedSplash = dynamic(() => import('./animated-splash'), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor native app
    const checkNative = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        const native = Capacitor.isNativePlatform();
        setIsNative(native);
        
        // Initialize push notifications for native apps
        if (native) {
          const { pushNotificationService } = await import('@/lib/push-notification-service');
          await pushNotificationService.initialize();
        }
      } catch {
        setIsNative(false);
      }
    };
    checkNative();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <LanguageProvider>
      {isNative && showSplash && (
        <AnimatedSplash onComplete={handleSplashComplete} minDuration={2500} />
      )}
      {children}
    </LanguageProvider>
  );
}
