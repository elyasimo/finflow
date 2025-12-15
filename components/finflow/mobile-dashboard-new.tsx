"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { 
  ArrowUpRight, 
  Plus,
  ChevronRight,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Banknote,
  Bell,
  Receipt,
  Sparkles,
  Bitcoin,
  AlertCircle,
  Loader2,
  Globe,
  Coins,
  Sun,
  Moon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import { useTheme } from "next-themes"
import Link from "next/link"
import TransactionCard from "./ui/transaction-card"
import BudgetWalletCard from "./ui/budget-wallet-card"
import useBinancePortfolio from "@/hooks/use-binance-portfolio"

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  color?: string
  bankName?: string
  isPinned?: boolean
}

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category?: string
  transactionDate: string
  currency: string
  note?: string
  tag?: string
  merchant?: string
}

interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  currency: string
  category?: string
  startDate?: string
  endDate?: string
  isPinned?: boolean
}

interface MobileDashboardProps {
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  userName?: string
}

// Account type icons
const accountTypeIcons: Record<string, React.ElementType> = {
  'checking': Wallet,
  'giro': Wallet,
  'savings': PiggyBank,
  'spar': PiggyBank,
  'credit': CreditCard,
  'investment': TrendingUp,
  'cash': Banknote,
  'default': Wallet,
}

// Gradient presets for account cards
const gradientPresets = [
  'from-blue-500 via-blue-600 to-indigo-700',
  'from-emerald-500 via-emerald-600 to-teal-700',
  'from-purple-500 via-purple-600 to-violet-700',
  'from-rose-500 via-rose-600 to-pink-700',
  'from-amber-500 via-amber-600 to-orange-700',
]

