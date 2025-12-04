'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileRegistration from '@/components/finflow/mobile-registration';

interface RegistrationData {
  email: string
  phone: string
  password: string
  fullName: string
  account?: {
    bankName: string
    accountType: string
    displayName: string
    iban?: string
  }
}

export default function RegisterMobilePage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleRegistrationComplete = async (data: RegistrationData) => {
    try {
      setError('');
      // Registration is handled inside the MobileRegistration component
      // Just redirect to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registrierung fehlgeschlagen');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <MobileRegistration 
      onComplete={handleRegistrationComplete}
      onSkip={handleSkip}
      onLogin={handleLogin}
    />
  );
}
