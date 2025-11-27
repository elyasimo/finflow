"use client"

import { useState } from "react"
import { 
  User,
  Globe,
  Palette,
  Bell,
  Shield,
  Key,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import { useTheme } from "next-themes"
import Link from "next/link"

interface MobileSettingsProps {
  user?: {
    email?: string
    fullName?: string
  }
  onLogout: () => void
  onLanguageChange: (lang: string) => void
  onCurrencyChange: (currency: string) => void
}

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
]

const currencies = [
  { code: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'MAD', label: 'Moroccan Dirham', symbol: 'MAD' },
]

export default function MobileSettings({
  user,
  onLogout,
  onLanguageChange,
  onCurrencyChange,
}: MobileSettingsProps) {
  const { t, language } = useLanguage()
  const { currency } = useCurrency()
  const { theme, setTheme } = useTheme()
  const [showLanguages, setShowLanguages] = useState(false)
  const [showCurrencies, setShowCurrencies] = useState(false)

  const currentLanguage = languages.find(l => l.code === language) || languages[0]
  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0]

  const settingsGroups = [
    {
      title: t('account'),
      items: [
        {
          icon: User,
          label: t('profile'),
          value: user?.email || '',
          href: '#profile',
        },
        {
          icon: Shield,
          label: t('security'),
          value: '',
          href: '#security',
        },
      ],
    },
    {
      title: t('preferences'),
      items: [
        {
          icon: Globe,
          label: t('language'),
          value: `${currentLanguage.flag} ${currentLanguage.label}`,
          onClick: () => setShowLanguages(true),
        },
        {
          icon: CreditCard,
          label: t('currency'),
          value: `${currentCurrency.symbol} ${currentCurrency.code}`,
          onClick: () => setShowCurrencies(true),
        },
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: t('theme'),
          value: theme === 'dark' ? t('dark') : t('light'),
          onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        },
        {
          icon: Bell,
          label: t('notifications'),
          value: '',
          href: '#notifications',
        },
      ],
    },
    {
      title: 'Integrationen',
      items: [
        {
          icon: Key,
          label: 'API Keys',
          value: 'Binance, Alpaca',
          href: '#api-keys',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Hilfecenter',
          value: '',
          href: '/support',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.fullName || 'Benutzer'}</h2>
            <p className="text-sm text-blue-100">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
            {group.title}
          </h3>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-gray-100 dark:border-[#232e40] overflow-hidden divide-y divide-gray-100 dark:divide-[#232e40]">
            {group.items.map((item, itemIndex) => {
              const content = (
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#232e40] flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    {item.value && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.value}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              )

              if (item.onClick) {
                return (
                  <button
                    key={itemIndex}
                    onClick={item.onClick}
                    className="w-full text-left hover:bg-gray-50 dark:hover:bg-[#232e40] transition-colors"
                  >
                    {content}
                  </button>
                )
              }

              if (item.href) {
                return (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    className="block hover:bg-gray-50 dark:hover:bg-[#232e40] transition-colors"
                  >
                    {content}
                  </Link>
                )
              }

              return <div key={itemIndex}>{content}</div>
            })}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium"
      >
        <LogOut className="w-5 h-5" />
        {t('logout')}
      </button>

      {/* Language Selector Modal */}
      {showLanguages && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowLanguages(false)}>
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#1a2332] rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sprache wählen</h3>
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code)
                    setShowLanguages(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl transition-colors",
                    language === lang.code
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                      : "bg-gray-50 dark:bg-[#232e40] border-2 border-transparent"
                  )}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                    {lang.label}
                  </span>
                  {language === lang.code && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currency Selector Modal */}
      {showCurrencies && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowCurrencies(false)}>
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#1a2332] rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Währung wählen</h3>
            <div className="space-y-2">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => {
                    onCurrencyChange(curr.code)
                    setShowCurrencies(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl transition-colors",
                    currency === curr.code
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                      : "bg-gray-50 dark:bg-[#232e40] border-2 border-transparent"
                  )}
                >
                  <span className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#2a3544] flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
                    {curr.symbol}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{curr.code}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{curr.label}</p>
                  </div>
                  {currency === curr.code && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
