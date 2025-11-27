'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import MobileOnboarding from '@/components/finflow/mobile-onboarding';
import { accountsApi } from '@/lib/api';

interface OnboardingData {
  contactType: 'email' | 'phone'
  contact: string
  password?: string
  fullName?: string
  account: {
    bankName: string
    accountType: string
    displayName: string
    iban?: string
  }
}

export default function RegisterMobilePage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [error, setError] = useState('');

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      setError('');
      
      // Register the user if not already authenticated
      if (!isAuthenticated && data.password) {
        await register({
          email: data.contact,
          password: data.password,
          fullName: data.fullName || data.contact.split('@')[0],
        });
      }
      
      // Create the first bank account
      try {
        await accountsApi.create({
          name: data.account.displayName,
          type: data.account.accountType,
          balance: 0,
          currency: 'CHF',
          // @ts-ignore - add bank info to notes or custom field
          bankName: data.account.bankName,
        });
      } catch (accountError) {
        console.error('Account creation error (non-fatal):', accountError);
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registrierung fehlgeschlagen');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  return (
    <MobileOnboarding 
      onComplete={handleOnboardingComplete}
      onSkip={handleSkip}
    />
  );
}
