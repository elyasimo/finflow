"use client"

import { useState, useEffect } from "react"
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Loader2,
  Award,
  Target,
  ChevronDown,
  BarChart3,
  Percent
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "@/hooks/use-currency"
import MobilePageHeader, { MobilePageHeaderSpacer } from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"

interface PerformanceStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalProfit: number
  totalLoss: number
  netProfit: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
}

interface MobileTradingPerformanceProps {
  user?: { id: string; email: string; fullName?: string }
}

// Modern date range options
const DATE_RANGES = [
  { value: '7', label: '7 Tage', short: '7T' },
  { value: '14', label: '14 Tage', short: '14T' },
  { value: '30', label: '30 Tage', short: '30T' },
  { value: '60', label: '60 Tage', short: '60T' },
  { value: '90', label: '3 Monate', short: '3M' },
  { value: '180', label: '6 Monate', short: '6M' },
  { value: '365', label: '1 Jahr', short: '1J' },
]

export default function MobileTradingPerformance({ user }: MobileTradingPerformanceProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [timeRange, setTimeRange] = useState('30')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPerformance()
  }, [timeRange])

  const loadPerformance = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/trading-agents/performance?days=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      // Error loading performance - silently fail
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0)
  }

  const selectedRange = DATE_RANGES.find(r => r.value === timeRange)

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader 
        user={user}
        title={t('tradingPerformance') || 'Trading Performance'}
      />
      <MobilePageHeaderSpacer />

      {/* Date Range Selector - Modern Pills */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                timeRange === range.value
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
              )}
            >
              {range.short}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : stats ? (
        <div className="px-5 pb-32 space-y-5">
          {/* Net Profit Card */}
          <div className={cn(
            "rounded-3xl p-5 text-white",
            stats.netProfit >= 0 
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600" 
              : "bg-gradient-to-br from-rose-500 to-rose-600"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {stats.netProfit >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="text-sm font-medium opacity-90">Nettogewinn/-verlust</span>
              </div>
              <span className="text-xs opacity-70">{selectedRange?.label}</span>
            </div>
            <p className="text-3xl font-bold mb-1">
              {formatCurrency(stats.netProfit)}
            </p>
            <p className="text-sm opacity-80">
              Profit Factor: {stats.profitFactor.toFixed(2)}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Win Rate */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400">
                {stats.winningTrades}W / {stats.losingTrades}L
              </p>
            </div>

            {/* Total Trades */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Trades</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalTrades}
              </p>
              <p className="text-xs text-gray-400">
                Gesamt ausgeführt
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Sharpe Ratio</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.sharpeRatio.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">
                Risikoadjustiert
              </p>
            </div>

            {/* Max Drawdown */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Max Drawdown</span>
              </div>
              <p className="text-2xl font-bold text-rose-500">
                -{stats.maxDrawdown.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400">
                Grösster Rückgang
              </p>
            </div>
          </div>

          {/* Profit/Loss Breakdown */}
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Gewinn/Verlust Übersicht
            </h3>
            
            <div className="space-y-4">
              {/* Total Profit */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Gesamtgewinn</p>
                    <p className="text-xs text-gray-400">Ø {formatCurrency(stats.averageWin)}/Trade</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-emerald-500">
                  +{formatCurrency(stats.totalProfit)}
                </p>
              </div>

              {/* Total Loss */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Gesamtverlust</p>
                    <p className="text-xs text-gray-400">Ø {formatCurrency(Math.abs(stats.averageLoss))}/Trade</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-rose-500">
                  -{formatCurrency(Math.abs(stats.totalLoss))}
                </p>
              </div>
            </div>
          </div>

          {/* Win/Loss Visual */}
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Trade Verteilung
            </h3>
            
            {/* Progress Bar */}
            <div className="h-4 bg-gray-100 dark:bg-[#232e40] rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>

            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Gewinner: {stats.winningTrades} ({stats.winRate.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-gray-600 dark:text-gray-400">
                  Verlierer: {stats.losingTrades}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Risiko-Metriken
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profit Factor</p>
                <p className={cn(
                  "text-lg font-bold",
                  stats.profitFactor >= 1.5 ? "text-emerald-500" : 
                  stats.profitFactor >= 1 ? "text-amber-500" : "text-rose-500"
                )}>
                  {stats.profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sharpe Ratio</p>
                <p className={cn(
                  "text-lg font-bold",
                  stats.sharpeRatio >= 1 ? "text-emerald-500" : 
                  stats.sharpeRatio >= 0.5 ? "text-amber-500" : "text-rose-500"
                )}>
                  {stats.sharpeRatio.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Drawdown</p>
                <p className="text-lg font-bold text-rose-500">
                  -{stats.maxDrawdown.toFixed(2)}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Win/Loss</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(stats.averageWin / Math.abs(stats.averageLoss || 1)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-20">
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
            <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Keine Trading-Daten
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Starten Sie mit dem Trading, um Ihre Performance hier zu sehen.
            </p>
          </div>
        </div>
      )}

      <MobileBottomNav fixed />
    </div>
  )
}
