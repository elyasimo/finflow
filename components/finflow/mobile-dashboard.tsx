"use client"

import { useMemo, useState } from "react"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  ChevronRight,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Zap,
  Heart,
  Utensils,
  Plane,
  Gift,
  Smartphone,
  Music,
  Dumbbell,
  Briefcase,
  GraduationCap,
  Banknote
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import Link from "next/link"
import MobileBottomNav from "./mobile-bottom-nav"

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  color?: string
  bankName?: string
}

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category?: string
  transactionDate: string
  currency: string
}

interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  currency: string
  category?: string
}

interface MobileDashboardProps {
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  totalBalance: number
  totalIncome: number
  totalExpenses: number
}

// Elegant category configurations with soft colors
const categoryConfig: Record<string, { icon: React.ElementType, bg: string, iconColor: string, gradient: string }> = {
  'salary': { icon: Banknote, bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500', gradient: 'from-emerald-400 to-emerald-600' },
  'income': { icon: TrendingUp, bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500', gradient: 'from-emerald-400 to-emerald-600' },
  'food': { icon: Utensils, bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500', gradient: 'from-orange-400 to-orange-600' },
  'restaurant': { icon: Utensils, bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500', gradient: 'from-orange-400 to-orange-600' },
  'groceries': { icon: ShoppingBag, bg: 'bg-lime-50 dark:bg-lime-950/30', iconColor: 'text-lime-500', gradient: 'from-lime-400 to-lime-600' },
  'shopping': { icon: ShoppingBag, bg: 'bg-pink-50 dark:bg-pink-950/30', iconColor: 'text-pink-500', gradient: 'from-pink-400 to-pink-600' },
  'transport': { icon: Car, bg: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500', gradient: 'from-blue-400 to-blue-600' },
  'transportation': { icon: Car, bg: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500', gradient: 'from-blue-400 to-blue-600' },
  'entertainment': { icon: Music, bg: 'bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-500', gradient: 'from-purple-400 to-purple-600' },
  'bills': { icon: Zap, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-500', gradient: 'from-amber-400 to-amber-600' },
  'utilities': { icon: Zap, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-500', gradient: 'from-amber-400 to-amber-600' },
  'health': { icon: Heart, bg: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-400', gradient: 'from-red-400 to-red-600' },
  'healthcare': { icon: Heart, bg: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-400', gradient: 'from-red-400 to-red-600' },
  'travel': { icon: Plane, bg: 'bg-sky-50 dark:bg-sky-950/30', iconColor: 'text-sky-500', gradient: 'from-sky-400 to-sky-600' },
  'gift': { icon: Gift, bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-500', gradient: 'from-rose-400 to-rose-600' },
  'gifts': { icon: Gift, bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-500', gradient: 'from-rose-400 to-rose-600' },
  'coffee': { icon: Coffee, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600', gradient: 'from-amber-400 to-amber-600' },
  'housing': { icon: Home, bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-600' },
  'rent': { icon: Home, bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-600' },
  'fitness': { icon: Dumbbell, bg: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-500', gradient: 'from-teal-400 to-teal-600' },
  'sport': { icon: Dumbbell, bg: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-500', gradient: 'from-teal-400 to-teal-600' },
  'education': { icon: GraduationCap, bg: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-500', gradient: 'from-violet-400 to-violet-600' },
  'work': { icon: Briefcase, bg: 'bg-slate-50 dark:bg-slate-950/30', iconColor: 'text-slate-500', gradient: 'from-slate-400 to-slate-600' },
  'phone': { icon: Smartphone, bg: 'bg-cyan-50 dark:bg-cyan-950/30', iconColor: 'text-cyan-500', gradient: 'from-cyan-400 to-cyan-600' },
  'default': { icon: Wallet, bg: 'bg-gray-50 dark:bg-gray-900/30', iconColor: 'text-gray-500', gradient: 'from-gray-400 to-gray-600' },
}

// Account type icons
const accountTypeIcons: Record<string, React.ElementType> = {
  'checking': Wallet,
  'savings': PiggyBank,
  'credit': CreditCard,
  'investment': TrendingUp,
  'cash': Banknote,
  'default': Wallet,
}

export default function MobileDashboard({
  accounts,
  transactions,
  budgets,
  totalBalance,
  totalIncome,
  totalExpenses,
}: MobileDashboardProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [activeAccountIndex, setActiveAccountIndex] = useState(0)

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const recentTransactions = useMemo(() => 
    transactions
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 6),
    [transactions]
  )

  const getCategoryConfig = (category?: string | { name?: string }) => {
    const categoryName = typeof category === 'string' 
      ? category 
      : (category?.name || '')
    const key = categoryName?.toLowerCase() || 'default'
    return categoryConfig[key] || categoryConfig.default
  }

  const getAccountIcon = (type: string) => {
    const key = type?.toLowerCase() || 'default'
    return accountTypeIcons[key] || accountTypeIcons.default
  }

  // Calculate savings rate
  const savingsRate = totalIncome > 0 
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Elegant Header */}
      <div className="px-5 pt-14 pb-6 bg-white dark:bg-[#1a2332]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">Guten Tag</p>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('totalBalance')}</h1>
          </div>
          <Link 
            href="/settings"
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </Link>
        </div>

        {/* Main Balance Display - Money App Style - A2 Fix: Responsive */}
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-3 truncate px-4">
            {formatCurrency(totalBalance)}
          </h2>
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                -{formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Savings Indicator Ring */}
        <div className="flex justify-center mb-2">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-100 dark:text-gray-800"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(savingsRate, 0) * 3.51} 351`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">{Math.max(savingsRate, 0)}%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Sparquote</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-6 space-y-6">
        
        {/* Quick Actions - Minimal Style */}
        <div className="flex justify-center gap-4">
          <Link
            href="/transactions"
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Hinzufügen</span>
          </Link>
          <Link
            href="/transactions"
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Überweisen</span>
          </Link>
          <Link
            href="/analytics"
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Statistik</span>
          </Link>
        </div>

        {/* Accounts Card Carousel */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('accounts')}</h3>
            <Link href="/accounts" className="text-sm font-medium text-blue-500 flex items-center gap-1">
              {t('seeAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {accounts.length > 0 ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide">
                {accounts.map((account, idx) => {
                  const AccountIcon = getAccountIcon(account.type)
                  const gradients = [
                    'from-blue-500 via-blue-600 to-indigo-700',
                    'from-emerald-500 via-emerald-600 to-teal-700',
                    'from-purple-500 via-purple-600 to-violet-700',
                    'from-rose-500 via-rose-600 to-pink-700',
                    'from-amber-500 via-amber-600 to-orange-700',
                  ]
                  
                    return (
                    <div
                      key={account.id}
                      className={cn(
                        "flex-shrink-0 w-72 h-44 rounded-3xl p-5 text-white relative snap-center",
                        "bg-gradient-to-br shadow-xl",
                        gradients[idx % gradients.length]
                      )}
                    >
                      {/* Card Pattern */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
                      
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
                          <p className="text-sm opacity-80 mb-1 truncate">{account.name}</p>
                          <p className="text-xl sm:text-2xl font-bold truncate">
                            {formatCurrency(account.balance, account.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Scroll Indicator Dots */}
              {accounts.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2">
                  {accounts.slice(0, 5).map((_, idx) => (
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
              href="/accounts"
              className="flex items-center justify-center h-44 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">{t('addAccount')}</span>
              </div>
            </Link>
          )}
        </div>

        {/* Recent Transactions - Clean List Style */}
        <div className="bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('recentTransactions')}</h3>
            <Link href="/transactions" className="text-sm font-medium text-blue-500 flex items-center gap-1">
              {t('seeAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">{t('noTransactions')}</p>
            </div>
          ) : (
            <div className="px-5 pb-5 space-y-1">
              {recentTransactions.map((transaction) => {
                const config = getCategoryConfig(transaction.category)
                const Icon = config.icon
                const isIncome = transaction.type === 'income'
                
                return (
                  <Link
                    key={transaction.id}
                    href="/transactions"
                    className="flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#232e40] transition-colors"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", config.bg)}>
                      <Icon className={cn("w-5 h-5", config.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {transaction.description || (isIncome ? t('income') : t('expense'))}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(transaction.transactionDate).toLocaleDateString('de-CH', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                    <p className={cn(
                      "text-sm font-semibold tabular-nums",
                      isIncome ? "text-emerald-500" : "text-gray-900 dark:text-white"
                    )}>
                      {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Budgets - Beautiful Progress Style */}
        {budgets.length > 0 && (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('budgets')}</h3>
              <Link href="/budgets" className="text-sm font-medium text-blue-500 flex items-center gap-1">
                {t('seeAll')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="px-5 pb-5 space-y-4">
              {budgets.slice(0, 3).map((budget) => {
                const progress = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0
                const remaining = Math.max(budget.amount - budget.spent, 0)
                const isOverBudget = progress >= 100
                const isWarning = progress >= 80 && progress < 100
                const config = getCategoryConfig(budget.category || budget.name)
                
                return (
                  <Link
                    key={budget.id}
                    href="/budgets"
                    className="block p-4 rounded-2xl bg-gray-50 dark:bg-[#232e40] hover:bg-gray-100 dark:hover:bg-[#2a3544] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg)}>
                        <config.icon className={cn("w-5 h-5", config.iconColor)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{budget.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(remaining, budget.currency)} übrig
                        </p>
                      </div>
                      <span className={cn(
                        "text-sm font-semibold tabular-nums",
                        isOverBudget ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          isOverBudget 
                            ? "bg-gradient-to-r from-rose-400 to-rose-500" 
                            : isWarning 
                              ? "bg-gradient-to-r from-amber-400 to-amber-500"
                              : "bg-gradient-to-r from-emerald-400 to-blue-500"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom Spacing for Nav */}
        <div className="h-24" />
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  )
}
