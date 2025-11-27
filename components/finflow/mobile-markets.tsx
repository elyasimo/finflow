"use client"

import { useState, useMemo } from "react"
import { 
  Search,
  TrendingUp,
  TrendingDown,
  Bitcoin,
  DollarSign,
  BarChart3,
  Loader2,
  RefreshCw,
  ChevronRight,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileHeader from "./mobile-header"
import MobileBottomNav from "./mobile-bottom-nav"

interface CryptoMarket {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap?: number
  total_volume?: number
  high_24h?: number
  low_24h?: number
}

interface Stock {
  symbol: string
  name: string
  price: number
  changePercent: number
  volume?: number
}

interface MobileMarketsProps {
  cryptoMarkets: CryptoMarket[]
  stocks?: Stock[]
  indices?: Stock[]
  commodities?: Stock[]
  forex?: any[]
  isLoading: boolean
  cryptoLoading: boolean
  onRefresh: () => void
}

const marketTabs = [
  { id: 'crypto', label: 'Krypto', icon: Bitcoin },
  { id: 'stocks', label: 'Aktien', icon: DollarSign },
  { id: 'indices', label: 'Indizes', icon: BarChart3 },
  { id: 'forex', label: 'Forex', icon: TrendingUp },
]

export default function MobileMarkets({
  cryptoMarkets,
  stocks = [],
  indices = [],
  commodities = [],
  forex = [],
  isLoading,
  cryptoLoading,
  onRefresh,
}: MobileMarketsProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [activeTab, setActiveTab] = useState('crypto')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: amount < 1 ? 6 : 2,
    }).format(amount)
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(2)}T`
    } else if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`
    } else {
      return formatCurrency(value)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Filter crypto markets based on search
  const filteredCrypto = useMemo(() => {
    if (!searchQuery) return cryptoMarkets
    const query = searchQuery.toLowerCase()
    return cryptoMarkets.filter(m => 
      m.symbol.toLowerCase().includes(query) ||
      m.name?.toLowerCase().includes(query)
    )
  }, [cryptoMarkets, searchQuery])

  // Filter stocks
  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks
    const query = searchQuery.toLowerCase()
    return stocks.filter(s => 
      s.symbol.toLowerCase().includes(query) ||
      s.name?.toLowerCase().includes(query)
    )
  }, [stocks, searchQuery])

  const getCryptoLogo = (symbol: string) => {
    const baseSymbol = symbol.replace('EUR', '').replace('USDT', '').toLowerCase()
    return `/logos/cryptocurrency/${baseSymbol}.png`
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <MobileHeader title={t('markets')} />

      {/* Content */}
      <div className="px-4 pt-4 pb-28">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Märkte durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
          />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
          >
            <RefreshCw className={cn(
              "w-4 h-4 text-gray-500",
              isRefreshing && "animate-spin"
            )} />
          </button>
        </div>

        {/* Market Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-4">
          {marketTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {/* Loading State */}
        {(isLoading || cryptoLoading) ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Lade Marktdaten...</p>
          </div>
        ) : (
          <>
            {/* Crypto Tab */}
            {activeTab === 'crypto' && (
              <div className="space-y-3">
                {filteredCrypto.length === 0 ? (
                  <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Keine Kryptowährungen gefunden</p>
                  </div>
                ) : (
                  filteredCrypto.map((crypto) => (
                    <div
                      key={crypto.id}
                      className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={getCryptoLogo(crypto.symbol)}
                            alt={crypto.symbol}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = '/logos/cryptocurrency/default.png'
                            }}
                          />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {crypto.symbol.replace('EUR', '').replace('USDT', '')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {crypto.name || crypto.symbol}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(crypto.current_price)}
                          </p>
                          <div className={cn(
                            "flex items-center justify-end gap-1 text-sm",
                            crypto.price_change_percentage_24h >= 0 
                              ? "text-emerald-500" 
                              : "text-rose-500"
                          )}>
                            {crypto.price_change_percentage_24h >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            <span className="font-medium">
                              {Math.abs(crypto.price_change_percentage_24h || 0).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      {crypto.market_cap && (
                        <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                          <div>
                            <span className="text-gray-400">Marktk.</span>
                            <span className="ml-1 font-medium text-gray-600 dark:text-gray-300">
                              {formatMarketCap(crypto.market_cap)}
                            </span>
                          </div>
                          {crypto.high_24h && (
                            <div>
                              <span className="text-gray-400">24h H</span>
                              <span className="ml-1 font-medium text-emerald-500">
                                {formatCurrency(crypto.high_24h)}
                              </span>
                            </div>
                          )}
                          {crypto.low_24h && (
                            <div>
                              <span className="text-gray-400">24h L</span>
                              <span className="ml-1 font-medium text-rose-500">
                                {formatCurrency(crypto.low_24h)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Stocks Tab */}
            {activeTab === 'stocks' && (
              <div className="space-y-3">
                {filteredStocks.length === 0 ? (
                  <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Keine Aktien verfügbar</p>
                  </div>
                ) : (
                  filteredStocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {stock.symbol}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {stock.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(stock.price)}
                          </p>
                          <div className={cn(
                            "flex items-center justify-end gap-1 text-sm",
                            stock.changePercent >= 0 
                              ? "text-emerald-500" 
                              : "text-rose-500"
                          )}>
                            {stock.changePercent >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            <span className="font-medium">
                              {Math.abs(stock.changePercent).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Indices Tab */}
            {activeTab === 'indices' && (
              <div className="space-y-3">
                {indices.length === 0 ? (
                  <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Keine Indizes verfügbar</p>
                  </div>
                ) : (
                  indices.map((index) => (
                    <div
                      key={index.symbol}
                      className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {index.symbol}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {index.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(index.price)}
                          </p>
                          <div className={cn(
                            "flex items-center justify-end gap-1 text-sm",
                            index.changePercent >= 0 
                              ? "text-emerald-500" 
                              : "text-rose-500"
                          )}>
                            {index.changePercent >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            <span className="font-medium">
                              {Math.abs(index.changePercent).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Forex Tab */}
            {activeTab === 'forex' && (
              <div className="space-y-3">
                {forex.length === 0 ? (
                  <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Keine Forex-Daten verfügbar</p>
                  </div>
                ) : (
                  forex.map((pair, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {pair.baseCurrency}/{pair.targetCurrency}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {pair.rate?.toFixed(4)}
                          </p>
                          {pair.changePercent !== undefined && (
                            <div className={cn(
                              "flex items-center justify-end gap-1 text-sm",
                              pair.changePercent >= 0 
                                ? "text-emerald-500" 
                                : "text-rose-500"
                            )}>
                              {pair.changePercent >= 0 ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                              )}
                              <span className="font-medium">
                                {Math.abs(pair.changePercent).toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
