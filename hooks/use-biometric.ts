'use client';

import { useState, useEffect, useCallback } from 'react';
import { biometricService, BiometricAvailability } from '@/lib/biometric-service';

export function useBiometric() {
  const [availability, setAvailability] = useState<BiometricAvailability>({
    available: false,
    biometryType: 'none',
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const result = await biometricService.isAvailable();
    setAvailability(result);
  };

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await biometricService.authenticate(reason);
      
      if (!result.success) {
        setError(result.error || 'Authentication failed');
        return false;
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const saveCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    return biometricService.saveCredentials(username, password);
  }, []);

  const getCredentials = useCallback(async () => {
    return biometricService.getCredentials();
  }, []);

  const deleteCredentials = useCallback(async (): Promise<boolean> => {
    return biometricService.deleteCredentials();
  }, []);

  const hapticFeedback = useCallback(async (style: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    await biometricService.hapticFeedback(style);
  }, []);

  return {
    // Availability info
    isAvailable: availability.available,
    biometryType: availability.biometryType, // 'face' | 'fingerprint' | 'none'
    isNative: biometricService.isNativeApp(),
    
    // State
    isAuthenticating,
    error,
    
    // Actions
    authenticate,
    saveCredentials,
    getCredentials,
    deleteCredentials,
    hapticFeedback,
    
    // Helpers
    getBiometryLabel: () => {
      switch (availability.biometryType) {
        case 'face':
          return 'Face ID';
        case 'fingerprint':
          return 'Touch ID';
        default:
          return 'Biometric';
      }
    },
  };
}
