"use client"

import { Bell, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useCurrency } from './CurrencyContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { FinflowLogo } from "@/components/icons/finflow-logo"
import Link from "next/link"

interface User {
  id: string
  email: string
  fullName?: string
}

interface MobileHeaderProps {
  user?: User
  title?: string
  showLogo?: boolean
}

export default function MobileHeader({ user, title, showLogo = true }: MobileHeaderProps) {
  const { currency: selectedCurrency, updateCurrencyInBackend } = useCurrency()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()

  const currencyOptions = [
    { code: 'USD', label: '$', flag: '🇺🇸' },
    { code: 'EUR', label: '€', flag: '🇪🇺' },
    { code: 'CHF', label: 'Fr', flag: '🇨🇭' },
    { code: 'MAD', label: 'د.م', flag: '🇲🇦' },
  ]

  const languageOptions = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'ar', label: 'AR', flag: '🇲🇦' },
  ]

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value
    try {
      await updateCurrencyInBackend(newCurrency)
    } catch (error) {
      console.error('Failed to update currency:', error)
    }
  }

  const currentCurrency = currencyOptions.find(c => c.code === selectedCurrency)
  const currentLanguage = languageOptions.find(l => l.code === language)

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-[#0f1623]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-[#232e40]/50">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Greeting or Logo */}
        <div className="flex items-center gap-3">
          {showLogo ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <FinflowLogo size="sm" variant="icon" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {t('dashboard')}
              </span>
            </Link>
          ) : (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Language/Currency Combined Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1a2332] rounded-full p-1">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as any)}
              className="h-7 w-14 px-1 rounded-full bg-transparent text-gray-700 dark:text-gray-200 text-xs font-medium focus:outline-none cursor-pointer appearance-none text-center"
            >
              {languageOptions.map(opt => (
                <option key={opt.code} value={opt.code}>
                  {opt.flag}
                </option>
              ))}
            </select>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

            <select
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              className="h-7 w-14 px-1 rounded-full bg-transparent text-gray-700 dark:text-gray-200 text-xs font-medium focus:outline-none cursor-pointer appearance-none text-center"
            >
              {currencyOptions.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.code}</option>
              ))}
            </select>
          </div>

          {/* Notifications */}
          <Link 
            href="/price-alerts"
            className="relative w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
          >
            <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* User Avatar */}
          <Link 
            href="/settings"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20"
          >
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </Link>
        </div>
      </div>
    </header>
  )
}
