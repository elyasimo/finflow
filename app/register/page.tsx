'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { FinflowLogo } from '@/components/icons/finflow-logo';
import { useMediaQuery } from '@/hooks/use-mobile';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isRegisterLoading, registerError } = useAuth();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    match: password === confirmPassword && confirmPassword.length > 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordChecks.length) {
      setPasswordError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    if (!passwordChecks.match) {
      setPasswordError('Passwörter stimmen nicht überein');
      return;
    }

    register({ email, password, fullName });
  };

  // Redirect to mobile onboarding if on mobile
  if (isMobile) {
    router.push('/register/mobile');
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <FinflowLogo size="lg" variant="full" />
          </div>
          <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
          <CardDescription>Geben Sie Ihre Daten ein, um ein Konto zu erstellen</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {registerError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {registerError instanceof Error ? registerError.message : 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Vollständiger Name</Label>
              <Input
                id="fullName"
                placeholder="Max Mustermann"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="flex items-center gap-2 text-xs mt-1">
                  {passwordChecks.length ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )}
                  <span className={passwordChecks.length ? "text-green-600" : "text-gray-500"}>
                    Mindestens 8 Zeichen
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-2 text-xs mt-1">
                  {passwordChecks.match ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )}
                  <span className={passwordChecks.match ? "text-green-600" : "text-red-500"}>
                    {passwordChecks.match ? "Passwörter stimmen überein" : "Passwörter stimmen nicht überein"}
                  </span>
                </div>
              )}
            </div>
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isRegisterLoading || !passwordChecks.length || !passwordChecks.match}
            >
              {isRegisterLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Registrieren
            </Button>
            <div className="text-center text-sm">
              Bereits ein Konto?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Anmelden
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
