"use client"

import { useState, useRef, useEffect } from "react"
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
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FinflowLogo } from "@/components/icons/finflow-logo"
import { useKeyboard } from "@/hooks/use-keyboard"

type OnboardingStep = 'contact' | 'password' | 'verification' | 'verified' | 'account-setup' | 'complete'

interface MobileOnboardingProps {
  onComplete: (data: OnboardingData) => void
  onSkip?: () => void
}

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

// Popular banks for autocomplete
const popularBanks = [
  'UBS',
  'Credit Suisse',
  'Raiffeisen',
  'PostFinance',
  'Zürcher Kantonalbank',
  'Migros Bank',
  'Bank Cler',
  'Swissquote',
  'Revolut',
  'N26',
  'Andere',
]

// Account types
const accountTypes = [
  { id: 'checking', name: 'Girokonto', icon: Wallet, description: 'Für tägliche Ausgaben' },
  { id: 'savings', name: 'Sparkonto', icon: PiggyBank, description: 'Für Rücklagen' },
  { id: 'credit', name: 'Kreditkarte', icon: CreditCard, description: 'Kreditkartenabrechnung' },
]

export default function MobileOnboarding({ onComplete, onSkip }: MobileOnboardingProps) {
  const keyboard = useKeyboard()
  const [step, setStep] = useState<OnboardingStep>('contact')
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [contact, setContact] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Account setup state
  const [bankName, setBankName] = useState('')
  const [showBankSuggestions, setShowBankSuggestions] = useState(false)
  const [accountType, setAccountType] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [iban, setIban] = useState('')
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Filter banks based on input
  const filteredBanks = popularBanks.filter(bank => 
    bank.toLowerCase().includes(bankName.toLowerCase())
  )

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      const nextIndex = Math.min(index + digits.length, 5)
      otpRefs.current[nextIndex]?.focus()
    } else {
      const newOtp = [...otp]
      newOtp[index] = value.replace(/\D/g, '')
      setOtp(newOtp)
      
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.every(digit => digit !== '')) {
      handleVerifyOtp()
    }
  }, [otp])

  const handleSendCode = async () => {
    if (!contact) {
      setError('Bitte geben Sie Ihre ' + (contactType === 'email' ? 'E-Mail' : 'Telefonnummer') + ' ein')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    setStep('password')
  }

  const handlePasswordSubmit = async () => {
    if (!fullName.trim()) {
      setError('Bitte geben Sie Ihren Namen ein')
      return
    }
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    // Simulate sending verification code
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    setStep('verification')
  }

  const handleVerifyOtp = async () => {
    const code = otp.join('')
    if (code.length !== 6) return
    
    setIsLoading(true)
    setError('')
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // For demo, accept any 6-digit code
    setIsLoading(false)
    setStep('verified')
    
    // Auto-proceed to account setup after showing success
    setTimeout(() => {
      setStep('account-setup')
    }, 2000)
  }

  const handleCreateAccount = async () => {
    if (!bankName || !accountType || !displayName) {
      setError('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    // Simulate account creation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setStep('complete')
    
    // Call onComplete after animation
    setTimeout(() => {
      onComplete({
        contactType,
        contact,
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
  }

  const renderContactStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Willkommen bei FinFlow
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Registrieren Sie sich mit Ihrer E-Mail
        </p>
      </div>

      {/* Input Field */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          E-Mail-Adresse
        </label>
        <input
          type="email"
          placeholder="name@beispiel.ch"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-transparent focus:border-blue-500"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-500 mb-4 text-center">{error}</p>
      )}

      {/* Continue Button */}
      <button
        onClick={handleSendCode}
        disabled={isLoading || !contact}
        className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-400">
        <Shield className="w-4 h-4" />
        <span>Ihre Daten werden sicher verschlüsselt</span>
      </div>
    </div>
  )

  const renderPasswordStep = () => (
    <div className="animate-fade-in">
      <button
        onClick={() => setStep('contact')}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-6 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
          <User className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Konto erstellen
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Geben Sie Ihre Daten ein
        </p>
      </div>

      {/* Full Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Vollständiger Name
        </label>
        <input
          type="text"
          placeholder="Max Mustermann"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent focus:border-indigo-500"
        />
      </div>

      {/* Password */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Passwort
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 pr-12 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {password && (
          <p className={cn(
            "text-xs mt-2",
            password.length >= 8 ? "text-emerald-500" : "text-gray-400"
          )}>
            {password.length >= 8 ? "✓" : "○"} Mindestens 8 Zeichen
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Passwort bestätigen
        </label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent focus:border-indigo-500"
        />
        {confirmPassword && (
          <p className={cn(
            "text-xs mt-2",
            password === confirmPassword ? "text-emerald-500" : "text-rose-500"
          )}>
            {password === confirmPassword ? "✓ Passwörter stimmen überein" : "✗ Passwörter stimmen nicht überein"}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-rose-500 mb-4 text-center">{error}</p>
      )}

      {/* Continue Button */}
      <button
        onClick={handlePasswordSubmit}
        disabled={isLoading || !fullName || password.length < 8 || password !== confirmPassword}
        className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-semibold text-lg shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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

  const renderVerificationStep = () => (
    <div className="animate-fade-in">
      <button
        onClick={() => setStep('password')}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-6 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Code eingeben
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Wir haben einen 6-stelligen Code an<br />
          <span className="font-medium text-gray-700 dark:text-gray-300">{contact}</span>
          <br />gesendet
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-3 mb-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { otpRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={(e) => {
              e.preventDefault()
              const pasted = e.clipboardData.getData('text')
              handleOtpChange(index, pasted)
            }}
            className={cn(
              "w-12 h-14 rounded-xl text-center text-2xl font-bold",
              "bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white",
              "border-2 transition-all focus:outline-none",
              digit ? "border-blue-500" : "border-transparent",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            )}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-rose-500 mb-4 text-center">{error}</p>
      )}

      {/* Verify Button */}
      <button
        onClick={handleVerifyOtp}
        disabled={isLoading || otp.some(d => !d)}
        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
      <button className="w-full py-3 mt-4 text-blue-500 font-medium hover:text-blue-600 transition-colors">
        Code erneut senden
      </button>
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
        Ihr Konto wurde bestätigt. Lassen Sie uns jetzt Ihr erstes Bankkonto einrichten.
      </p>
    </div>
  )

  const renderAccountSetupStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Erstes Konto einrichten
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Verknüpfen Sie Ihr Bankkonto, um loszulegen
        </p>
      </div>

      {/* Bank Name with Autocomplete */}
      <div className="mb-5 relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bankname *
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
          className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-transparent focus:border-purple-500"
        />
        
        {/* Bank Suggestions Dropdown */}
        {showBankSuggestions && bankName && filteredBanks.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#232e40] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10 max-h-48 overflow-y-auto">
            {filteredBanks.map((bank) => (
              <button
                key={bank}
                onClick={() => {
                  setBankName(bank)
                  setShowBankSuggestions(false)
                }}
                className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332] flex items-center gap-3"
              >
                <Building2 className="w-5 h-5 text-gray-400" />
                {bank}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account Type */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kontotyp *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {accountTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setAccountType(type.id)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                  accountType === type.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#232e40] hover:border-gray-200 dark:hover:border-gray-700"
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
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Anzeigename *
        </label>
        <input
          type="text"
          placeholder="z.B. Hauptkonto, Sparkonto"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-transparent focus:border-purple-500"
        />
      </div>

      {/* IBAN (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          IBAN <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="CH00 0000 0000 0000 0000 0"
          value={iban}
          onChange={(e) => setIban(e.target.value.toUpperCase())}
          className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-transparent focus:border-purple-500"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-500 mb-4 text-center">{error}</p>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreateAccount}
        disabled={isLoading || !bankName || !accountType || !displayName}
        className="w-full py-4 rounded-2xl bg-purple-500 text-white font-semibold text-lg shadow-lg shadow-purple-500/30 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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

      {/* Skip Option */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full py-3 mt-4 text-gray-400 font-medium hover:text-gray-600 transition-colors"
        >
          Später einrichten
        </button>
      )}

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-400">
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
        Ihr Konto wurde erfolgreich erstellt. Willkommen bei FinFlow!
      </p>
      <div className="w-16 h-16 mx-auto">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
      </div>
      <p className="text-sm text-gray-400 mt-4">Weiterleitung zum Dashboard...</p>
    </div>
  )

  return (
    <div 
      className="bg-white dark:bg-[#0f1419] flex flex-col"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex justify-center">
          <FinflowLogo size="md" variant="full" />
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-center gap-2">
          {['contact', 'password', 'verification', 'account-setup'].map((s, idx) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                "w-6",
                step === 'contact' && idx === 0 ? "bg-blue-500" :
                step === 'password' && idx <= 1 ? "bg-indigo-500" :
                step === 'verification' && idx <= 2 ? "bg-emerald-500" :
                step === 'verified' && idx <= 2 ? "bg-emerald-500" :
                (step === 'account-setup' || step === 'complete') ? "bg-purple-500" :
                "bg-gray-200 dark:bg-gray-800"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content - Keyboard-aware scrolling */}
      <div 
        className="flex-1 px-5 py-6 overflow-y-auto transition-all duration-200"
        style={{
          paddingBottom: keyboard.height > 0 ? `${keyboard.height + 40}px` : '120px',
        }}
      >
        {step === 'contact' && renderContactStep()}
        {step === 'password' && renderPasswordStep()}
        {step === 'verification' && renderVerificationStep()}
        {step === 'verified' && renderVerifiedStep()}
        {step === 'account-setup' && renderAccountSetupStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </div>
  )
}
