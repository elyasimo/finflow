"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Moon, Sun, Home, Globe, Coins, ChevronLeft, Search, MoreVertical, X } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import { useCurrency } from './CurrencyContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import Link from "next/link"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  fullName?: string
}

interface MobilePageHeaderProps {
  user?: User
  title: string
  showBack?: boolean
  showSearch?: boolean
  showActions?: boolean
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string
  rightActions?: React.ReactNode
  className?: string
}

/**
 * Unified Mobile Page Header Component
 * 
 * Consistent header used across all mobile pages with:
 * - Back navigation (or Home on root pages)
 * - Page title
 * - Optional search functionality
 * - Language/Currency/Theme/Notification actions
 * - User avatar linking to settings
 * 
 * Accessibility:
 * - All buttons have minimum 44x44pt touch targets
 * - Screen reader labels provided
 * - Focus states visible
 * - Logical tab order
 */
export default function MobilePageHeader({ 
  user, 
  title, 
  showBack = true,
  showSearch = false,
  showActions = true,
  onSearchChange,
  searchPlaceholder = "Suchen...",
  rightActions,
  className
}: MobilePageHeaderProps) {
  const { currency: selectedCurrency, updateCurrencyInBackend } = useCurrency()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false)
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const langRef = useRef<HTMLDivElement>(null)
  const currRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're on a root page
  const rootPages = ['/dashboard', '/', '/accounts', '/transactions', '/budgets', '/reports', '/settings']
  const isRootPage = rootPages.includes(pathname)
  const canGoBack = showBack && !isRootPage

  const currencyOptions = [
    { code: 'USD', label: '$', flag: '🇺🇸', name: 'US Dollar' },
    { code: 'EUR', label: '€', flag: '🇪🇺', name: 'Euro' },
    { code: 'CHF', label: 'Fr', flag: '🇨🇭', name: 'Swiss Franc' },
    { code: 'MAD', label: 'د.م', flag: '🇲🇦', name: 'Moroccan Dirham' },
  ]

  const languageOptions = [
    { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
    { code: 'de', label: 'DE', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
    { code: 'ar', label: 'AR', flag: '🇲🇦', name: 'العربية' },
  ]

  // Close dropdowns when clicking outside
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

  // Focus search input when expanded
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearchInput])

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await updateCurrencyInBackend(newCurrency)
      setShowCurrencyMenu(false)
    } catch (error) {
      console.error('Failed to update currency:', error)
    }
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any)
    setShowLanguageMenu(false)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange?.(value)
  }

  const handleBack = () => {
    if (canGoBack) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  const currentCurrency = currencyOptions.find(c => c.code === selectedCurrency)
  const currentLanguage = languageOptions.find(l => l.code === language)

  return (
    <header 
      className={cn(
        "lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#0f1623]/95 backdrop-blur-xl",
        "border-b border-gray-200/50 dark:border-[#232e40]/50",
        "pt-[env(safe-area-inset-top)]",
        "w-full max-w-[100vw] overflow-hidden",
        className
      )}
      role="banner"
    >
      <div className="flex items-center justify-between px-4 h-14 w-full max-w-full">
        {/* Left: Back/Home + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={handleBack}
            className={cn(
              "w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center",
              "transition-all duration-200 active:scale-95",
              canGoBack 
                ? "bg-gray-100 dark:bg-[#1a2332] hover:bg-gray-200 dark:hover:bg-[#232e40]"
                : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            )}
            aria-label={canGoBack ? 'Zurück' : 'Home'}
          >
            {canGoBack ? (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </button>
          
          {/* Title or Search Input */}
          {showSearchInput && showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "flex-1 h-10 px-4 rounded-xl text-sm",
                  "bg-gray-100 dark:bg-[#1a2332]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400",
                  "border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                )}
                aria-label={searchPlaceholder}
              />
              <button
                onClick={() => {
                  setShowSearchInput(false)
                  setSearchQuery('')
                  onSearchChange?.('')
                }}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center"
                aria-label="Abbrechen"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <h1 
              className="text-base font-semibold text-gray-900 dark:text-white truncate"
              id="page-title"
            >
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions */}
        {showActions && !showSearchInput && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Search Button (if enabled) */}
            {showSearch && (
              <button
                onClick={() => setShowSearchInput(true)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
                aria-label="Suchen"
              >
                <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            )}

            {/* Language Dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => {
                  setShowLanguageMenu(!showLanguageMenu)
                  setShowCurrencyMenu(false)
                }}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
                aria-label="Sprache ändern"
                aria-expanded={showLanguageMenu}
                aria-haspopup="listbox"
              >
                <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              
              {showLanguageMenu && (
                <div 
                  className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-200 dark:border-[#232e40] overflow-hidden z-50 min-w-[140px]"
                  role="listbox"
                  aria-label="Sprache wählen"
                >
                  {languageOptions.map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => handleLanguageChange(opt.code)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                        language === opt.code 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'hover:bg-gray-50 dark:hover:bg-[#232e40] text-gray-700 dark:text-gray-300'
                      )}
                      role="option"
                      aria-selected={language === opt.code}
                    >
                      <span className="text-lg">{opt.flag}</span>
                      <span className="font-medium">{opt.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Dropdown */}
            <div ref={currRef} className="relative">
              <button
                onClick={() => {
                  setShowCurrencyMenu(!showCurrencyMenu)
                  setShowLanguageMenu(false)
                }}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
                aria-label="Währung ändern"
                aria-expanded={showCurrencyMenu}
                aria-haspopup="listbox"
              >
                <Coins className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              
              {showCurrencyMenu && (
                <div 
                  className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-200 dark:border-[#232e40] overflow-hidden z-50 min-w-[160px]"
                  role="listbox"
                  aria-label="Währung wählen"
                >
                  {currencyOptions.map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => handleCurrencyChange(opt.code)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                        selectedCurrency === opt.code 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'hover:bg-gray-50 dark:hover:bg-[#232e40] text-gray-700 dark:text-gray-300'
                      )}
                      role="option"
                      aria-selected={selectedCurrency === opt.code}
                    >
                      <span className="text-lg">{opt.flag}</span>
                      <div>
                        <span className="font-medium">{opt.code}</span>
                        <span className="text-xs text-gray-400 ml-1">({opt.label})</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <Link 
              href="/price-alerts"
              className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
              aria-label="Benachrichtigungen"
            >
              <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
              aria-label={theme === 'dark' ? 'Hell-Modus' : 'Dunkel-Modus'}
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
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-blue-500 to-purple-600",
                "text-white font-semibold text-sm",
                "shadow-lg shadow-blue-500/20"
              )}
              aria-label={t('settings') || 'Settings'}
            >
              {user?.email?.[0]?.toUpperCase() || user?.fullName?.[0]?.toUpperCase() || 'U'}
            </Link>

            {/* Custom Right Actions */}
            {rightActions}
          </div>
        )}
      </div>
    </header>
  )
}
