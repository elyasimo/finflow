"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  ScanFace,
  Fingerprint,
  ChevronRight,
  Smartphone
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FinflowLogo } from "@/components/icons/finflow-logo"
import { useAuth } from "@/hooks/use-auth"
import { useBiometric } from "@/hooks/use-biometric"

interface MobileLoginPageProps {
  onRegister?: () => void
  onForgotPassword?: () => void
}

export default function MobileLoginPage({ 
  onRegister, 
  onForgotPassword 
}: MobileLoginPageProps) {
  const router = useRouter()
  const { login, isLoginLoading, loginError } = useAuth()
  const { 
    isAvailable: biometricAvailable, 
    biometryType, 
    isNative,
    isInitialized: biometricInitialized,
    isAuthenticating,
    authenticate, 
    getCredentials,
    saveCredentials,
    getBiometryLabel,
    hapticFeedback,
  } = useBiometric()
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Biometric state
  const [showBiometricSetup, setShowBiometricSetup] = useState(false)
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false)
  const [biometricChecked, setBiometricChecked] = useState(false)
  const [biometricsEnabledSetting, setBiometricsEnabledSetting] = useState(false)
  
  // Check biometrics enabled setting from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSetting = localStorage.getItem('biometricsEnabled')
      setBiometricsEnabledSetting(savedSetting === 'true')
    }
  }, [])
  
  // Check for saved biometric credentials on mount - retry until native is ready
  useEffect(() => {
    const checkBiometricCredentials = async () => {
      // Debug log
      console.log('🔐 Biometric check:', { 
        biometricAvailable, 
        isNative, 
        biometricInitialized,
        hasSavedCredentials 
      })
      
      // Wait until biometric is initialized
      if (!biometricInitialized) {
        console.log('🔐 Waiting for biometric initialization...')
        return
      }
      
      if (biometricAvailable && isNative) {
        try {
          const credentials = await getCredentials()
          console.log('🔐 Credentials found:', !!credentials)
          setHasSavedCredentials(!!credentials)
        } catch (err) {
          console.error('🔐 Credentials check error:', err)
          setHasSavedCredentials(false)
        }
        setBiometricChecked(true)
      } else {
        // Not a native app or biometric not available, mark as checked
        setBiometricChecked(true)
      }
    }
    checkBiometricCredentials()
  }, [biometricAvailable, isNative, biometricInitialized, getCredentials])

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Password validation - inline feedback
  const passwordValidation = {
    hasMinLength: password.length >= 8,
    isNotEmpty: password.length > 0
  }

  // Biometric login
  const handleBiometricLogin = async () => {
    try {
      const credentials = await getCredentials()
      if (!credentials) {
        setError('Keine gespeicherten Anmeldedaten gefunden. Bitte melden Sie sich mit E-Mail und Passwort an.')
        return
      }
      
      const success = await authenticate(`Anmelden mit ${getBiometryLabel()}`)
      if (success) {
        await hapticFeedback('success')
        setIsSubmitting(true)
        login(
          { email: credentials.username, password: credentials.password },
          {
            onSuccess: () => {
              router.push('/dashboard')
            },
            onError: (error: any) => {
              setError(error?.message || 'Anmeldung fehlgeschlagen')
              setIsSubmitting(false)
            }
          }
        )
      }
    } catch (err) {
      await hapticFeedback('error')
      setError('Biometrische Authentifizierung fehlgeschlagen')
    }
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!isValidEmail(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
      return
    }
    
    if (!passwordValidation.hasMinLength) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein')
      return
    }
    
    await hapticFeedback('light')
    setIsSubmitting(true)
    
    login(
      { email, password },
      {
        onSuccess: async () => {
          // Debug: Log biometric state
          console.log('🔐 Login success - Biometric state:', {
            biometricAvailable,
            isNative,
            biometricInitialized,
            hasSavedCredentials,
            biometricsEnabledSetting,
            shouldShowSetup: biometricInitialized && biometricAvailable && isNative && !hasSavedCredentials
          })
          
          // Auto-save credentials if biometrics is enabled in settings but credentials not saved yet
          if (biometricInitialized && biometricAvailable && isNative && biometricsEnabledSetting && !hasSavedCredentials) {
            console.log('🔐 Auto-saving credentials because biometrics is enabled in settings')
            const saved = await saveCredentials(email, password)
            if (saved) {
              await hapticFeedback('success')
              console.log('🔐 Credentials saved successfully')
            }
            router.push('/dashboard')
            return
          }
          
          // Offer to save credentials for biometric if not enabled yet
          if (biometricInitialized && biometricAvailable && isNative && !hasSavedCredentials && !biometricsEnabledSetting) {
            setShowBiometricSetup(true)
          } else {
            router.push('/dashboard')
          }
        },
        onError: (error: any) => {
          setError(error?.message || 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.')
          setIsSubmitting(false)
        }
      }
    )
  }

  // Save biometric credentials
  const handleSaveBiometric = async () => {
    await hapticFeedback('medium')
    const saved = await saveCredentials(email, password)
    if (saved) {
      await hapticFeedback('success')
    }
    setShowBiometricSetup(false)
    router.push('/dashboard')
  }

  const handleSkipBiometric = () => {
    setShowBiometricSetup(false)
    router.push('/dashboard')
  }

  // Get biometric icon
  const BiometricIcon = biometryType === 'face' ? ScanFace : Fingerprint

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1419] via-[#1a2332] to-[#0f1419] flex flex-col safe-area-inset">
      {/* Header with Logo */}
      <div className="px-6 pt-16 pb-8 flex-shrink-0">
        <div className="flex justify-center mb-8">
          <FinflowLogo size="lg" variant="full" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Willkommen zurück
          </h1>
          <p className="text-gray-400 text-base">
            Melden Sie sich an, um fortzufahren
          </p>
        </div>
      </div>

      {/* Main Content - A4 Fix: Scrollable with safe area padding */}
      <div className="flex-1 px-6 py-8 pb-[100px] overflow-y-auto overscroll-contain">
        {/* Face ID Quick Login - Show when credentials are saved OR biometrics enabled but need setup */}
        {biometricAvailable && isNative && (hasSavedCredentials || biometricsEnabledSetting) && (
          <div className="mb-8">
            {hasSavedCredentials ? (
              <button
                onClick={handleBiometricLogin}
                disabled={isAuthenticating}
                className={cn(
                  "w-full py-5 rounded-2xl font-semibold text-lg",
                  "bg-gradient-to-r from-emerald-500 to-teal-600",
                  "text-white shadow-xl shadow-emerald-500/30",
                  "hover:shadow-emerald-500/40 active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all flex items-center justify-center gap-3"
                )}
                aria-label={`Mit ${getBiometryLabel()} anmelden`}
              >
                {isAuthenticating ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <BiometricIcon className="w-7 h-7" />
                )}
                <span>Mit {getBiometryLabel()} anmelden</span>
              </button>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <BiometricIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {getBiometryLabel()} einrichten
                    </p>
                    <p className="text-xs text-gray-400">
                      Melden Sie sich einmal mit E-Mail an, um {getBiometryLabel()} zu aktivieren
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Divider - only show if Face ID button is available */}
            {hasSavedCredentials && (
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1a2332] text-gray-500">
                  oder mit E-Mail
                </span>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-Mail-Adresse
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                placeholder="name@beispiel.ch"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-4 py-4 rounded-2xl text-base",
                  "bg-[#232e40] text-white placeholder-gray-500",
                  "border-2 transition-all",
                  email && !isValidEmail(email) 
                    ? "border-rose-500/50" 
                    : email && isValidEmail(email)
                    ? "border-emerald-500/50"
                    : "border-transparent",
                  "focus:outline-none focus:border-blue-500"
                )}
                autoComplete="email"
                autoCapitalize="off"
                aria-label="E-Mail-Adresse"
              />
            </div>
            {email && !isValidEmail(email) && (
              <p className="text-xs text-rose-400 mt-1.5 ml-1">
                Bitte geben Sie eine gültige E-Mail ein
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Passwort
              </label>
              <button
                type="button"
                onClick={() => onForgotPassword?.() || router.push('/forgot-password')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Passwort vergessen?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mindestens 8 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-12 py-4 rounded-2xl text-base",
                  "bg-[#232e40] text-white placeholder-gray-500",
                  "border-2 transition-all",
                  password && !passwordValidation.hasMinLength
                    ? "border-rose-500/50"
                    : password && passwordValidation.hasMinLength
                    ? "border-emerald-500/50"
                    : "border-transparent",
                  "focus:outline-none focus:border-blue-500"
                )}
                autoComplete="current-password"
                aria-label="Passwort"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && !passwordValidation.hasMinLength && (
              <p className="text-xs text-rose-400 mt-1.5 ml-1">
                Das Passwort muss mindestens 8 Zeichen lang sein
              </p>
            )}
          </div>

          {/* Error Message */}
          {(error || loginError) && (
            <div className="flex items-center gap-2 p-4 bg-rose-950/40 rounded-2xl border border-rose-500/30">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-300">
                {error || (loginError instanceof Error ? loginError.message : 'Anmeldung fehlgeschlagen')}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoginLoading || !isValidEmail(email) || !passwordValidation.hasMinLength}
            className={cn(
              "w-full py-4 rounded-2xl font-semibold text-lg",
              "bg-blue-500 text-white",
              "shadow-xl shadow-blue-500/30",
              "hover:bg-blue-600 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all flex items-center justify-center gap-2"
            )}
          >
            {(isSubmitting || isLoginLoading) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Anmelden...</span>
              </>
            ) : (
              <>
                <span>Anmelden</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Noch kein Konto?{' '}
            <button
              onClick={() => onRegister?.() || router.push('/register')}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Jetzt registrieren
            </button>
          </p>
        </div>

        {/* Biometric Setup Hint (if available but not set up) */}
        {biometricInitialized && biometricAvailable && isNative && !hasSavedCredentials && (
          <div className="mt-8 p-4 bg-[#232e40] rounded-2xl border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <BiometricIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {getBiometryLabel()} verfügbar
                </p>
                <p className="text-xs text-gray-400">
                  Nach der Anmeldung können Sie {getBiometryLabel()} aktivieren
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Info - nur in Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-800 rounded-xl text-xs text-gray-400 font-mono">
            <p>🔐 Debug: initialized={String(biometricInitialized)}</p>
            <p>available={String(biometricAvailable)}</p>
            <p>isNative={String(isNative)}</p>
            <p>hasCreds={String(hasSavedCredentials)}</p>
            <p>type={biometryType}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 pt-4">
        <p className="text-center text-xs text-gray-500">
          Mit der Anmeldung stimmen Sie unseren{' '}
          <span className="text-blue-400">Nutzungsbedingungen</span>{' '}
          und der{' '}
          <span className="text-blue-400">Datenschutzerklärung</span>{' '}
          zu.
        </p>
      </div>

      {/* Biometric Setup Modal */}
      {showBiometricSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleSkipBiometric}
          />
          <div className="relative bg-[#1a2332] rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-gray-700 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <BiometricIcon className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {getBiometryLabel()} aktivieren?
              </h3>
              <p className="text-gray-400">
                Melden Sie sich beim nächsten Mal schneller und sicherer an
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleSaveBiometric}
                className={cn(
                  "w-full py-4 rounded-2xl font-semibold",
                  "bg-emerald-500 text-white",
                  "shadow-lg shadow-emerald-500/30",
                  "hover:bg-emerald-600 active:scale-[0.98]",
                  "transition-all flex items-center justify-center gap-2"
                )}
              >
                <BiometricIcon className="w-5 h-5" />
                Ja, {getBiometryLabel()} aktivieren
              </button>
              
              <button
                onClick={handleSkipBiometric}
                className="w-full py-4 rounded-2xl font-medium text-gray-400 hover:text-white transition-colors"
              >
                Später
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
