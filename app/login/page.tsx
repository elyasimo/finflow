'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBiometric } from '@/hooks/use-biometric';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Fingerprint, ScanFace } from 'lucide-react';
import { FinflowLogo } from '@/components/icons/finflow-logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const { login, isLoginLoading, loginError } = useAuth();
  const { 
    isAvailable: biometricAvailable, 
    biometryType, 
    isNative,
    isAuthenticating,
    authenticate, 
    getCredentials,
    saveCredentials,
    getBiometryLabel,
    hapticFeedback,
  } = useBiometric();

  // Try biometric login on mount if available
  useEffect(() => {
    if (biometricAvailable && isNative) {
      tryBiometricLogin();
    }
  }, [biometricAvailable, isNative]);

  const tryBiometricLogin = async () => {
    const credentials = await getCredentials();
    if (credentials) {
      const success = await authenticate('Anmelden mit ' + getBiometryLabel());
      if (success) {
        await hapticFeedback('success');
        login({ email: credentials.username, password: credentials.password });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await hapticFeedback('light');
    
    // After successful login, offer to save credentials for biometric
    login({ email, password }, {
      onSuccess: () => {
        if (biometricAvailable && isNative) {
          setShowBiometricSetup(true);
        }
      }
    });
  };

  const handleSaveBiometric = async () => {
    await hapticFeedback('medium');
    const saved = await saveCredentials(email, password);
    if (saved) {
      await hapticFeedback('success');
    }
    setShowBiometricSetup(false);
  };

  const BiometricIcon = biometryType === 'face' ? ScanFace : Fingerprint;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <FinflowLogo size="lg" variant="full" />
          </div>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your email and password to login to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {loginError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {loginError instanceof Error ? loginError.message : 'Failed to login. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Biometric Login Button */}
            {biometricAvailable && isNative && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-16 border-2 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10"
                onClick={tryBiometricLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <BiometricIcon className="mr-3 h-6 w-6 text-emerald-500" />
                )}
                <span className="text-base">
                  Mit {getBiometryLabel()} anmelden
                </span>
              </Button>
            )}

            {biometricAvailable && isNative && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    oder mit E-Mail
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Biometric Setup Dialog */}
      {showBiometricSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-emerald-500/10">
                  <BiometricIcon className="h-12 w-12 text-emerald-500" />
                </div>
              </div>
              <CardTitle className="text-center">{getBiometryLabel()} aktivieren?</CardTitle>
              <CardDescription className="text-center">
                Melden Sie sich beim nächsten Mal schneller und sicherer an
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
              <Button onClick={handleSaveBiometric} className="w-full">
                Ja, {getBiometryLabel()} aktivieren
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowBiometricSetup(false)}
                className="w-full"
              >
                Später
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
