"use client"

import { useState } from "react"
import { 
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
  PieChart,
  Calculator,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobilePageHeader, { MobilePageHeaderSpacer } from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"

interface RiskMetrics {
  var95: number
  var99: number
  cvar95: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  volatility: number
  downsideVolatility: number
  beta: number
  maxDrawdown: number
  maxDrawdownPercent: number
  currentDrawdown: number
  currentDrawdownPercent: number
  portfolioValue: number
  dailyReturn: number
  dailyReturnPercent: number
  calculationPeriod: string
  lastUpdated: string
}

interface PortfolioAsset {
  asset: string
  quantity: number
  currentPrice: number
}

interface MobileRiskAnalysisPageProps {
  user?: {
    id: string
    email: string
    fullName?: string
  }
  portfolio?: PortfolioAsset[]
  currency?: string
  onCalculateRisk: (positions: PortfolioAsset[]) => Promise<RiskMetrics>
}

// Risk level labels
const getRiskRating = (sharpeRatio: number): { label: string; color: string; bgColor: string } => {
  if (sharpeRatio > 2) return { label: 'Ausgezeichnet', color: 'text-emerald-500', bgColor: 'bg-emerald-500/20' }
  if (sharpeRatio > 1) return { label: 'Gut', color: 'text-blue-500', bgColor: 'bg-blue-500/20' }
  if (sharpeRatio > 0) return { label: 'Moderat', color: 'text-amber-500', bgColor: 'bg-amber-500/20' }
  return { label: 'Niedrig', color: 'text-rose-500', bgColor: 'bg-rose-500/20' }
}

const getVolatilityRating = (vol: number): { label: string; color: string } => {
  if (vol < 20) return { label: 'Niedrig', color: 'text-emerald-500' }
  if (vol < 40) return { label: 'Moderat', color: 'text-amber-500' }
  if (vol < 60) return { label: 'Hoch', color: 'text-orange-500' }
  return { label: 'Sehr Hoch', color: 'text-rose-500' }
}

export default function MobileRiskAnalysisPage({
  user,
  portfolio = [],
  currency = 'EUR',
  onCalculateRisk
}: MobileRiskAnalysisPageProps) {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('overview')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0)
  }

  const handleCalculateRisk = async () => {
    if (!portfolio || portfolio.length === 0) {
      setError('Keine Portfolio-Daten verfügbar. Bitte verbinden Sie zuerst Ihr Krypto-Portfolio.')
      return
    }

    setIsCalculating(true)
    setError(null)

    try {
      const result = await onCalculateRisk(portfolio)
      setMetrics(result)
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Risikoberechnung')
    } finally {
      setIsCalculating(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Metric Card Component
  const MetricCard = ({ 
    label, 
    value, 
    subValue, 
    icon: Icon,
    color = 'text-gray-900 dark:text-white',
    trend
  }: {
    label: string
    value: string | number
    subValue?: string
    icon?: React.ElementType
    color?: string
    trend?: 'up' | 'down'
  }) => (
    <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold", color)}>{value}</span>
        {trend && (
          trend === 'up' 
            ? <TrendingUp className="w-4 h-4 text-emerald-500" />
            : <TrendingDown className="w-4 h-4 text-rose-500" />
        )}
      </div>
      {subValue && (
        <p className="text-xs text-gray-500 mt-1">{subValue}</p>
      )}
    </div>
  )

  // Expandable Section Component
  const ExpandableSection = ({
    id,
    title,
    icon: Icon,
    iconColor,
    children
  }: {
    id: string
    title: string
    icon: React.ElementType
    iconColor: string
    children: React.ReactNode
  }) => (
    <div className="bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColor)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        {expandedSection === id ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expandedSection === id && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader 
        user={user as any} 
        title="Risikoanalyse"
      />
      <MobilePageHeaderSpacer />

      <div className="px-5 py-6 space-y-6">
        {/* Calculate Button - Always Visible */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Portfolio-Risiko</h2>
              <p className="text-indigo-200 text-sm">
                {portfolio.length > 0 
                  ? `${portfolio.length} Assets analysierbar` 
                  : 'Keine Assets verfügbar'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleCalculateRisk}
            disabled={isCalculating || portfolio.length === 0}
            className={cn(
              "w-full py-4 rounded-2xl font-semibold text-lg",
              "bg-white text-indigo-600",
              "shadow-lg shadow-indigo-500/30",
              "hover:bg-indigo-50 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all flex items-center justify-center gap-3"
            )}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Berechnung läuft...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Risiko berechnen
              </>
            )}
          </button>
          
          {metrics && (
            <p className="text-xs text-indigo-200 text-center mt-3">
              Zuletzt berechnet: {new Date(metrics.lastUpdated).toLocaleString('de-CH')}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!metrics && !isCalculating && (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-8 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Analyse vorhanden
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Klicken Sie auf "Risiko berechnen", um Ihr Portfolio zu analysieren.
            </p>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-left">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Professionelle Risikometriken
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    VaR, Sharpe Ratio, Volatilität, Drawdown und mehr
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Display */}
        {metrics && (
          <>
            {/* Portfolio Overview */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Portfoliowert"
                value={formatCurrency(metrics.portfolioValue)}
                subValue={`${metrics.dailyReturnPercent >= 0 ? '+' : ''}${metrics.dailyReturnPercent.toFixed(2)}% heute`}
                icon={Zap}
                trend={metrics.dailyReturn >= 0 ? 'up' : 'down'}
              />
              <MetricCard
                label="Sharpe Ratio"
                value={metrics.sharpeRatio.toFixed(2)}
                subValue={getRiskRating(metrics.sharpeRatio).label}
                icon={Target}
                color={getRiskRating(metrics.sharpeRatio).color}
              />
              <MetricCard
                label="Volatilität"
                value={`${metrics.volatility.toFixed(1)}%`}
                subValue={getVolatilityRating(metrics.volatility).label}
                icon={Activity}
                color={getVolatilityRating(metrics.volatility).color}
              />
              <MetricCard
                label="Max Drawdown"
                value={`-${metrics.maxDrawdownPercent.toFixed(1)}%`}
                subValue={formatCurrency(metrics.maxDrawdown)}
                icon={TrendingDown}
                color="text-rose-500"
              />
            </div>

            {/* Detailed Sections */}
            <div className="space-y-3">
              {/* Value at Risk */}
              <ExpandableSection
                id="var"
                title="Value at Risk"
                icon={AlertTriangle}
                iconColor="bg-rose-500"
              >
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                    <p className="text-sm text-rose-700 dark:text-rose-300">
                      VaR schätzt den maximalen potenziellen Verlust über einen 1-Tages-Zeitraum.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">VaR (95%)</p>
                      <p className="text-xl font-bold text-rose-500">{formatCurrency(metrics.var95)}</p>
                      <p className="text-xs text-gray-400 mt-1">95% Wahrscheinlichkeit, dass Verluste diesen Wert nicht überschreiten</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">VaR (99%)</p>
                      <p className="text-xl font-bold text-rose-500">{formatCurrency(metrics.var99)}</p>
                      <p className="text-xs text-gray-400 mt-1">99% Wahrscheinlichkeit</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">CVaR (Expected Shortfall)</p>
                      <p className="text-xl font-bold text-rose-500">{formatCurrency(metrics.cvar95)}</p>
                      <p className="text-xs text-gray-400 mt-1">Erwarteter Verlust bei VaR-Überschreitung</p>
                    </div>
                  </div>
                </div>
              </ExpandableSection>

              {/* Risk Ratios */}
              <ExpandableSection
                id="ratios"
                title="Risiko-Kennzahlen"
                icon={PieChart}
                iconColor="bg-blue-500"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500">Sharpe Ratio</p>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          getRiskRating(metrics.sharpeRatio).bgColor,
                          getRiskRating(metrics.sharpeRatio).color
                        )}>
                          {getRiskRating(metrics.sharpeRatio).label}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.sharpeRatio.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1">Rendite pro Risikoeinheit</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Sortino Ratio</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.sortinoRatio.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1">Fokussiert auf Abwärtsrisiko</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Calmar Ratio</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.calmarRatio.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1">Jahresrendite / Max Drawdown</p>
                    </div>
                  </div>
                </div>
              </ExpandableSection>

              {/* Volatility */}
              <ExpandableSection
                id="volatility"
                title="Volatilität"
                icon={Activity}
                iconColor="bg-amber-500"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Gesamtvolatilität</p>
                      <p className={cn("text-2xl font-bold", getVolatilityRating(metrics.volatility).color)}>
                        {metrics.volatility.toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Annualisierte Standardabweichung</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Abwärtsvolatilität</p>
                      <p className="text-2xl font-bold text-rose-500">{metrics.downsideVolatility.toFixed(2)}%</p>
                      <p className="text-xs text-gray-400 mt-1">Nur negative Renditen</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Beta (vs BTC)</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.beta.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {metrics.beta > 1 ? 'Volatiler als Bitcoin' : 'Weniger volatil als Bitcoin'}
                      </p>
                    </div>
                  </div>
                </div>
              </ExpandableSection>

              {/* Drawdown */}
              <ExpandableSection
                id="drawdown"
                title="Drawdown"
                icon={TrendingDown}
                iconColor="bg-purple-500"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Max Drawdown</p>
                      <p className="text-2xl font-bold text-rose-500">-{metrics.maxDrawdownPercent.toFixed(2)}%</p>
                      <p className="text-xs text-gray-400 mt-1">{formatCurrency(metrics.maxDrawdown)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#232e40] rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Aktuell</p>
                      <p className="text-2xl font-bold text-orange-500">-{metrics.currentDrawdownPercent.toFixed(2)}%</p>
                      <p className="text-xs text-gray-400 mt-1">{formatCurrency(metrics.currentDrawdown)}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-500 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Ein Drawdown misst den Rückgang vom historischen Höchststand. Niedrigere Werte bedeuten bessere Kapitalerhaltung.
                      </p>
                    </div>
                  </div>
                </div>
              </ExpandableSection>
            </div>

            {/* Calculation Period */}
            <p className="text-center text-sm text-gray-400">
              Berechnungszeitraum: {metrics.calculationPeriod}
            </p>
          </>
        )}

        {/* Bottom spacing */}
        <div className="h-24" />
      </div>

      <MobileBottomNav fixed />
    </div>
  )
}
