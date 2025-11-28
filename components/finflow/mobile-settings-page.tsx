"use client"

import { useState, useEffect } from "react"
import { 
  User,
  Mail,
  Lock,
  Globe,
  Moon,
  Sun,
  Bell,
  Shield,
  Fingerprint,
  ChevronRight,
  LogOut,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  Key,
  Palette,
  Languages,
  Wallet,
  ScanFace,
  Link2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Camera
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobilePageHeader from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"

// Types
interface UserProfile {
  id: string
  fullName?: string
  email: string
  phone?: string
  role?: 'user' | 'admin'
  isAdmin?: boolean
}

interface ApiKeys {
  binanceApiKey?: string
  binanceSecretKey?: string
  alpacaApiKey?: string
  alpacaSecretKey?: string
}

interface MobileSettingsPageProps {
  user?: UserProfile
  theme: string
  language: string
  currency: string
  emailNotifications?: boolean
  pushNotifications?: boolean
  biometricsEnabled?: boolean
  apiKeys?: ApiKeys
  onThemeChange: (theme: string) => void
  onLanguageChange: (language: string) => void
  onCurrencyChange: (currency: string) => void
  onEmailNotificationsChange?: (enabled: boolean) => Promise<void>
  onPushNotificationsChange?: (enabled: boolean) => Promise<void>
  onBiometricsChange?: (enabled: boolean) => Promise<void>
  onUpdateProfile: (data: { fullName?: string; email?: string }) => Promise<void>
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>
  onSaveApiKeys?: (keys: ApiKeys) => Promise<void>
  onLogout: () => void
  onDeleteAccount?: () => Promise<void>
}

// Available Languages
const LANGUAGES = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
]

// Available Currencies  
const CURRENCIES = [
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'MAD', label: 'Moroccan Dirham', symbol: 'MAD' },
]

// Theme Options
const THEMES = [
  { id: 'light', label: 'Hell', icon: Sun },
  { id: 'dark', label: 'Dunkel', icon: Moon },
  { id: 'system', label: 'System', icon: Smartphone },
]

// Settings Section Component
const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
      {title}
    </h3>
    <div className="bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
      {children}
    </div>
  </div>
)

// Settings Item Component - A5: Modern design with gradient icons
const SettingsItem = ({ 
  icon: Icon, 
  label, 
  value,
  onClick,
  showArrow = true,
  danger = false,
  accent = false,
  children 
}: { 
  icon: React.ElementType
  label: string
  value?: string
  onClick?: () => void
  showArrow?: boolean
  danger?: boolean
  accent?: boolean
  children?: React.ReactNode
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 w-full p-4 text-left",
      "hover:bg-gray-50 dark:hover:bg-[#232e40] active:bg-gray-100 dark:active:bg-[#2a3749]",
      "transition-all duration-150",
      onClick ? "cursor-pointer" : "cursor-default"
    )}
    aria-label={label}
  >
    <div className={cn(
      "w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm",
      danger 
        ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white" 
        : accent
        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
        : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#2a3749] dark:to-[#232e40] text-gray-600 dark:text-gray-400"
    )}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn(
        "font-semibold text-[15px]",
        danger ? "text-rose-500" : "text-gray-900 dark:text-white"
      )}>
        {label}
      </p>
      {value && (
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{value}</p>
      )}
    </div>
    {children}
    {showArrow && !children && (
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center">
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    )}
  </button>
)