export default function MobileDashboard({
  accounts,
  transactions,
  budgets,
  totalBalance,
  totalIncome,
  totalExpenses,
  userName = 'User',
}: MobileDashboardProps) {
  const { t, language, setLanguage } = useLanguage()
  const { currency, updateCurrencyInBackend } = useCurrency()
  const { theme, setTheme } = useTheme()
  const [activeAccountIndex, setActiveAccountIndex] = useState(0)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false)
  const langRef = useRef<HTMLButtonElement>(null)
  const currRef = useRef<HTMLButtonElement>(null)

  // Toggle functions for dropdowns
  const toggleLanguageMenu = () => {
    setShowCurrencyMenu(false)
    setShowLanguageMenu(prev => !prev)
  }

  const toggleCurrencyMenu = () => {
    setShowLanguageMenu(false)
    setShowCurrencyMenu(prev => !prev)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const isOutsideLang = langRef.current && !langRef.current.contains(target)
      const isOutsideCurr = currRef.current && !currRef.current.contains(target)
      
      if (isOutsideLang && showLanguageMenu) {
        setShowLanguageMenu(false)
      }
      if (isOutsideCurr && showCurrencyMenu) {
        setShowCurrencyMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageMenu, showCurrencyMenu])

  const languageOptions = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'ar', label: 'AR', flag: '🇲🇦' },
  ]

  const currencyOptions = [
    { code: 'USD', label: '$', flag: '🇺🇸' },
    { code: 'EUR', label: '€', flag: '🇪🇺' },
    { code: 'CHF', label: 'Fr', flag: '🇨🇭' },
    { code: 'MAD', label: 'د.م', flag: '🇲🇦' },
  ]

  // Binance Portfolio Hook
  const { 
    portfolio: binancePortfolio, 
    loading: portfolioLoading, 
    error: portfolioError,
    needsConfiguration 
  } = useBinancePortfolio(60000) // Poll every 60 seconds

  // Calculate total portfolio value
  const totalPortfolioValue = useMemo(() => {
    const total = binancePortfolio.reduce((sum, asset) => {
      const free = parseFloat(asset.free) || 0
      const price = asset.currentPrice || 0
      const value = free * price
      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)
    return Number.isFinite(total) ? total : 0
  }, [binancePortfolio])

  const formatCurrency = (amount: number, curr?: string) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(safeAmount)
  }

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => 
    [...transactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 5),
    [transactions]
  )

  // Get pinned budgets first, then regular
  const sortedBudgets = useMemo(() => 
    [...budgets].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    }).slice(0, 3),
    [budgets]
  )

  const getAccountIcon = (type: string) => {
    const key = type?.toLowerCase() || 'default'
    return accountTypeIcons[key] || accountTypeIcons.default
  }

  // Calculate savings rate
  const savingsRate = totalIncome > 0 
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) 
    : 0

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('goodMorningGreeting')
    if (hour < 18) return t('goodAfternoonGreeting')
    return t('goodEveningGreeting')
  }

  return (
    <div 
      className="bg-[#f8f9fc] dark:bg-[#0f1419]" 
      style={{ 
        overflowX: 'hidden',
        minHeight: '100dvh',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Language Dropdown Portal */}
      {showLanguageMenu && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setShowLanguageMenu(false)}
          onTouchEnd={(e) => { e.preventDefault(); setShowLanguageMenu(false); }}
        />
      )}
      {showLanguageMenu && (
        <div 
          className="fixed top-[70px] right-4 bg-white dark:bg-[#1a2332] rounded-xl shadow-2xl border border-gray-200 dark:border-[#232e40] overflow-hidden min-w-[140px] z-[9999]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {languageOptions.map(opt => (
            <button
              key={opt.code}
              type="button"
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setLanguage(opt.code as 'en' | 'de' | 'fr' | 'ar'); setShowLanguageMenu(false); }}
              onClick={(e) => { e.stopPropagation(); setLanguage(opt.code as 'en' | 'de' | 'fr' | 'ar'); setShowLanguageMenu(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm",
                language === opt.code 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                  : 'active:bg-gray-100 dark:active:bg-[#232e40] text-gray-700 dark:text-gray-300'
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="text-lg">{opt.flag}</span>
              <span className="font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Currency Dropdown Portal */}
      {showCurrencyMenu && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setShowCurrencyMenu(false)}
          onTouchEnd={(e) => { e.preventDefault(); setShowCurrencyMenu(false); }}
        />
      )}
      {showCurrencyMenu && (
        <div 
          className="fixed top-[70px] right-4 bg-white dark:bg-[#1a2332] rounded-xl shadow-2xl border border-gray-200 dark:border-[#232e40] overflow-hidden min-w-[140px] z-[9999]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {currencyOptions.map(opt => (
            <button
              key={opt.code}
              type="button"
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); updateCurrencyInBackend(opt.code); setShowCurrencyMenu(false); }}
              onClick={(e) => { e.stopPropagation(); updateCurrencyInBackend(opt.code); setShowCurrencyMenu(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm",
                currency === opt.code 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                  : 'active:bg-gray-100 dark:active:bg-[#232e40] text-gray-700 dark:text-gray-300'
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="text-lg">{opt.flag}</span>
              <span className="font-medium">{opt.code}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sticky Header - Inside scroll container */}
      <header 
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#1a2332]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-[#232e40]/50" 
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center justify-between px-4 h-14 w-full max-w-full">
          {/* Left: Greeting */}
          <div className="min-w-0 flex-shrink">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{getGreeting()}</p>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {userName.split(' ')[0]}
            </h1>
          </div>
          
          {/* Right: Action Icons - Compact */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Language Button */}
            <button
              type="button"
              ref={langRef}
              onTouchEnd={(e) => { e.preventDefault(); toggleLanguageMenu(); }}
              onClick={() => toggleLanguageMenu()}
              className={cn(
                "h-8 px-2 rounded-lg flex items-center justify-center gap-1",
                showLanguageMenu 
                  ? "bg-blue-100 dark:bg-blue-900/30" 
                  : "bg-gray-100 dark:bg-[#232e40] active:bg-gray-200 dark:active:bg-[#2a3a50]"
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Globe className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 pointer-events-none" />
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 pointer-events-none">{language.toUpperCase()}</span>
            </button>

            {/* Currency Button */}
            <button
              type="button"
              ref={currRef}
              onTouchEnd={(e) => { e.preventDefault(); toggleCurrencyMenu(); }}
              onClick={() => toggleCurrencyMenu()}
              className={cn(
                "h-8 px-2 rounded-lg flex items-center justify-center gap-1",
                showCurrencyMenu 
                  ? "bg-blue-100 dark:bg-blue-900/30" 
                  : "bg-gray-100 dark:bg-[#232e40] active:bg-gray-200 dark:active:bg-[#2a3a50]"
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Coins className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 pointer-events-none" />
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 pointer-events-none">{currency}</span>
            </button>

            {/* Notifications */}
            <Link 
              href="/price-alerts" 
              className="h-8 px-2 rounded-lg bg-gray-100 dark:bg-[#232e40] flex items-center justify-center relative active:bg-gray-200 dark:active:bg-[#2a3a50]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Bell className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 pointer-events-none" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 pointer-events-none"></span>
            </Link>

            {/* Theme Toggle */}
            <button
              type="button"
              onTouchEnd={(e) => { e.preventDefault(); setTheme(theme === 'dark' ? 'light' : 'dark'); }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 px-2 rounded-lg bg-gray-100 dark:bg-[#232e40] flex items-center justify-center active:bg-gray-200 dark:active:bg-[#2a3a50]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-yellow-500 pointer-events-none" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
              )}
            </button>

            {/* User Avatar */}
            <Link 
              href="/settings"
              className="h-8 px-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-[10px] shadow-md"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {userName.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Balance Display */}
      <div className="px-5 py-6 bg-white dark:bg-[#1a2332]">
        {/* Main Balance Display */}
        <div className="text-center mb-5">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest font-medium">
            {t('totalBalanceLabel')}
          </p>
          <h2 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight mb-4">
            {formatCurrency(totalBalance)}
          </h2>
          
          {/* Income/Expense Pills */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                −{formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Savings Rate Ring - Compact */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-gray-100 dark:text-gray-800"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="url(#dashboardGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(savingsRate, 0) * 2.14} 214`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{savingsRate}%</span>
              <span className="text-[8px] text-gray-400 uppercase tracking-wide">Savings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Generous Spacing */}
      <div className="px-6 py-8 space-y-8">
        
        {/* Primary CTA - Add Transaction */}
        <div className="flex gap-3">
          <Link
            href="/transactions?action=add"
            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-blue-500 text-white font-semibold shadow-xl shadow-blue-500/30 hover:bg-blue-600 active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('addTransaction')}
          </Link>
          <Link
            href="/transactions"
            className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1a2332] shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#1e2940] transition-colors"
          >
            <Receipt className="w-5 h-5 text-gray-500" />
          </Link>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/analytics"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-[#1a2332] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('analytics')}</span>
          </Link>
          <Link
            href="/budgets"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-[#1a2332] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('budgets')}</span>
          </Link>
          <Link
            href="/accounts"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-[#1a2332] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('accounts')}</span>
          </Link>
        </div>

        {/* Binance Portfolio Section */}
        {!needsConfiguration && binancePortfolio.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                {t('cryptoPortfolioTitle')}
              </h3>
              <Link href="/markets" className="text-sm font-medium text-blue-500 flex items-center gap-1">
                {t('details')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Portfolio Summary Card */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 rounded-3xl p-5 text-white shadow-xl mb-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm opacity-80">{t('totalValue')}</p>
                {portfolioLoading && <Loader2 className="w-4 h-4 animate-spin opacity-60" />}
              </div>
              <p className="text-3xl font-bold mb-4 truncate">
                {formatCurrency(totalPortfolioValue, currency)}
              </p>
              
              {/* Top 3 Assets - wrap instead of overflow */}
              <div className="flex flex-wrap gap-2">
                {binancePortfolio
                  .filter(a => parseFloat(a.free) > 0 && a.currentPrice)
                  .sort((a, b) => {
                    const valueA = a.currentPrice ? parseFloat(a.free) * a.currentPrice : 0
                    const valueB = b.currentPrice ? parseFloat(b.free) * b.currentPrice : 0
                    return valueB - valueA
                  })
                  .slice(0, 3)
                  .map((asset) => (
                    <div key={asset.asset} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 rounded-full max-w-[110px] overflow-hidden">
                      <img 
                        src={`/logos/cryptocurrency/${asset.asset.toLowerCase()}.png`}
                        alt={asset.asset}
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/logos/cryptocurrency/default.png'
                        }}
                      />
                      <span className="text-xs font-medium truncate">{asset.asset}</span>
                      {asset.priceChange24h !== null && (
                        <span className={cn(
                          "text-xs flex-shrink-0",
                          asset.priceChange24h >= 0 ? "text-green-200" : "text-red-200"
                        )}>
                          {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Show Setup Link if Binance not configured */}
        {needsConfiguration && (
          <Link
            href="/settings"
            className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Bitcoin className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{t('connectBinance')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('viewCryptoPortfolio')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        )}

        {/* Accounts Carousel */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('accounts')}</h3>
            <Link href="/accounts" className="text-sm font-medium text-blue-500 flex items-center gap-1">
              {t('seeAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {accounts.length > 0 ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
                {accounts.map((account, idx) => {
                  const AccountIcon = getAccountIcon(account.type)
                  
                  return (
                    <Link
                      key={account.id}
                      href={`/accounts/${account.id}`}
                      className={cn(
                        "flex-shrink-0 w-72 h-44 rounded-3xl p-5 text-white relative overflow-hidden snap-center",
                        "bg-gradient-to-br shadow-xl transition-transform active:scale-[0.98]",
                        gradientPresets[idx % gradientPresets.length]
                      )}
                    >
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
                      
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <AccountIcon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            {account.type}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-sm opacity-80 mb-1">{account.name}</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(account.balance, account.currency)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                
                {/* Add Account Card */}
                <Link
                  href="/accounts?action=add"
                  className="flex-shrink-0 w-72 h-44 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors snap-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Plus className="w-7 h-7" />
                  </div>
                  <span className="font-medium">{t('addAccount')}</span>
                </Link>
              </div>
              
              {/* Scroll Indicator */}
              {accounts.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2">
                  {accounts.slice(0, Math.min(5, accounts.length + 1)).map((_, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors",
                        idx === activeAccountIndex ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"
                      )} 
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/accounts?action=add"
              className="flex items-center justify-center h-44 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">{t('addAccount')}</span>
              </div>
            </Link>
          )}
        </div>

        {/* Recent Transactions - Individual Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('recentTransactions')}
            </h3>
            <Link href="/transactions" className="text-sm font-medium text-blue-500 flex items-center gap-1">
              {t('seeAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('noTransactionsYet')}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('addFirstTransaction')}
              </p>
              <Link
                href="/transactions?action=add"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-5 h-5" />
                {t('firstTransaction')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  {...transaction}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </div>

        {/* Budgets Section - Wallet Style Cards */}
        {(sortedBudgets.length > 0 || budgets.length === 0) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('budgets')}</h3>
              <Link href="/budgets" className="text-sm font-medium text-blue-500 flex items-center gap-1">
                {t('seeAll')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {sortedBudgets.length === 0 ? (
              <Link
                href="/budgets?action=add"
                className="flex items-center justify-center h-32 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm font-medium">{t('createFirstBudget')}</span>
                </div>
              </Link>
            ) : (
              <div className="space-y-0">
                {sortedBudgets.map((budget, idx) => (
                  <BudgetWalletCard
                    key={budget.id}
                    {...budget}
                    spent={budget.spent || 0}
                    formatCurrency={formatCurrency}
                    variant="list"
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
