"use client"

import { useState, useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import { useCurrency } from './CurrencyContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
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

export default function MobileHeader({ user, title }: MobileHeaderProps) {
  const { currency: selectedCurrency, updateCurrencyInBackend } = useCurrency()
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isDashboard = pathname === '/dashboard' || pathname === '/'
  const canGoBack = !isDashboard

  const currencyOptions = [
    { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
    { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', name: 'Schweizer Franken' },
    { code: 'MAD', symbol: 'د.م', flag: '🇲🇦', name: 'Marokkanischer Dirham' },
  ]

  const languageOptions = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  ]

  // Toggle functions
  const toggleLanguageMenu = () => {
    setShowCurrencyMenu(false)
    setShowLanguageMenu(prev => !prev)
  }

  const toggleCurrencyMenu = () => {
    setShowLanguageMenu(false)
    setShowCurrencyMenu(prev => !prev)
  }

  // Close menus when clicking outside - only mousedown, not touchstart (iOS bug)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (showLanguageMenu) setShowLanguageMenu(false)
        if (showCurrencyMenu) setShowCurrencyMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageMenu, showCurrencyMenu])

  const handleCurrencyChange = async (code: string) => {
    await updateCurrencyInBackend(code)
    setShowCurrencyMenu(false)
  }

  const handleLanguageChange = (code: string) => {
    setLanguage(code as 'en' | 'de' | 'fr' | 'ar')
    setShowLanguageMenu(false)
  }

  return (
    <header 
      className="mobile-header lg:hidden bg-white dark:bg-[#0f1623] border-b border-gray-100 dark:border-gray-800"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        zIndex: 50,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {canGoBack ? (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 active:scale-95 transition-transform flex-shrink-0"
              aria-label="Zurück"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white active:scale-95 transition-transform flex-shrink-0"
              aria-label="Home"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </Link>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right Section - Action Buttons */}
        <div ref={menuRef} className="flex items-center gap-1.5 flex-shrink-0">
          {/* Language Button */}
          <div className="relative">
            <button
              type="button"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleLanguageMenu();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleLanguageMenu();
              }}
              className="h-10 px-2.5 flex items-center justify-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              aria-label="Sprache"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span className="text-xs font-medium pointer-events-none">{language.toUpperCase()}</span>
            </button>
            
            {showLanguageMenu && (
              <div className="absolute top-12 right-0 w-44 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100]">
                {languageOptions.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLanguageChange(opt.code);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLanguageChange(opt.code);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      language === opt.code
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-200 active:bg-gray-50 dark:active:bg-gray-700'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span className="text-xl pointer-events-none">{opt.flag}</span>
                    <span className="font-medium pointer-events-none">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency Button */}
          <div className="relative">
            <button
              type="button"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCurrencyMenu();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCurrencyMenu();
              }}
              className="h-10 px-2.5 flex items-center justify-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              aria-label="Währung"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                <path d="M12 18V6"/>
              </svg>
              <span className="text-xs font-medium pointer-events-none">{selectedCurrency}</span>
            </button>
            
            {showCurrencyMenu && (
              <div className="absolute top-12 right-0 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100]">
                {currencyOptions.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCurrencyChange(opt.code);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCurrencyChange(opt.code);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selectedCurrency === opt.code
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-200 active:bg-gray-50 dark:active:bg-gray-700'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span className="text-xl pointer-events-none">{opt.flag}</span>
                    <div className="pointer-events-none">
                      <span className="font-medium">{opt.code}</span>
                      <span className="text-xs text-gray-400 ml-1">({opt.symbol})</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative h-10 px-2.5 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Benachrichtigungen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          {/* Theme Toggle */}
          <button
            type="button"
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            onClick={(e) => {
              e.preventDefault();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            className="h-10 px-2.5 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Theme wechseln"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Settings / Profile */}
          <Link
            href="/settings"
            className="h-10 px-3 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold text-sm active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Einstellungen"
          >
            {user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </Link>
        </div>
      </div>
    </header>
  )
}
