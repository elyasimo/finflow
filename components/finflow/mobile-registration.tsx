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
import { useLanguage } from "@/lib/i18n/LanguageContext"

/**
 * Registration Flow Steps:
 * 1. contact - Email + Phone input
 * 2. password - Name + Password setup
 * 3. email-verification - Email 6-digit PIN verification
 * 4. phone-verification - SMS OTP verification (Mock for now)
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
  const { t } = useLanguage()
  
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

  // API Calls - Send 6-digit PIN via Email (Gmail SMTP)
  const sendEmailOtp = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('📧 Sending OTP to:', email)
      
      // Call backend API to send 6-digit PIN via Gmail
      const response = await authApi.sendEmailOtp(email)
      
      console.log('📧 OTP Response:', response)
      
      // Backend returns otp_id and expires_at on success
      if (response.otp_id || response.success) {
        console.log('✅ OTP sent successfully, moving to verification step')
        setEmailOtpId(response.otp_id || `email_${Date.now()}`)
        setEmailResendCooldown(OTP_COOLDOWN)
        return true
      } else {
        console.error('❌ OTP send failed:', response)
        setError(response.message || response.error || 'Fehler beim Senden des E-Mail-Codes')
        return false
      }
    } catch (err: any) {
      console.error('❌ OTP send error:', err)
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Fehler beim Senden des E-Mail-Codes')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resendEmailVerification = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Resend via backend
      const response = await authApi.sendEmailOtp(email)
      if (response.otp_id || response.success) {
        setEmailOtpId(response.otp_id || `email_${Date.now()}`)
        setEmailResendCooldown(OTP_COOLDOWN)
        return true
      }
      setError(response.message || response.error || 'Fehler beim erneuten Senden')
      return false
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Fehler beim erneuten Senden')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const sendPhoneOtp = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Mock for phone OTP until we integrate SMS provider
      const response = await authApi.sendPhoneOtp(phone)
      
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
    
    try {
      setIsLoading(true)
      setError('')
      
      // Verify 6-digit PIN via backend
      if (code.length !== 6) {
        setError('Bitte geben Sie den 6-stelligen Code ein')
        return false
      }
      
      const response = await authApi.verifyEmailOtp(email, code)
      
      if (response.success) {
        return true
      } else {
        setError(response.message || 'Ungültiger Code')
        return false
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ungültiger Code')
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
      
      // Mock verification for phone OTP
      const response = await authApi.verifyPhoneOtp(phone, code)
      
      if (response.verified) {
        return true
      } else {
        setError('Ungültiger Code')
        return false
      }
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
          {t('createAccount')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('needEmailAndPhoneForVerification')}
        </p>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('emailAddress')} *
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder={t('emailPlaceholder')}
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
            aria-label={t('emailAddress')}
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
          {t('phoneNumber')} *
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            placeholder={t('phonePlaceholder')}
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
            aria-label={t('phoneNumber')}
            autoComplete="tel"
          />
          {phone && isValidPhone(phone) && (
            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {t('forSmsVerification')}
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
            {t('continueBtn')}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Login Link */}
      {onLogin && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t('alreadyHaveAccount')}{' '}
          <button 
            onClick={onLogin}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            {t('signIn')}
          </button>
        </p>
      )}

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <Lock className="w-4 h-4" />
        <span>{t('dataEncrypted')}</span>
      </div>
    </div>
  )

  const renderPasswordStep = () => {
    const strength = getPasswordStrength(password)
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500']
    const strengthLabels = [t('veryWeak'), t('weak'), t('medium'), t('good'), t('strong'), t('veryStrong')]
    
    return (
      <div className="animate-fade-in space-y-6">
        <button
          onClick={() => setStep('contact')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('back')}
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('yourProfile')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('createSecureAccount')}
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('fullNameLabel')} *
          </label>
          <input
            type="text"
            placeholder={t('fullNamePlaceholder')}
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
            {t('passwordField')} *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t('passwordPlaceholder')}
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
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
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
                {strengthLabels[strength - 1] || t('veryWeak')}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('confirmPassword')} *
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t('repeatPassword')}
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
                ? `✓ ${t('passwordsMatch')}` 
                : `✗ ${t('passwordsNotMatch')}`}
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
              {t('continueBtn')}
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
        {t('back')}
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('verifyEmail')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('verificationCodeSent')}<br />
          <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
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
            aria-label={`${t('enterCode')} ${index + 1}`}
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
            {t('verifyCode')}
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
          ? `${t('resendIn')} ${emailResendCooldown}s`
          : t('resendCode')}
      </button>

      {/* Step indicator */}
      <p className="text-center text-sm text-gray-400">
        {t('step')} 1 {t('of')} 2 • {t('smsVerificationNext')}
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
        {t('back')}
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('verifyPhone')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('smsCodeSent')}<br />
          <span className="font-medium text-gray-700 dark:text-gray-300">{phone}</span>
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
            aria-label={`${t('enterCode')} ${index + 1}`}
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
            {t('verifyCode')}
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
          ? `${t('resendIn')} ${phoneResendCooldown}s`
          : t('resendSms')}
      </button>

      {/* Step indicator */}
      <p className="text-center text-sm text-gray-400">
        {t('step')} 2 {t('of')} 2 • {t('almostDone')}
      </p>
    </div>
  )

  const renderVerifiedStep = () => (
    <div className="animate-fade-in text-center py-12">
      <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-6 animate-bounce">
        <CheckCircle2 className="w-14 h-14 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('verificationSuccess')}
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        {t('emailAndPhoneVerified')}<br />
        {t('letsSetupFirstAccount')}
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
          {t('setupFirstAccount')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('linkYourBankAccount')}
        </p>
      </div>

      {/* Bank Selection */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('bank')} *
        </label>
        <input
          type="text"
          placeholder={t('bankPlaceholder')}
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
          {t('accountType')} *
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
          {t('displayName')} *
        </label>
        <input
          type="text"
          placeholder={t('displayNamePlaceholder')}
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
          IBAN <span className="text-gray-400">({t('optional')})</span>
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
            {t('createAccountBtn')}
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
          {t('setupLater')}
        </button>
      )}

      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <Lock className="w-4 h-4" />
        <span>{t('bankDataEncrypted')}</span>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="animate-fade-in text-center py-12">
      <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-14 h-14 text-purple-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('allSetUp')}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {t('accountCreatedSuccess')}<br />
        {t('welcomeToFinflow')}
      </p>
      <div className="w-16 h-16 mx-auto">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
      </div>
      <p className="text-sm text-gray-400 mt-4">{t('redirectingToDashboard')}</p>
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
      <div 
        className="flex-1 px-5 py-6 pb-[280px] overflow-y-auto overscroll-contain scroll-smooth"
        onClick={(e) => {
          // Only blur if clicking on the container itself, not on inputs
          if (e.target === e.currentTarget) {
            (document.activeElement as HTMLElement)?.blur()
          }
        }}
      >
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
