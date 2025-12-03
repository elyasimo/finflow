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
  ChevronLeft,
  ChevronRight,
  Loader2,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileHeader from "./mobile-header"
import MobileBottomNav from "./mobile-bottom-nav"
import MobileSVGChart from "./mobile-svg-chart"

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
  const { t, language } = useLanguage()
  const { currency } = useCurrency()
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'budgets'>('overview')
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
  }

  // Map language code to locale for date formatting
  const getLocale = () => {
    const localeMap: Record<string, string> = {
      'de': 'de-DE',
      'en': 'en-US',
      'fr': 'fr-FR',
      'ar': 'ar-SA'
    }
    return localeMap[language] || 'de-DE'
  }

  const monthLabel = selectedMonth.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' })

  // Generate months for picker (current year +/- 2 years)
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
  const months = [
    { value: 0, labelKey: 'january' },
    { value: 1, labelKey: 'february' },
    { value: 2, labelKey: 'march' },
    { value: 3, labelKey: 'april' },
    { value: 4, labelKey: 'may' },
    { value: 5, labelKey: 'june' },
    { value: 6, labelKey: 'july' },
    { value: 7, labelKey: 'august' },
    { value: 8, labelKey: 'september' },
    { value: 9, labelKey: 'october' },
    { value: 10, labelKey: 'november' },
    { value: 11, labelKey: 'december' },
  ]

  const [pickerYear, setPickerYear] = useState(selectedMonth.getFullYear())

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(pickerYear, month, 1)
    onMonthChange(newDate)
    setShowMonthPicker(false)
  }

  const handlePrevYear = () => setPickerYear(y => y - 1)
  const handleNextYear = () => setPickerYear(y => y + 1)

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
      <div className="h-screen bg-[#f8f9fc] dark:bg-[#0f1623] flex flex-col overflow-hidden">
        <MobileHeader title={t('reports')} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('loadingReports') || 'Loading reports...'}</p>
        </div>
        <MobileBottomNav fixed />
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#f8f9fc] dark:bg-[#0f1623] flex flex-col overflow-hidden">
      {/* Header - stays fixed at top */}
      <MobileHeader title={t('reports')} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 pt-4 pb-28">
        {/* Month Selector */}
        <button 
          onClick={() => {
            setPickerYear(selectedMonth.getFullYear())
            setShowMonthPicker(true)
          }}
          className="w-full bg-white dark:bg-[#1a2332] rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">{monthLabel}</span>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>

        {/* Month Picker Modal */}
        {showMonthPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMonthPicker(false)}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-[#1a2332] rounded-3xl p-6 pb-8 animate-scale-in shadow-2xl max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('selectMonth')}
                </h3>
                <button
                  onClick={() => setShowMonthPicker(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Year Selector */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePrevYear}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {pickerYear}
                </span>
                <button
                  onClick={handleNextYear}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-3 pb-8">
                {months.map((month) => {
                  const isSelected = 
                    selectedMonth.getMonth() === month.value && 
                    selectedMonth.getFullYear() === pickerYear
                  const isCurrent = 
                    new Date().getMonth() === month.value && 
                    new Date().getFullYear() === pickerYear
                  
                  return (
                    <button
                      key={month.value}
                      onClick={() => handleMonthSelect(month.value)}
                      className={cn(
                        "py-3 px-2 rounded-xl text-sm font-medium transition-all",
                        isSelected
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : isCurrent
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "bg-gray-100 dark:bg-[#232e40] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a3a50]"
                      )}
                    >
                      {t(month.labelKey as any)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-3 shadow-sm overflow-hidden">
            <ArrowDownLeft className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('income')}</p>
            <p className="text-sm sm:text-lg font-bold text-emerald-500 truncate">{formatCurrency(income)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-3 shadow-sm overflow-hidden">
            <ArrowUpRight className="w-5 h-5 text-rose-500 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('expenses')}</p>
            <p className="text-sm sm:text-lg font-bold text-rose-500 truncate">{formatCurrency(expenses)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-3 shadow-sm overflow-hidden">
            <DollarSign className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('balance')}</p>
            <p className={cn(
              "text-sm sm:text-lg font-bold truncate",
              balance >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Tab Navigation - Fixed inside container */}
        <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-2 mb-4 shadow-sm">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', labelKey: 'overview', icon: BarChart3 },
              { id: 'income', labelKey: 'income', icon: TrendingUp },
              { id: 'expenses', labelKey: 'expenses', icon: PieChart },
              { id: 'budgets', labelKey: 'budgets', icon: DollarSign },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center",
                    activeTab === tab.id
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#232e40]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t(tab.labelKey as any)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Income vs Expenses Bar */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t('incomeVsExpenses')}
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
                {t('transactionDistribution')}
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

        {/* Income Tab - Interactive SVG Line Chart */}
        {activeTab === 'income' && (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t('incomeTrend')}
            </h3>
            {incomeTrends.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('noIncomeData')}</p>
              </div>
            ) : (
              <MobileSVGChart
                type="line"
                height={200}
                data={incomeTrends.map(t => ({
                  label: t.month,
                  value: t.income
                }))}
                primaryColor="#10b981"
                formatValue={(v) => formatCurrency(v)}
              />
            )}
          </div>
        )}

        {/* Expenses Tab - Interactive Donut Chart */}
        {activeTab === 'expenses' && (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t('expensesByCategory')}
            </h3>
            {categoryData.length === 0 ? (
              <div className="py-8 text-center">
                <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('noExpensesInPeriod')}</p>
              </div>
            ) : (
              <MobileSVGChart
                type="donut"
                height={240}
                data={categoryData.map(c => ({
                  label: c.name,
                  value: c.amount,
                  color: c.color
                }))}
                formatValue={(v) => formatCurrency(v)}
              />
            )}
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="space-y-3">
            {budgetPerformance.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center shadow-sm">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('noBudgetsForPeriod')}</p>
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
                          {formatCurrency(budget.spent)} {t('of')} {formatCurrency(budget.amount)}
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
                      <span className="text-gray-400">{t('budgetSpent')}</span>
                      <span className={cn(
                        "font-medium",
                        budget.remaining > 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {budget.remaining > 0 ? `${formatCurrency(budget.remaining)} ${t('remainingBudget')}` : `${formatCurrency(Math.abs(budget.remaining))} ${t('exceededBudget')}`}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />

      {/* CSS Animation for Month Picker */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
