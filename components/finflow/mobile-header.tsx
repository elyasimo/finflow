"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Moon, Sun, Home, Globe, Coins, ChevronLeft } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
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
  const pathname = usePathname()
  const router = useRouter()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const currRef = useRef<HTMLDivElement>(null)

  // Check if we're on dashboard or a sub-page
  const isDashboard = pathname === '/dashboard' || pathname === '/'
  const canGoBack = !isDashboard

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false)
      }
      if (currRef.current && !currRef.current.contains(e.target as Node)) {
        setShowCurrencyMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await updateCurrencyInBackend(newCurrency)
      setShowCurrencyMenu(false)
    } catch {
      // Currency update failed silently
    }
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any)
    setShowLanguageMenu(false)
  }

  const currentCurrency = currencyOptions.find(c => c.code === selectedCurrency)
  const currentLanguage = languageOptions.find(l => l.code === language)

  return (
    <header className="lg:hidden flex-shrink-0 z-40 bg-white/95 dark:bg-[#0f1623]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-[#232e40]/50 pt-[env(safe-area-inset-top)] w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between px-3 h-14 max-w-full">
        {/* Left: Back/Home Icon + Title */}
        <div className="flex items-center gap-2 flex-shrink min-w-0">
          {canGoBack ? (
            <button 
              onClick={() => router.back()}
              className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          ) : (
            <Link 
              href="/dashboard" 
              className="w-9 h-9 flex-shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </Link>
          )}
          {showLogo && !canGoBack && (
            <FinflowLogo size="sm" variant="icon" />
          )}
          {(title || canGoBack) && (
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">
              {title || t('dashboard')}
            </h1>
          )}
        </div>

        {/* Right: Compact Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Language Icon with Dropdown */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowLanguageMenu(!showLanguageMenu)
                setShowCurrencyMenu(false)
              }}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors active:scale-95"
            >
              <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            
            {showLanguageMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a2332] rounded-xl shadow-2xl border border-gray-200 dark:border-[#232e40] overflow-hidden z-[9999] min-w-[140px]">
                {languageOptions.map(opt => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleLanguageChange(opt.code)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors active:bg-gray-100 dark:active:bg-[#2a3a50] ${
                      language === opt.code 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-gray-50 dark:hover:bg-[#232e40] text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-lg">{opt.flag}</span>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency Icon with Dropdown */}
          <div ref={currRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowCurrencyMenu(!showCurrencyMenu)
                setShowLanguageMenu(false)
              }}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors active:scale-95"
            >
              <Coins className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            
            {showCurrencyMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-200 dark:border-[#232e40] overflow-hidden z-[100] min-w-[140px]">
                {currencyOptions.map(opt => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleCurrencyChange(opt.code)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-3 text-sm transition-colors ${
                      selectedCurrency === opt.code 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-gray-50 dark:hover:bg-[#232e40] text-gray-700 dark:text-gray-300 active:bg-gray-100'
                    }`}
                  >
                    <span className="text-base">{opt.flag}</span>
                    <span className="font-medium">{opt.code}</span>
                  </button>
                ))}
              </div>
            )}
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
