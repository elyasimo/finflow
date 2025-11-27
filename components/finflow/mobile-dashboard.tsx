"use client"

import { useMemo } from "react"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import Link from "next/link"

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  color?: string
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
}

interface MobileDashboardProps {
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  totalBalance: number
  totalIncome: number
  totalExpenses: number
}

// Color palette for account cards
const accountColors = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600", 
  "from-emerald-500 to-emerald-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-cyan-500 to-cyan-600",
]

// Category icons and colors
const categoryStyles: Record<string, { bg: string, text: string }> = {
  'income': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  'salary': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  'food': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  'transport': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  'shopping': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
  'entertainment': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  'bills': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  'health': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  'default': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
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
      .slice(0, 5),
    [transactions]
  )

  const getCategoryStyle = (category?: string | { name?: string }) => {
    // Handle both string and object category types
    const categoryName = typeof category === 'string' 
      ? category 
      : (category?.name || '')
    const key = categoryName?.toLowerCase() || 'default'
    return categoryStyles[key] || categoryStyles.default
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium mb-1">{t('totalBalance')}</p>
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            {formatCurrency(totalBalance)}
          </h1>
          
          {/* Income/Expense Summary */}
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span className="text-xs text-blue-100">{t('income')}</span>
              </div>
              <p className="text-lg font-semibold">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-red-400/20 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-red-300" />
                </div>
                <span className="text-xs text-blue-100">{t('expenses')}</span>
              </div>
              <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Plus, label: t('add'), href: '/transactions', color: 'bg-blue-500' },
          { icon: ArrowUpRight, label: t('send'), href: '/transactions', color: 'bg-purple-500' },
          { icon: ArrowDownLeft, label: t('topUp'), href: '/transactions', color: 'bg-emerald-500' },
          { icon: MoreHorizontal, label: t('more'), href: '/accounts', color: 'bg-orange-500' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1a2332] shadow-sm border border-gray-100 dark:border-[#232e40] active:scale-95 transition-transform"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", action.color)}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Accounts Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('accounts')}</h2>
          <Link href="/accounts" className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
            {t('seeAll')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {accounts.slice(0, 5).map((account, idx) => (
            <Link
              key={account.id}
              href={`/accounts`}
              className={cn(
                "flex-shrink-0 w-44 rounded-2xl p-4 text-white shadow-lg",
                "bg-gradient-to-br",
                accountColors[idx % accountColors.length]
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium opacity-90 truncate">{account.type}</span>
              </div>
              <p className="text-xs opacity-75 truncate mb-1">{account.name}</p>
              <p className="text-lg font-bold">
                {formatCurrency(account.balance / 100, account.currency)}
              </p>
            </Link>
          ))}
          
          {/* Add Account Card */}
          <Link
            href="/accounts"
            className="flex-shrink-0 w-44 rounded-2xl p-4 border-2 border-dashed border-gray-200 dark:border-[#232e40] flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="text-xs font-medium">{t('addAccount')}</span>
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-sm border border-gray-100 dark:border-[#232e40] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#232e40]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('recentTransactions')}</h2>
          <Link href="/transactions" className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
            {t('seeAll')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-[#232e40]">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('noTransactions')}</p>
            </div>
          ) : (
            recentTransactions.map((transaction) => {
              const style = getCategoryStyle(transaction.category)
              const isIncome = transaction.type === 'income'
              
              return (
                <Link
                  key={transaction.id}
                  href="/transactions"
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#232e40] transition-colors active:bg-gray-100 dark:active:bg-[#2a3544]"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", style.bg)}>
                    {isIncome ? (
                      <TrendingUp className={cn("w-5 h-5", style.text)} />
                    ) : (
                      <TrendingDown className={cn("w-5 h-5", style.text)} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {transaction.description || (isIncome ? t('income') : t('expense'))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold",
                    isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                  )}>
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                  </p>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Budgets */}
      {budgets.length > 0 && (
        <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-sm border border-gray-100 dark:border-[#232e40] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#232e40]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('budgets')}</h2>
          <Link href="/budgets" className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
            {t('seeAll')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>          <div className="p-4 space-y-4">
            {budgets.slice(0, 3).map((budget) => {
              const progress = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0
              const isOverBudget = progress >= 100
              const isWarning = progress >= 80 && progress < 100
              
              return (
                <Link
                  key={budget.id}
                  href="/budgets"
                  className="block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{budget.name}</span>
                    <span className={cn(
                      "text-xs font-semibold",
                      isOverBudget ? "text-red-500" : isWarning ? "text-orange-500" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-[#232e40] rounded-full overflow-hidden mb-2">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOverBudget ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatCurrency(budget.spent, budget.currency)} {t('spent')}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatCurrency(budget.amount, budget.currency)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
