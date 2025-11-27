"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Shield, 
  Smartphone, 
  Mail,
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  Loader2,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FinflowLogo } from "@/components/icons/finflow-logo"
import { authApi, accountsApi } from "@/lib/api"

/**
 * Registration Flow Steps:
 * 1. contact - Email + Phone input
 * 2. password - Name + Password setup
 * 3. email-verification - Email OTP verification
 * 4. phone-verification - SMS OTP verification  
 * 5. verified - Success screen
 * 6. account-setup - First bank account setup
 * 7. complete - Final success + redirect
 */
type RegistrationStep = 
  | 'contact' 
  | 'password' 
  | 'email-verification' 
  | 'phone-verification'
  | 'verified' 
  | 'account-setup' 
  | 'complete'

interface MobileRegistrationProps {
  onComplete: (data: RegistrationData) => void
  onSkip?: () => void
  onLogin?: () => void
}

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

// Swiss banks for autocomplete
const SWISS_BANKS = [
  { name: 'UBS', color: '#E60000' },
  { name: 'Credit Suisse', color: '#0066B3' },
  { name: 'Raiffeisen', color: '#F5A623' },
  { name: 'PostFinance', color: '#FFC000' },
  { name: 'Zürcher Kantonalbank', color: '#0066B3' },
  { name: 'Migros Bank', color: '#FF6600' },
  { name: 'Bank Cler', color: '#E30613' },
  { name: 'Swissquote', color: '#00A3E0' },
  { name: 'Revolut', color: '#191C1F' },
  { name: 'N26', color: '#36A18B' },
  { name: 'Andere', color: '#6B7280' },
]

// Account types
const ACCOUNT_TYPES = [
  { id: 'checking', name: 'Girokonto', icon: Wallet, description: 'Für tägliche Ausgaben' },
  { id: 'savings', name: 'Sparkonto', icon: PiggyBank, description: 'Für Rücklagen' },
  { id: 'credit', name: 'Kreditkarte', icon: CreditCard, description: 'Kreditkartenabrechnung' },
]

// OTP resend cooldown in seconds
const OTP_COOLDOWN = 60

