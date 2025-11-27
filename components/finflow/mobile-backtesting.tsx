"use client"

import { useState } from "react"
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
  Play,
  Settings2,
  ChevronDown,
  Target,
  Award,
  Clock,
  DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "@/hooks/use-currency"
import MobilePageHeader from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"

interface BacktestResult {
  metrics: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    totalReturn: number
    totalReturnPercent: number
    maxDrawdown: number
    maxDrawdownPercent: number
    sharpeRatio: number
    profitFactor: number
    averageWin: number
    averageLoss: number
    largestWin: number
    largestLoss: number
  }
}

interface MobileBacktestingProps {
  user?: { id: string; email: string; fullName?: string }
}

// Modern date range pills
const TIME_PERIODS = [
  { value: '7', label: '7T' },
  { value: '14', label: '14T' },
  { value: '30', label: '30T' },
  { value: '60', label: '60T' },
  { value: '90', label: '3M' },
]

const CRYPTOS = [
  { value: 'BTC', label: 'Bitcoin', short: 'BTC' },
  { value: 'ETH', label: 'Ethereum', short: 'ETH' },
  { value: 'BNB', label: 'Binance Coin', short: 'BNB' },
  { value: 'SOL', label: 'Solana', short: 'SOL' },
  { value: 'ADA', label: 'Cardano', short: 'ADA' },
  { value: 'DOT', label: 'Polkadot', short: 'DOT' },
]

const STRATEGIES = [
  { value: 'conservative', label: 'Konservativ', color: 'bg-blue-500', risk: 'Niedriges Risiko' },
  { value: 'moderate', label: 'Moderat', color: 'bg-amber-500', risk: 'Mittleres Risiko' },
  { value: 'aggressive', label: 'Aggressiv', color: 'bg-rose-500', risk: 'Hohes Risiko' },
]

