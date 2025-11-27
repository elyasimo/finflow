"use client"

import { useState, useMemo } from "react"
import { 
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ChevronDown,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileHeader from "./mobile-header"
import MobileBottomNav from "./mobile-bottom-nav"

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  category?: { name: string }
  transactionDate: string
  currency: string
}

interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  remaining: number
}

interface MobileReportsProps {
  income: number
  expenses: number
  balance: number
  transactions: Transaction[]
  budgetPerformance: Budget[]
  expensesByCategory: Record<string, number>
  incomeTrends: { month: string; income: number }[]
  isLoading: boolean
  selectedMonth: Date
  onMonthChange: (date: Date) => void
}

const categoryColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']

export default function MobileReports({
  income,
  expenses,
  balance,
  transactions,
  budgetPerformance,
  expensesByCategory,
  incomeTrends,
  isLoading,
  selectedMonth,
  onMonthChange,
}: MobileReportsProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'budgets'>('overview')

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const monthLabel = selectedMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  // Calculate category data with colors
  const categoryData = useMemo(() => {
    const total = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0)
    return Object.entries(expensesByCategory)
      .map(([name, amount], idx) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: categoryColors[idx % categoryColors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  }, [expensesByCategory])

  // Max values for charts
  const maxIncome = Math.max(...incomeTrends.map(t => t.income), 1)
  const maxBudget = Math.max(...budgetPerformance.map(b => Math.max(b.amount, b.spent)), 1)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
        <MobileHeader title={t('reports')} />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Lade Berichte...</p>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <MobileHeader title={t('reports')} />

      {/* Content */}
      <div className="px-4 pt-4 pb-28">
        {/* Month Selector */}
        <button className="w-full bg-white dark:bg-[#1a2332] rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">{monthLabel}</span>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-3 shadow-sm">
            <ArrowDownLeft className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('income')}</p>
            <p className="text-lg font-bold text-emerald-500">{formatCurrency(income)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-3 shadow-sm">
            <ArrowUpRight className="w-5 h-5 text-rose-500 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('expenses')}</p>
            <p className="text-lg font-bold text-rose-500">{formatCurrency(expenses)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-3 shadow-sm">
            <DollarSign className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('balance')}</p>
            <p className={cn(
              "text-lg font-bold",
              balance >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-4">
          {[
            { id: 'overview', label: 'Übersicht', icon: BarChart3 },
            { id: 'income', label: 'Einnahmen', icon: TrendingUp },
            { id: 'expenses', label: 'Ausgaben', icon: PieChart },
            { id: 'budgets', label: 'Budgets', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Income vs Expenses Bar */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Einnahmen vs. Ausgaben
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('income')}</span>
                    <span className="text-sm font-semibold text-emerald-500">{formatCurrency(income)}</span>
                  </div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min((income / (income + expenses || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('expenses')}</span>
                    <span className="text-sm font-semibold text-rose-500">{formatCurrency(expenses)}</span>
                  </div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${Math.min((expenses / (income + expenses || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Distribution */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Transaktionsverteilung
              </h3>
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-emerald-500">
                      {transactions.filter(t => t.type === 'income').length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{t('income')}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-rose-500">
                      {transactions.filter(t => t.type === 'expense').length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{t('expenses')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Income Tab */}
        {activeTab === 'income' && (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Einnahmen-Trend (6 Monate)
            </h3>
            {incomeTrends.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Keine Einnahmen-Daten verfügbar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomeTrends.map((trend, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{trend.month}</span>
                      <span className="text-sm font-semibold text-emerald-500">{formatCurrency(trend.income)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(trend.income / maxIncome) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Ausgaben nach Kategorie
            </h3>
            {categoryData.length === 0 ? (
              <div className="py-8 text-center">
                <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Keine Ausgaben in diesem Zeitraum</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryData.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{cat.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(cat.amount)} ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="space-y-3">
            {budgetPerformance.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center shadow-sm">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Keine Budgets für diesen Zeitraum</p>
              </div>
            ) : (
              budgetPerformance.map((budget) => {
                const percentUsed = (budget.spent / budget.amount) * 100
                const isOverBudget = percentUsed > 100
                
                return (
                  <div
                    key={budget.id}
                    className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{budget.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(budget.spent)} von {formatCurrency(budget.amount)}
                        </p>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-xs font-medium",
                        isOverBudget 
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                          : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {percentUsed.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          isOverBudget ? "bg-rose-500" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-gray-400">Ausgegeben</span>
                      <span className={cn(
                        "font-medium",
                        budget.remaining > 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {budget.remaining > 0 ? `${formatCurrency(budget.remaining)} übrig` : `${formatCurrency(Math.abs(budget.remaining))} darüber`}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
