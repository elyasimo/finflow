"use client"

import { Bell } from "lucide-react"
import { ThemeToggle } from "../theme-toggle"
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
  const { language, setLanguage } = useLanguage()

  const currencyOptions = [
    { code: 'USD', label: 'USD' },
    { code: 'EUR', label: 'EUR' },
    { code: 'CHF', label: 'CHF' },
    { code: 'MAD', label: 'MAD' },
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

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-[#0f1623] border-b border-gray-200 dark:border-[#232e40] safe-area-top">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Logo or Title */}
        <div className="flex items-center">
          {showLogo ? (
            <Link href="/dashboard">
              <FinflowLogo size="sm" variant="icon" />
            </Link>
          ) : (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector - Compact */}
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as any)}
            className="h-8 px-1.5 rounded-lg border border-gray-200 dark:border-[#232e40] bg-white dark:bg-[#1a2332] text-gray-900 dark:text-gray-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languageOptions.map(opt => (
              <option key={opt.code} value={opt.code}>
                {opt.flag} {opt.label}
              </option>
            ))}
          </select>

          {/* Currency Selector - Compact */}
          <select
            value={selectedCurrency}
            onChange={handleCurrencyChange}
            className="h-8 px-1.5 rounded-lg border border-gray-200 dark:border-[#232e40] bg-white dark:bg-[#1a2332] text-gray-900 dark:text-gray-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencyOptions.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.label}</option>
            ))}
          </select>

          {/* Notifications */}
          <Link 
            href="/price-alerts"
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2332] transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar */}
          <Link 
            href="/settings"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm"
          >
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </Link>
        </div>
      </div>
    </header>
  )
}
