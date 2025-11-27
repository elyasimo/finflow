'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import MobileOnboarding from '@/components/finflow/mobile-onboarding';

interface OnboardingData {
  contactType: 'email' | 'phone'
  contact: string
  account: {
    bankName: string
    accountType: string
    displayName: string
    iban?: string
  }
}

export default function RegisterMobilePage() {
  const router = useRouter();
  const { register, isRegisterLoading } = useAuth();
  const [step, setStep] = useState<'onboarding' | 'complete'>('onboarding');

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      // In a real app, you would:
      // 1. Create user account with contact info
      // 2. Create the first bank account
      // 3. Navigate to dashboard
      
      // For now, we'll just navigate to the dashboard
      // The actual registration logic would integrate with your auth system
      
      console.log('Onboarding complete:', data);
      setStep('complete');
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleSkip = () => {
    // Skip account creation, just go to dashboard
    router.push('/dashboard');
  };

  return (
    <MobileOnboarding 
      onComplete={handleOnboardingComplete}
      onSkip={handleSkip}
    />
  );
}