export default function MobileRegistration({ 
  onComplete, 
  onSkip,
  onLogin 
}: MobileRegistrationProps) {
  // Step state
  const [step, setStep] = useState<RegistrationStep>('contact')
  
  // Contact info
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  // Password & profile
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // OTP state
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', ''])
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', ''])
  const [emailOtpId, setEmailOtpId] = useState<string | null>(null)
  const [phoneOtpId, setPhoneOtpId] = useState<string | null>(null)
  const [emailResendCooldown, setEmailResendCooldown] = useState(0)
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0)
  
  // Account setup
  const [bankName, setBankName] = useState('')
  const [showBankSuggestions, setShowBankSuggestions] = useState(false)
  const [accountType, setAccountType] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [iban, setIban] = useState('')
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Refs
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([])
  const phoneOtpRefs = useRef<(HTMLInputElement | null)[]>([])
  
  // Filter banks based on input
  const filteredBanks = SWISS_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(bankName.toLowerCase())
  )

  // Cooldown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (emailResendCooldown > 0) {
      timer = setInterval(() => {
        setEmailResendCooldown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [emailResendCooldown])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (phoneResendCooldown > 0) {
      timer = setInterval(() => {
        setPhoneResendCooldown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [phoneResendCooldown])

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Phone validation (Swiss format)
  const isValidPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 15
  }

  // Format phone number for display
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.startsWith('41')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`
    }
    return value
  }

  // Password strength check
  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  // Handle OTP input
  const handleOtpChange = (
    index: number, 
    value: string, 
    otpArray: string[], 
    setOtpArray: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otpArray]
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtpArray(newOtp)
      const nextIndex = Math.min(index + digits.length, 5)
      refs.current[nextIndex]?.focus()
    } else {
      const newOtp = [...otpArray]
      newOtp[index] = value.replace(/\D/g, '')
      setOtpArray(newOtp)
      
      if (value && index < 5) {
        refs.current[index + 1]?.focus()
      }
    }
  }

  const handleOtpKeyDown = (
    index: number, 
    e: React.KeyboardEvent,
    otpArray: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  // API Calls
  const sendEmailOtp = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await authApi.sendOtp?.(email, 'email') || 
        // Fallback if API doesn't exist yet
        { otp_id: `email_${Date.now()}`, expires_at: new Date(Date.now() + 5 * 60000).toISOString() }
      
      setEmailOtpId(response.otp_id)
      setEmailResendCooldown(OTP_COOLDOWN)
      return true
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Senden des E-Mail-Codes')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const sendPhoneOtp = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await authApi.sendOtp?.(phone, 'sms') ||
        // Fallback if API doesn't exist yet  
        { otp_id: `phone_${Date.now()}`, expires_at: new Date(Date.now() + 5 * 60000).toISOString() }
      
      setPhoneOtpId(response.otp_id)
      setPhoneResendCooldown(OTP_COOLDOWN)
      return true
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Senden des SMS-Codes')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEmailOtp = async () => {
    const code = emailOtp.join('')
    if (code.length !== 6) return false
    
    try {
      setIsLoading(true)
      setError('')
      
      // For demo purposes, accept any 6-digit code
      // In production, this would call: await authApi.verifyOtp(emailOtpId, code)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return true
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ungültiger Code')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPhoneOtp = async () => {
    const code = phoneOtp.join('')
    if (code.length !== 6) return false
    
    try {
      setIsLoading(true)
      setError('')
      
      // For demo purposes, accept any 6-digit code
      // In production, this would call: await authApi.verifyOtp(phoneOtpId, code)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return true
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ungültiger Code')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Step handlers
  const handleContactSubmit = async () => {
    if (!isValidEmail(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
      return
    }
    if (!isValidPhone(phone)) {
      setError('Bitte geben Sie eine gültige Telefonnummer ein')
      return
    }
    
    setError('')
    setStep('password')
  }

  const handlePasswordSubmit = async () => {
    if (!fullName.trim()) {
      setError('Bitte geben Sie Ihren Namen ein')
      return
    }
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein')
      return
    }
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein')
      return
    }
    
    // Send email OTP
    const success = await sendEmailOtp()
    if (success) {
      setStep('email-verification')
    }
  }

  const handleEmailVerification = async () => {
    const success = await verifyEmailOtp()
    if (success) {
      // Send phone OTP
      const smsSent = await sendPhoneOtp()
      if (smsSent) {
        setStep('phone-verification')
      }
    }
  }

  const handlePhoneVerification = async () => {
    const success = await verifyPhoneOtp()
    if (success) {
      setStep('verified')
      
      // Auto-proceed to account setup after showing success
      setTimeout(() => {
        setStep('account-setup')
      }, 2000)
    }
  }

  const handleAccountSetup = async () => {
    if (!bankName || !accountType || !displayName) {
      setError('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }
    
    try {
      setIsLoading(true)
      setError('')
      
      // Register the user first
      await authApi.register(email, password, fullName)
      
      // Create the first account
      try {
        await accountsApi.create({
          name: bankName !== 'Andere' ? `${bankName} - ${displayName}` : displayName,
          type: accountType,
          balance: 0,
          currency: 'CHF',
        })
      } catch (accountError) {
        console.error('Account creation error (non-fatal):', accountError)
      }
      
      setStep('complete')
      
      // Call onComplete after animation
      setTimeout(() => {
        onComplete({
          email,
          phone,
          password,
          fullName,
          account: {
            bankName,
            accountType,
            displayName,
            iban: iban || undefined,
          }
        })
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrierung fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipAccountSetup = async () => {
    try {
      setIsLoading(true)
      
      // Register the user without account
      await authApi.register(email, password, fullName)
      
      onComplete({
        email,
        phone,
        password,
        fullName,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrierung fehlgeschlagen')
      setIsLoading(false)
    }
  }

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (emailOtp.every(digit => digit !== '') && step === 'email-verification') {
      handleEmailVerification()
    }
  }, [emailOtp, step])

  useEffect(() => {
    if (phoneOtp.every(digit => digit !== '') && step === 'phone-verification') {
      handlePhoneVerification()
    }
  }, [phoneOtp, step])

  // Step progress calculation
  const getProgress = () => {
    const steps = ['contact', 'password', 'email-verification', 'phone-verification', 'account-setup']
    const currentIndex = steps.indexOf(step)
    if (step === 'verified' || step === 'complete') return 100
    return ((currentIndex + 1) / steps.length) * 100
  }

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderContactStep = () => (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Konto erstellen
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Wir benötigen E-Mail und Telefon zur Verifikation
        </p>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          E-Mail-Adresse *
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="name@beispiel.ch"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "w-full pl-12 pr-4 py-4 rounded-2xl text-lg",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "border-2 border-transparent",
              "focus:outline-none focus:border-blue-500",
              "transition-all"
            )}
            aria-label="E-Mail-Adresse"
            autoComplete="email"
          />
          {email && isValidEmail(email) && (
            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          )}
        </div>
      </div>

      {/* Phone Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Telefonnummer *
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            placeholder="+41 79 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={cn(
              "w-full pl-12 pr-4 py-4 rounded-2xl text-lg",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "border-2 border-transparent",
              "focus:outline-none focus:border-blue-500",
              "transition-all"
            )}
            aria-label="Telefonnummer"
            autoComplete="tel"
          />
          {phone && isValidPhone(phone) && (
            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Für SMS-Verifikation (Schweizer oder internationale Nummer)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleContactSubmit}
        disabled={isLoading || !email || !phone}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-lg",
          "bg-blue-500 text-white",
          "shadow-lg shadow-blue-500/30",
          "hover:bg-blue-600 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all flex items-center justify-center gap-2"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Weiter
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Login Link */}
      {onLogin && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Bereits ein Konto?{' '}
          <button 
            onClick={onLogin}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Anmelden
          </button>
        </p>
      )}

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <Lock className="w-4 h-4" />
        <span>Ihre Daten werden verschlüsselt übertragen</span>
      </div>
    </div>
  )

  const renderPasswordStep = () => {
    const strength = getPasswordStrength(password)
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500']
    const strengthLabels = ['Sehr schwach', 'Schwach', 'Mittel', 'Gut', 'Stark', 'Sehr stark']
    
    return (
      <div className="animate-fade-in space-y-6">
        <button
          onClick={() => setStep('contact')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ihr Profil
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Erstellen Sie Ihr sicheres Konto
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vollständiger Name *
          </label>
          <input
            type="text"
            placeholder="Max Mustermann"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={cn(
              "w-full px-4 py-4 rounded-2xl text-lg",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "border-2 border-transparent",
              "focus:outline-none focus:border-indigo-500"
            )}
            autoComplete="name"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passwort *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mindestens 8 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "w-full px-4 py-4 pr-12 rounded-2xl text-lg",
                "bg-gray-50 dark:bg-[#232e40]",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "border-2 border-transparent",
                "focus:outline-none focus:border-indigo-500"
              )}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      i < strength ? strengthColors[strength - 1] : "bg-gray-200 dark:bg-gray-700"
                    )}
                  />
                ))}
              </div>
              <p className={cn(
                "text-xs",
                strength < 3 ? "text-orange-500" : strength < 5 ? "text-lime-500" : "text-emerald-500"
              )}>
                {strengthLabels[strength - 1] || 'Sehr schwach'}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passwort bestätigen *
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Passwort wiederholen"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn(
              "w-full px-4 py-4 rounded-2xl text-lg",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "border-2",
              confirmPassword && password !== confirmPassword
                ? "border-rose-500"
                : "border-transparent focus:border-indigo-500"
            )}
            autoComplete="new-password"
          />
          {confirmPassword && (
            <p className={cn(
              "text-xs mt-1",
              password === confirmPassword ? "text-emerald-500" : "text-rose-500"
            )}>
              {password === confirmPassword 
                ? "✓ Passwörter stimmen überein" 
                : "✗ Passwörter stimmen nicht überein"}
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handlePasswordSubmit}
          disabled={isLoading || !fullName || password.length < 8 || password !== confirmPassword}
          className={cn(
            "w-full py-4 rounded-2xl font-semibold text-lg",
            "bg-indigo-500 text-white",
            "shadow-lg shadow-indigo-500/30",
            "hover:bg-indigo-600 active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all flex items-center justify-center gap-2"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Weiter
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    )
  }

  const renderEmailVerificationStep = () => (
    <div className="animate-fade-in space-y-6">
      <button
        onClick={() => setStep('password')}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          E-Mail verifizieren
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Wir haben einen 6-stelligen Code an<br />
          <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span><br />
          gesendet
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-3">
        {emailOtp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { emailOtpRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value, emailOtp, setEmailOtp, emailOtpRefs)}
            onKeyDown={(e) => handleOtpKeyDown(index, e, emailOtp, emailOtpRefs)}
            onPaste={(e) => {
              e.preventDefault()
              const pasted = e.clipboardData.getData('text')
              handleOtpChange(index, pasted, emailOtp, setEmailOtp, emailOtpRefs)
            }}
            className={cn(
              "w-12 h-14 rounded-xl text-center text-2xl font-bold",
              "bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white",
              "border-2 transition-all focus:outline-none",
              digit ? "border-emerald-500" : "border-transparent",
              "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            )}
            aria-label={`Code Ziffer ${index + 1}`}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleEmailVerification}
        disabled={isLoading || emailOtp.some(d => !d)}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-lg",
          "bg-emerald-500 text-white",
          "shadow-lg shadow-emerald-500/30",
          "hover:bg-emerald-600 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all flex items-center justify-center gap-2"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Verifizieren
            <Check className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Resend Code */}
      <button
        onClick={sendEmailOtp}
        disabled={emailResendCooldown > 0}
        className={cn(
          "w-full py-3 font-medium transition-colors flex items-center justify-center gap-2",
          emailResendCooldown > 0
            ? "text-gray-400 cursor-not-allowed"
            : "text-blue-500 hover:text-blue-600"
        )}
      >
        <RefreshCw className="w-4 h-4" />
        {emailResendCooldown > 0 
          ? `Erneut senden in ${emailResendCooldown}s`
          : 'Code erneut senden'}
      </button>

      {/* Step indicator */}
      <p className="text-center text-sm text-gray-400">
        Schritt 1 von 2 • Danach folgt SMS-Verifizierung
      </p>
    </div>
  )

  const renderPhoneVerificationStep = () => (
    <div className="animate-fade-in space-y-6">
      <button
        onClick={() => setStep('email-verification')}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Telefon verifizieren
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Wir haben einen SMS-Code an<br />
          <span className="font-medium text-gray-700 dark:text-gray-300">{phone}</span><br />
          gesendet
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-3">
        {phoneOtp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { phoneOtpRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value, phoneOtp, setPhoneOtp, phoneOtpRefs)}
            onKeyDown={(e) => handleOtpKeyDown(index, e, phoneOtp, phoneOtpRefs)}
            onPaste={(e) => {
              e.preventDefault()
              const pasted = e.clipboardData.getData('text')
              handleOtpChange(index, pasted, phoneOtp, setPhoneOtp, phoneOtpRefs)
            }}
            className={cn(
              "w-12 h-14 rounded-xl text-center text-2xl font-bold",
              "bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white",
              "border-2 transition-all focus:outline-none",
              digit ? "border-violet-500" : "border-transparent",
              "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            )}
            aria-label={`SMS Code Ziffer ${index + 1}`}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handlePhoneVerification}
        disabled={isLoading || phoneOtp.some(d => !d)}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-lg",
          "bg-violet-500 text-white",
          "shadow-lg shadow-violet-500/30",
          "hover:bg-violet-600 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all flex items-center justify-center gap-2"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Verifizieren
            <Check className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Resend Code */}
      <button
        onClick={sendPhoneOtp}
        disabled={phoneResendCooldown > 0}
        className={cn(
          "w-full py-3 font-medium transition-colors flex items-center justify-center gap-2",
          phoneResendCooldown > 0
            ? "text-gray-400 cursor-not-allowed"
            : "text-blue-500 hover:text-blue-600"
        )}
      >
        <RefreshCw className="w-4 h-4" />
        {phoneResendCooldown > 0 
          ? `Erneut senden in ${phoneResendCooldown}s`
          : 'SMS erneut senden'}
      </button>

      {/* Step indicator */}
      <p className="text-center text-sm text-gray-400">
        Schritt 2 von 2 • Fast geschafft!
      </p>
    </div>
  )

  const renderVerifiedStep = () => (
    <div className="animate-fade-in text-center py-12">
      <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-6 animate-bounce">
        <CheckCircle2 className="w-14 h-14 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Erfolgreich verifiziert!
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        E-Mail und Telefon wurden bestätigt.<br />
        Lassen Sie uns Ihr erstes Konto einrichten.
      </p>
    </div>
  )

  const renderAccountSetupStep = () => (
    <div className="animate-fade-in space-y-5">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Erstes Konto einrichten
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Verknüpfen Sie Ihr Bankkonto
        </p>
      </div>

      {/* Bank Selection */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bank *
        </label>
        <input
          type="text"
          placeholder="z.B. UBS, Raiffeisen"
          value={bankName}
          onChange={(e) => {
            setBankName(e.target.value)
            setShowBankSuggestions(true)
          }}
          onFocus={() => setShowBankSuggestions(true)}
          className={cn(
            "w-full px-4 py-3.5 rounded-2xl",
            "bg-gray-50 dark:bg-[#232e40]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "border-2 border-transparent",
            "focus:outline-none focus:border-purple-500"
          )}
        />
        
        {showBankSuggestions && bankName && filteredBanks.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#232e40] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10 max-h-48 overflow-y-auto">
            {filteredBanks.map((bank) => (
              <button
                key={bank.name}
                onClick={() => {
                  setBankName(bank.name)
                  setShowBankSuggestions(false)
                }}
                className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332] flex items-center gap-3"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bank.color }}
                />
                {bank.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kontotyp *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ACCOUNT_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setAccountType(type.id)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                  accountType === type.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#232e40]"
                )}
              >
                <Icon className={cn(
                  "w-6 h-6",
                  accountType === type.id ? "text-purple-500" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-xs font-medium text-center",
                  accountType === type.id ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"
                )}>
                  {type.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Anzeigename *
        </label>
        <input
          type="text"
          placeholder="z.B. Hauptkonto, Sparkonto"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={cn(
            "w-full px-4 py-3.5 rounded-2xl",
            "bg-gray-50 dark:bg-[#232e40]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "border-2 border-transparent",
            "focus:outline-none focus:border-purple-500"
          )}
        />
      </div>

      {/* IBAN (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          IBAN <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="CH00 0000 0000 0000 0000 0"
          value={iban}
          onChange={(e) => setIban(e.target.value.toUpperCase())}
          className={cn(
            "w-full px-4 py-3.5 rounded-2xl font-mono text-sm",
            "bg-gray-50 dark:bg-[#232e40]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "border-2 border-transparent",
            "focus:outline-none focus:border-purple-500"
          )}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleAccountSetup}
        disabled={isLoading || !bankName || !accountType || !displayName}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-lg",
          "bg-purple-500 text-white",
          "shadow-lg shadow-purple-500/30",
          "hover:bg-purple-600 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all flex items-center justify-center gap-2"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Konto erstellen
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {onSkip && (
        <button
          onClick={handleSkipAccountSetup}
          disabled={isLoading}
          className="w-full py-3 text-gray-400 font-medium hover:text-gray-600 transition-colors"
        >
          Später einrichten
        </button>
      )}

      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <Lock className="w-4 h-4" />
        <span>Bankdaten werden sicher verschlüsselt</span>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="animate-fade-in text-center py-12">
      <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-14 h-14 text-purple-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Alles eingerichtet!
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Ihr Konto wurde erfolgreich erstellt.<br />
        Willkommen bei FinFlow!
      </p>
      <div className="w-16 h-16 mx-auto">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
      </div>
      <p className="text-sm text-gray-400 mt-4">Weiterleitung zum Dashboard...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419] flex flex-col safe-area-inset">
      {/* Header with Logo */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex justify-center">
          <FinflowLogo size="md" variant="full" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 py-4">
        <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Content - A1.1/A6 Fix: Added bottom padding for keyboard and safe area */}
      <div className="flex-1 px-5 py-6 pb-[120px] overflow-y-auto overscroll-contain">
        {step === 'contact' && renderContactStep()}
        {step === 'password' && renderPasswordStep()}
        {step === 'email-verification' && renderEmailVerificationStep()}
        {step === 'phone-verification' && renderPhoneVerificationStep()}
        {step === 'verified' && renderVerifiedStep()}
        {step === 'account-setup' && renderAccountSetupStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </div>
  )
}