export default function MobileBacktesting({ user }: MobileBacktestingProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  
  // Config state
  const [symbol, setSymbol] = useState('BTC')
  const [strategy, setStrategy] = useState('moderate')
  const [initialCapital, setInitialCapital] = useState(1000)
  const [days, setDays] = useState('30')
  const [showConfig, setShowConfig] = useState(true)
  
  // Results state
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runBacktest = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(days))

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/backtesting/run`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            symbol,
            quoteCurrency: currency,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            initialCapital,
            strategy,
            stopLossPercent: strategy === 'conservative' ? 5 : strategy === 'moderate' ? 8 : 12,
            takeProfitPercent: strategy === 'conservative' ? 10 : strategy === 'moderate' ? 15 : 25,
            positionSize: strategy === 'conservative' ? 0.2 : strategy === 'moderate' ? 0.25 : 0.5,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Backtest fehlgeschlagen')
      }

      const data = await response.json()
      setResult(data)
      setShowConfig(false)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ausführen des Backtests')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value)
  }

  const selectedCrypto = CRYPTOS.find(c => c.value === symbol)
  const selectedStrategy = STRATEGIES.find(s => s.value === strategy)

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader 
        user={user}
        title={t('backtesting') || 'Backtesting'}
      />

      <div className="px-5 py-4 pb-32 space-y-5">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Backtesting Engine</h2>
              <p className="text-sm text-white/70">Strategien testen</p>
            </div>
          </div>
          <p className="text-sm text-white/80">
            Testen Sie Ihre Trading-Strategien mit historischen Daten bevor Sie echtes Geld riskieren.
          </p>
        </div>

        {/* Configuration Section */}
        <div className="bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Konfiguration</span>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-gray-400 transition-transform",
              showConfig && "rotate-180"
            )} />
          </button>

          {showConfig && (
            <div className="p-4 space-y-5">
              {/* Cryptocurrency Selection */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Kryptowährung
                </label>
                <div className="flex flex-wrap gap-2">
                  {CRYPTOS.map((crypto) => (
                    <button
                      key={crypto.value}
                      onClick={() => setSymbol(crypto.value)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        symbol === crypto.value
                          ? "bg-violet-500 text-white"
                          : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {crypto.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strategy Selection */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Strategie
                </label>
                <div className="space-y-2">
                  {STRATEGIES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStrategy(s.value)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                        strategy === s.value
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <div className={cn("w-3 h-3 rounded-full", s.color)} />
                      <div className="flex-1 text-left">
                        <p className={cn(
                          "font-medium",
                          strategy === s.value
                            ? "text-violet-600 dark:text-violet-400"
                            : "text-gray-700 dark:text-gray-300"
                        )}>
                          {s.label}
                        </p>
                        <p className="text-xs text-gray-400">{s.risk}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Period - Modern Pills */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Zeitraum
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {TIME_PERIODS.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setDays(period.value)}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        days === period.value
                          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                          : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Capital */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Startkapital ({currency})
                </label>
                <div className="flex gap-2">
                  {[500, 1000, 2500, 5000, 10000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setInitialCapital(amount)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                        initialCapital === amount
                          ? "bg-violet-500 text-white"
                          : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {amount >= 1000 ? `${amount / 1000}k` : amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Return Card */}
            <div className={cn(
              "rounded-2xl p-5 text-white",
              result.metrics.totalReturn >= 0
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                : "bg-gradient-to-br from-rose-500 to-rose-600"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-80">Gesamtrendite</span>
                <span className="text-xs opacity-70">{selectedCrypto?.short} • {days} Tage</span>
              </div>
              <p className="text-3xl font-bold mb-1">
                {formatCurrency(result.metrics.totalReturn)}
              </p>
              <div className="flex items-center gap-2">
                {result.metrics.totalReturn >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {result.metrics.totalReturnPercent >= 0 ? '+' : ''}
                  {result.metrics.totalReturnPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-400">Win Rate</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.metrics.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">
                  {result.metrics.winningTrades}W / {result.metrics.losingTrades}L
                </p>
              </div>

              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-400">Trades</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.metrics.totalTrades}
                </p>
                <p className="text-xs text-gray-400">
                  Gesamt ausgeführt
                </p>
              </div>

              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-gray-400">Sharpe Ratio</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.metrics.sharpeRatio.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  Risikoadjustiert
                </p>
              </div>

              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span className="text-xs text-gray-400">Max Drawdown</span>
                </div>
                <p className="text-xl font-bold text-rose-500">
                  -{result.metrics.maxDrawdownPercent.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-400">
                  {formatCurrency(result.metrics.maxDrawdown)}
                </p>
              </div>
            </div>

            {/* Win/Loss Details */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Gewinn/Verlust Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Ø Gewinn</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(result.metrics.averageWin)}</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                  <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">Ø Verlust</p>
                  <p className="text-lg font-bold text-rose-600">{formatCurrency(Math.abs(result.metrics.averageLoss))}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Grösster Gewinn</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(result.metrics.largestWin)}</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                  <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">Grösster Verlust</p>
                  <p className="text-lg font-bold text-rose-600">{formatCurrency(Math.abs(result.metrics.largestLoss))}</p>
                </div>
              </div>
            </div>

            {/* Profit Factor */}
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Profit Factor</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    result.metrics.profitFactor >= 1.5 ? "text-emerald-500" :
                    result.metrics.profitFactor >= 1 ? "text-amber-500" : "text-rose-500"
                  )}>
                    {result.metrics.profitFactor.toFixed(2)}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  {result.metrics.profitFactor >= 1.5 ? 'Gut' :
                   result.metrics.profitFactor >= 1 ? 'Neutral' : 'Schlecht'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB - Run Backtest */}
      <button
        onClick={runBacktest}
        disabled={loading}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full shadow-2xl shadow-violet-500/40 flex items-center justify-center active:scale-95 transition-transform z-20 disabled:opacity-50"
        aria-label="Backtest starten"
      >
        {loading ? (
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        ) : (
          <Play className="w-7 h-7 text-white ml-1" />
        )}
      </button>

      <MobileBottomNav />
    </div>
  )
}