// Toggle Switch Component - iOS-style toggle with green activation
const ToggleSwitch = ({ 
  enabled, 
  onChange,
  disabled = false 
}: { 
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={cn(
      "relative w-[51px] h-[31px] rounded-full transition-all duration-300 ease-in-out",
      enabled 
        ? "bg-[#34C759]" // iOS green
        : "bg-[#E5E5EA] dark:bg-[#39393D]",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    aria-label={enabled ? "Aktiviert" : "Deaktiviert"}
    role="switch"
    aria-checked={enabled}
  >
    <div className={cn(
      "absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-all duration-300 ease-in-out",
      enabled ? "translate-x-[22px]" : "translate-x-[2px]"
    )} 
    style={{ 
      boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.16)' 
    }}
    />
  </button>
)

export default function MobileSettingsPage({
  user,
  theme,
  language,
  currency,
  emailNotifications = true,
  pushNotifications = false,
  biometricsEnabled = false,
  apiKeys = {},
  onThemeChange,
  onLanguageChange,
  onCurrencyChange,
  onEmailNotificationsChange,
  onPushNotificationsChange,
  onBiometricsChange,
  onUpdateProfile,
  onChangePassword,
  onSaveApiKeys,
  onLogout,
  onDeleteAccount
}: MobileSettingsPageProps) {
  const { t } = useLanguage()
  const { setCurrency: setAppCurrency } = useCurrency()
  
  // UI State
  const [showProfileSheet, setShowProfileSheet] = useState(false)
  const [showPasswordSheet, setShowPasswordSheet] = useState(false)
  const [showThemeSheet, setShowThemeSheet] = useState(false)
  const [showLanguageSheet, setShowLanguageSheet] = useState(false)
  const [showCurrencySheet, setShowCurrencySheet] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showApiKeysSheet, setShowApiKeysSheet] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [apiKeysSaved, setApiKeysSaved] = useState(false)
  
  // Form State
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // API Keys State
  const [binanceApiKey, setBinanceApiKey] = useState(apiKeys.binanceApiKey || '')
  const [binanceSecretKey, setBinanceSecretKey] = useState(apiKeys.binanceSecretKey || '')
  const [alpacaApiKey, setAlpacaApiKey] = useState(apiKeys.alpacaApiKey || '')
  const [alpacaSecretKey, setAlpacaSecretKey] = useState(apiKeys.alpacaSecretKey || '')
  const [showBinanceSecret, setShowBinanceSecret] = useState(false)
  const [showAlpacaSecret, setShowAlpacaSecret] = useState(false)
  
  // Profile Picture State
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  
  // Firebase Config State
  // Notification State (local until saved)
  const [localEmailNotifications, setLocalEmailNotifications] = useState(emailNotifications)
  const [localPushNotifications, setLocalPushNotifications] = useState(pushNotifications)
  const [localBiometrics, setLocalBiometrics] = useState(biometricsEnabled)

  // Load profile picture from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPicture = localStorage.getItem('profilePicture')
      if (savedPicture) {
        setProfilePicture(savedPicture)
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setEmail(user.email || '')
    }
  }, [user])

  // Sync API keys from props when they change (e.g., after loading from server)
  useEffect(() => {
    if (apiKeys.binanceApiKey) setBinanceApiKey(apiKeys.binanceApiKey)
    if (apiKeys.binanceSecretKey) setBinanceSecretKey(apiKeys.binanceSecretKey)
    if (apiKeys.alpacaApiKey) setAlpacaApiKey(apiKeys.alpacaApiKey)
    if (apiKeys.alpacaSecretKey) setAlpacaSecretKey(apiKeys.alpacaSecretKey)
  }, [apiKeys])

  // Handlers
  const handleUpdateProfile = async () => {
    try {
      setIsSubmitting(true)
      setError('')
      await onUpdateProfile({ fullName, email })
      setShowProfileSheet(false)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren des Profils')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    if (!onChangePassword) return
    
    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }
    if (newPassword.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      await onChangePassword(currentPassword, newPassword)
      setShowPasswordSheet(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern des Passworts')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailNotificationsChange = async (enabled: boolean) => {
    setLocalEmailNotifications(enabled)
    if (onEmailNotificationsChange) {
      try {
        await onEmailNotificationsChange(enabled)
      } catch (err) {
        setLocalEmailNotifications(!enabled) // Rollback
      }
    }
  }

  const handlePushNotificationsChange = async (enabled: boolean) => {
    setLocalPushNotifications(enabled)
    if (onPushNotificationsChange) {
      try {
        await onPushNotificationsChange(enabled)
      } catch (err) {
        setLocalPushNotifications(!enabled) // Rollback
      }
    }
  }

  const handleBiometricsChange = async (enabled: boolean) => {
    setLocalBiometrics(enabled)
    if (onBiometricsChange) {
      try {
        await onBiometricsChange(enabled)
      } catch (err) {
        setLocalBiometrics(!enabled) // Rollback
      }
    }
  }

  const handleCurrencyChange = (newCurrency: string) => {
    onCurrencyChange(newCurrency)
    setAppCurrency(newCurrency)
    setShowCurrencySheet(false)
  }

  const handleSaveApiKeys = async () => {
    try {
      setIsSubmitting(true)
      setError('')
      
      if (onSaveApiKeys) {
        await onSaveApiKeys({
          binanceApiKey,
          binanceSecretKey,
          alpacaApiKey,
          alpacaSecretKey,
        })
      }
      
      setApiKeysSaved(true)
      setTimeout(() => {
        setApiKeysSaved(false)
        setShowApiKeysSheet(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern der API-Schlüssel')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!onDeleteAccount) return
    
    try {
      setIsSubmitting(true)
      await onDeleteAccount()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen des Kontos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentLanguage = () => {
    return LANGUAGES.find(l => l.code === language) || LANGUAGES[0]
  }

  const getCurrentCurrency = () => {
    return CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]
  }

  const getCurrentTheme = () => {
    return THEMES.find(t => t.id === theme) || THEMES[2]
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader 
        user={user as any} 
        title={t('settings')}
      />

      {/* User Card */}
      <div className="px-5 pt-4">
        <div 
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl cursor-pointer"
          onClick={() => setShowProfileSheet(true)}
        >
          <div className="flex items-center gap-4">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1">
              <p className="text-xl font-bold">{user?.fullName || 'Benutzer'}</p>
              <p className="text-blue-100 text-sm">{user?.email}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/50" />
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="px-5 py-6">
        {/* Appearance */}
        <SettingsSection title="Darstellung">
          <SettingsItem 
            icon={getCurrentTheme().icon} 
            label="Design"
            value={getCurrentTheme().label}
            onClick={() => setShowThemeSheet(true)}
          />
          <SettingsItem 
            icon={Languages} 
            label="Sprache"
            value={`${getCurrentLanguage().flag} ${getCurrentLanguage().label}`}
            onClick={() => setShowLanguageSheet(true)}
          />
          <SettingsItem 
            icon={Wallet} 
            label="Währung"
            value={`${getCurrentCurrency().symbol} ${getCurrentCurrency().label}`}
            onClick={() => setShowCurrencySheet(true)}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Benachrichtigungen">
          <SettingsItem 
            icon={Mail} 
            label="E-Mail Benachrichtigungen"
            showArrow={false}
          >
            <ToggleSwitch 
              enabled={localEmailNotifications} 
              onChange={handleEmailNotificationsChange}
            />
          </SettingsItem>
          <SettingsItem 
            icon={Bell} 
            label="Push-Benachrichtigungen"
            showArrow={false}
          >
            <ToggleSwitch 
              enabled={localPushNotifications} 
              onChange={handlePushNotificationsChange}
            />
          </SettingsItem>
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Sicherheit">
          <SettingsItem 
            icon={Lock} 
            label="Passwort ändern"
            onClick={() => setShowPasswordSheet(true)}
          />
          <SettingsItem 
            icon={ScanFace} 
            label="Face ID / Touch ID"
            showArrow={false}
          >
            <ToggleSwitch 
              enabled={localBiometrics} 
              onChange={handleBiometricsChange}
            />
          </SettingsItem>
        </SettingsSection>

        {/* API Keys & Integrations */}
        <SettingsSection title="Integrationen">
          <SettingsItem 
            icon={Key} 
            label="Trading API-Schlüssel"
            value={binanceApiKey || alpacaApiKey ? 'Konfiguriert' : 'Nicht konfiguriert'}
            onClick={() => setShowApiKeysSheet(true)}
            accent
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection title="Konto">
          <SettingsItem 
            icon={LogOut} 
            label="Abmelden"
            onClick={onLogout}
          />
          {onDeleteAccount && (
            <SettingsItem 
              icon={Trash2} 
              label="Konto löschen"
              danger
              onClick={() => setShowDeleteConfirm(true)}
            />
          )}
        </SettingsSection>

        {/* App Info */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-400">FinFlow v2.0.0</p>
          <p className="text-xs text-gray-400 mt-1">© 2024 FinFlow</p>
        </div>

        {/* Bottom spacing */}
        <div className="h-24" />
      </div>

      {/* Profile Edit Sheet */}
      {showProfileSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowProfileSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[90vh] animate-slide-up safe-area-inset-bottom flex flex-col">
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profil bearbeiten</h2>
              <button
                onClick={() => setShowProfileSheet(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {fullName?.charAt(0) || email?.charAt(0) || '?'}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      // Create a file input and trigger it
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          // Check file size (max 2MB)
                          if (file.size > 2 * 1024 * 1024) {
                            alert('Das Bild ist zu groß. Maximal 2MB erlaubt.')
                            return
                          }
                          
                          // Convert to base64 and save locally
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string
                            setProfilePicture(base64)
                            localStorage.setItem('profilePicture', base64)
                          }
                          reader.readAsDataURL(file)
                        }
                      }
                      input.click()
                    }}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1a2332]"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Tippen Sie auf das Kamera-Symbol zum Ändern</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3.5 rounded-2xl",
                    "bg-gray-50 dark:bg-[#232e40]",
                    "text-gray-900 dark:text-white",
                    "border-2 border-transparent focus:border-blue-500 focus:outline-none"
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3.5 rounded-2xl",
                    "bg-gray-50 dark:bg-[#232e40]",
                    "text-gray-900 dark:text-white",
                    "border-2 border-transparent focus:border-blue-500 focus:outline-none"
                  )}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <button
                onClick={handleUpdateProfile}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl font-semibold bg-blue-500 text-white flex items-center justify-center gap-2 mb-4"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Speichern
              </button>
              {/* Extra space to ensure button is visible above keyboard/safe area */}
              <div className="h-32" />
            </div>
          </div>
        </div>
      )}

      {/* Password Change Sheet */}
      {showPasswordSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPasswordSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[80vh] overflow-y-auto animate-slide-up safe-area-inset-bottom">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Passwort ändern</h2>
              <button
                onClick={() => setShowPasswordSheet(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aktuelles Passwort
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3.5 rounded-2xl pr-12",
                      "bg-gray-50 dark:bg-[#232e40]",
                      "text-gray-900 dark:text-white",
                      "border-2 border-transparent focus:border-blue-500 focus:outline-none"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Neues Passwort
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3.5 rounded-2xl pr-12",
                      "bg-gray-50 dark:bg-[#232e40]",
                      "text-gray-900 dark:text-white",
                      "border-2 border-transparent focus:border-blue-500 focus:outline-none"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3.5 rounded-2xl",
                    "bg-gray-50 dark:bg-[#232e40]",
                    "text-gray-900 dark:text-white",
                    "border-2 border-transparent focus:border-blue-500 focus:outline-none"
                  )}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                className="w-full py-4 rounded-2xl font-semibold bg-blue-500 text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Passwort ändern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selection Sheet */}
      {showThemeSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowThemeSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[60vh] overflow-y-auto animate-slide-up safe-area-inset-bottom">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="px-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Design wählen</h2>
            </div>
            <div className="p-5 space-y-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onThemeChange(t.id)
                    setShowThemeSheet(false)
                  }}
                  className={cn(
                    "flex items-center gap-4 w-full p-4 rounded-xl transition-colors",
                    theme === t.id 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500" 
                      : "bg-gray-50 dark:bg-[#232e40]"
                  )}
                >
                  <t.icon className={cn(
                    "w-6 h-6",
                    theme === t.id ? "text-blue-500" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "font-medium",
                    theme === t.id ? "text-blue-600" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {t.label}
                  </span>
                  {theme === t.id && (
                    <Check className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Sheet */}
      {showLanguageSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLanguageSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[60vh] overflow-y-auto animate-slide-up safe-area-inset-bottom">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="px-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sprache wählen</h2>
            </div>
            <div className="p-5 space-y-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code)
                    setShowLanguageSheet(false)
                  }}
                  className={cn(
                    "flex items-center gap-4 w-full p-4 rounded-xl transition-colors",
                    language === lang.code 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500" 
                      : "bg-gray-50 dark:bg-[#232e40]"
                  )}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={cn(
                    "font-medium",
                    language === lang.code ? "text-blue-600" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {lang.label}
                  </span>
                  {language === lang.code && (
                    <Check className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currency Selection Sheet */}
      {showCurrencySheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCurrencySheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[60vh] overflow-y-auto animate-slide-up safe-area-inset-bottom">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="px-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Währung wählen</h2>
            </div>
            <div className="p-5 space-y-2">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => handleCurrencyChange(curr.code)}
                  className={cn(
                    "flex items-center gap-4 w-full p-4 rounded-xl transition-colors",
                    currency === curr.code 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500" 
                      : "bg-gray-50 dark:bg-[#232e40]"
                  )}
                >
                  <span className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-lg text-gray-600 dark:text-gray-300">
                    {curr.symbol}
                  </span>
                  <div className="text-left">
                    <p className={cn(
                      "font-medium",
                      currency === curr.code ? "text-blue-600" : "text-gray-700 dark:text-gray-300"
                    )}>
                      {curr.label}
                    </p>
                    <p className="text-sm text-gray-500">{curr.code}</p>
                  </div>
                  {currency === curr.code && (
                    <Check className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white dark:bg-[#1a2332] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Konto löschen?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Diese Aktion ist endgültig. Alle Ihre Daten werden unwiderruflich gelöscht.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-100 dark:bg-[#232e40] text-gray-700 dark:text-gray-300"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-medium bg-rose-500 text-white flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Sheet */}
      {showApiKeysSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowApiKeysSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[90vh] animate-slide-up safe-area-inset-bottom flex flex-col">
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">API-Schlüssel</h2>
              </div>
              <button
                onClick={() => setShowApiKeysSheet(false)}
                disabled={isSubmitting}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
            {apiKeysSaved ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Gespeichert!
                </h3>
                <p className="text-gray-500">
                  Ihre API-Schlüssel wurden erfolgreich gespeichert.
                </p>
              </div>
            ) : (
              <div className="p-5 pb-10 space-y-6">
                {/* Binance Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#F3BA2F] flex items-center justify-center">
                      <span className="text-black font-bold text-sm">B</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Binance</h3>
                      <p className="text-xs text-gray-500">Für Krypto-Portfolio & Trading</p>
                    </div>
                    {binanceApiKey?.includes('•') && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Verbunden</span>
                      </div>
                    )}
                  </div>
                  
                  {binanceApiKey?.includes('•') ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                            Binance ist verbunden
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Ihr Krypto-Portfolio wird automatisch synchronisiert. Um die Verbindung zu ändern, geben Sie neue API-Schlüssel ein.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        API Key
                      </label>
                      <input
                        type="text"
                        value={binanceApiKey}
                        onChange={(e) => setBinanceApiKey(e.target.value)}
                        placeholder="Binance API Key eingeben"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl font-mono text-sm",
                          "bg-gray-50 dark:bg-[#232e40]",
                          "text-gray-900 dark:text-white placeholder-gray-400",
                          "border-2 border-transparent focus:border-amber-500 focus:outline-none"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Secret Key
                      </label>
                      <div className="relative">
                        <input
                          type={showBinanceSecret ? "text" : "password"}
                          value={binanceSecretKey}
                          onChange={(e) => setBinanceSecretKey(e.target.value)}
                          placeholder="Binance Secret Key eingeben"
                          className={cn(
                            "w-full px-4 py-3 pr-12 rounded-xl font-mono text-sm",
                            "bg-gray-50 dark:bg-[#232e40]",
                            "text-gray-900 dark:text-white placeholder-gray-400",
                            "border-2 border-transparent focus:border-amber-500 focus:outline-none"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowBinanceSecret(!showBinanceSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showBinanceSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  )}
                  
                  {!binanceApiKey?.includes('•') && (
                  <a 
                    href="https://www.binance.com/en/my/settings/api-management" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    API-Schlüssel bei Binance erstellen
                  </a>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* Alpaca Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#FFCD00] flex items-center justify-center">
                      <span className="text-black font-bold text-sm">A</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Alpaca</h3>
                      <p className="text-xs text-gray-500">Für Aktien-Trading</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        API Key
                      </label>
                      <input
                        type="text"
                        value={alpacaApiKey}
                        onChange={(e) => setAlpacaApiKey(e.target.value)}
                        placeholder="Alpaca API Key eingeben"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl font-mono text-sm",
                          "bg-gray-50 dark:bg-[#232e40]",
                          "text-gray-900 dark:text-white placeholder-gray-400",
                          "border-2 border-transparent focus:border-amber-500 focus:outline-none"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Secret Key
                      </label>
                      <div className="relative">
                        <input
                          type={showAlpacaSecret ? "text" : "password"}
                          value={alpacaSecretKey}
                          onChange={(e) => setAlpacaSecretKey(e.target.value)}
                          placeholder="Alpaca Secret Key eingeben"
                          className={cn(
                            "w-full px-4 py-3 pr-12 rounded-xl font-mono text-sm",
                            "bg-gray-50 dark:bg-[#232e40]",
                            "text-gray-900 dark:text-white placeholder-gray-400",
                            "border-2 border-transparent focus:border-amber-500 focus:outline-none"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowAlpacaSecret(!showAlpacaSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showAlpacaSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <a 
                    href="https://app.alpaca.markets/paper/dashboard/overview" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    API-Schlüssel bei Alpaca erstellen
                  </a>
                </div>

                {/* Security Notice */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Sicherheitshinweis
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Ihre API-Schlüssel werden verschlüsselt gespeichert. Verwenden Sie nur 
                        Lese-Berechtigungen wenn Sie kein automatisches Trading nutzen möchten.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSaveApiKeys}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-4 rounded-2xl font-semibold text-lg",
                    "bg-blue-500 text-white shadow-lg",
                    "hover:bg-blue-600 active:scale-[0.98]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all flex items-center justify-center gap-2",
                    "mb-8"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      API-Schlüssel speichern
                    </>
                  )}
                </button>
                {/* Extra bottom padding for safe scroll */}
                <div className="h-20" />
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  )
}