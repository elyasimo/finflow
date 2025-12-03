"use client"

import { useState, useMemo } from "react"
import { 
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  Target,
  Bitcoin,
  Calendar,
  ChevronRight,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileHeader from "./mobile-header"
import MobileBottomNav from "./mobile-bottom-nav"
import MobileSVGChart from "./mobile-svg-chart"

interface BalanceData {
  date: string
  income: number
  expenses: number
  balance: number
}

interface CategorySpending {
  name: string
  amount: number
  percentage: number
  color: string
}

interface CryptoHolding {
  asset: string
  quantity: number
  priceEur: number
  valueEur: number
  priceChange24h: number
  monitoredBy?: string
}

interface MobileAnalyticsProps {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  categorySpending: CategorySpending[]
  cryptoPortfolio: CryptoHolding[]
  totalCryptoValue: number
  balanceData: BalanceData[]
  isLoading: boolean
  timeRange: string
  onTimeRangeChange: (range: string) => void
}

const timeRanges = [
  { id: '1', label: '1M' },
  { id: '3', label: '3M' },
  { id: '6', label: '6M' },
  { id: '12', label: '1J' },
]

export default function MobileAnalytics({
  totalIncome,
  totalExpenses,
  netBalance,
  categorySpending,
  cryptoPortfolio,
  totalCryptoValue,
  balanceData,
  isLoading,
  timeRange,
  onTimeRangeChange,
}: MobileAnalyticsProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [activeView, setActiveView] = useState<'overview' | 'categories' | 'crypto'>('overview')

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
  }

  // Simple bar chart visualization
  const maxBarValue = useMemo(() => {
    if (balanceData.length === 0) return 1
    return Math.max(...balanceData.map(d => Math.max(d.income, d.expenses)))
  }, [balanceData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
        <MobileHeader title={t('analytics')} />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Lade Analysen...</p>
        </div>
        <MobileBottomNav fixed />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <MobileHeader title={t('analytics')} />

      {/* Content */}
      <div className="px-4 pt-4 pb-28">
        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => onTimeRangeChange(range.id)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                timeRange === range.id
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-5 h-5 opacity-80 flex-shrink-0" />
              <span className="text-emerald-100 text-sm">{t('income')}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold truncate">{formatCurrency(totalIncome)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="w-5 h-5 opacity-80 flex-shrink-0" />
              <span className="text-rose-100 text-sm">{t('expenses')}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold truncate">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className={cn(
          "rounded-2xl p-5 mb-6 overflow-hidden",
          netBalance >= 0 
            ? "bg-gradient-to-br from-blue-500 to-blue-600" 
            : "bg-gradient-to-br from-orange-500 to-orange-600"
        )}>
          <div className="flex items-center justify-between text-white">
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-sm opacity-80 mb-1">{t('balance')}</p>
              <p className="text-2xl sm:text-3xl font-bold truncate">{formatCurrency(netBalance)}</p>
            </div>
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              netBalance >= 0 ? "bg-white/20" : "bg-white/20"
            )}>
              {netBalance >= 0 ? (
                <TrendingUp className="w-7 h-7" />
              ) : (
                <TrendingDown className="w-7 h-7" />
              )}
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setActiveView('overview')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              activeView === 'overview'
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
            )}
          >
            <Calendar className="w-4 h-4" />
            Übersicht
          </button>
          <button
            onClick={() => setActiveView('categories')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              activeView === 'categories'
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
            )}
          >
            <PieChart className="w-4 h-4" />
            Kategorien
          </button>
          <button
            onClick={() => setActiveView('crypto')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              activeView === 'crypto'
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
            )}
          >
            <Bitcoin className="w-4 h-4" />
            Krypto
          </button>
        </div>

        {/* Overview View - Interactive SVG Bar Chart */}
        {activeView === 'overview' && (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Einnahmen vs. Ausgaben
            </h3>
            {balanceData.length > 0 ? (
              <MobileSVGChart
                type="bar"
                height={220}
                data={balanceData.slice(-6).map(d => ({
                  label: d.date,
                  value: d.income,
                  secondaryValue: d.expenses,
                  color: '#ef4444' // Expenses color
                }))}
                primaryColor="#10b981"
                secondaryColor="#ef4444"
                formatValue={(v) => formatCurrency(v)}
              />
            ) : (
              <div className="py-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Keine Daten verfügbar</p>
              </div>
            )}
            
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Einnahmen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Ausgaben</span>
              </div>
            </div>
          </div>
        )}

        {/* Categories View - Interactive Donut Chart */}
        {activeView === 'categories' && (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Top Ausgaben-Kategorien
            </h3>
            {categorySpending.length === 0 ? (
              <div className="py-8 text-center">
                <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Keine Ausgaben in diesem Zeitraum</p>
              </div>
            ) : (
              <>
                <MobileSVGChart
                  type="donut"
                  height={240}
                  data={categorySpending.map(c => ({
                    label: c.name,
                    value: c.amount,
                    color: c.color
                  }))}
                  formatValue={(v) => formatCurrency(v)}
                />
                
                {/* Category List */}
                <div className="mt-4 space-y-3">
                  {categorySpending.slice(0, 5).map((category, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                          {category.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(category.amount)}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({category.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Crypto View */}
        {activeView === 'crypto' && (
          <div className="space-y-4">
            {/* Crypto Total */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm opacity-80 mb-1">Krypto-Portfolio</p>
                  <p className="text-2xl sm:text-3xl font-bold truncate">{formatCurrency(totalCryptoValue)}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Bitcoin className="w-7 h-7" />
                </div>
              </div>
            </div>

            {/* Crypto Holdings */}
            {cryptoPortfolio.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
                <Bitcoin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Kein Krypto-Portfolio gefunden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cryptoPortfolio.map((crypto) => (
                  <div
                    key={crypto.asset}
                    className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {crypto.asset}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {crypto.quantity.toFixed(6)} Einheiten
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(crypto.valueEur)}
                        </p>
                        <div className={cn(
                          "flex items-center justify-end gap-1 text-sm",
                          crypto.priceChange24h >= 0 
                            ? "text-emerald-500" 
                            : "text-rose-500"
                        )}>
                          {crypto.priceChange24h >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span className="font-medium">
                            {Math.abs(crypto.priceChange24h).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {crypto.monitoredBy && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          🤖 Überwacht von: {crypto.monitoredBy}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  )
}
