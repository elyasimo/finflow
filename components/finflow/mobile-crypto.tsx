"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Search,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  Percent,
  RefreshCw,
  Bot,
  Lightbulb,
  Bell,
  Star,
  Loader2,
  Camera,
  Menu,
  BarChart3,
  Layers,
  Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
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
  sparkline?: number[]
}

interface MobileCryptoProps {
  cryptoMarkets: CryptoMarket[]
  isLoading: boolean
  onRefresh: () => void
}

// Simple sparkline component
function Sparkline({ data, positive }: { data: number[], positive: boolean }) {
  if (!data || data.length < 2) return null
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 40" className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#00D09C' : '#FF6B6B'}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function MobileCrypto({
  cryptoMarkets = [],
  isLoading,
  onRefresh,
}: MobileCryptoProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const router = useRouter()
  const [activeMoversTab, setActiveMoversTab] = useState<'gainers' | 'losers'>('gainers')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatCurrency = (amount: number) => {
    // Schweizer Format wie bei Revolut
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency === 'CHF' ? 'CHF' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: amount < 1 ? 4 : 2,
    }).format(amount).replace('CHF', 'Fr')
  }

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '▲' : '▼'
    return `${prefix} ${Math.abs(value).toFixed(2)}%`
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Top Kryptos (BTC, ETH für Hero Cards)
  const heroCoins = useMemo(() => {
    const btc = cryptoMarkets.find(c => c.symbol.includes('BTC'))
    const eth = cryptoMarkets.find(c => c.symbol.includes('ETH'))
    return [btc, eth].filter(Boolean) as CryptoMarket[]
  }, [cryptoMarkets])

  // Top Movers
  const topGainers = useMemo(() => {
    return [...cryptoMarkets]
      .filter(c => c.price_change_percentage_24h > 0)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 6)
  }, [cryptoMarkets])

  const topLosers = useMemo(() => {
    return [...cryptoMarkets]
      .filter(c => c.price_change_percentage_24h < 0)
      .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, 6)
  }, [cryptoMarkets])

  // Alle Kryptos (Top 5 für Liste)
  const topCryptos = useMemo(() => {
    return cryptoMarkets.slice(0, 5)
  }, [cryptoMarkets])

  // Meistgehandelt
  const mostTraded = useMemo(() => {
    return cryptoMarkets.slice(0, 2).map(c => ({
      ...c,
      buyPercent: Math.floor(Math.random() * 20) + 75, // Demo: 75-95% Käufe
    }))
  }, [cryptoMarkets])

  // Neu hinzugefügt (letzte 4)
  const newlyAdded = useMemo(() => {
    return cryptoMarkets.slice(-4).reverse()
  }, [cryptoMarkets])

  // Crypto Logo URL
  const getCryptoLogo = (symbol: string) => {
    const baseSymbol = symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '').toLowerCase()
    return `/logos/cryptocurrency/${baseSymbol}.png`
  }

  // Generate fake sparkline data if not available
  const getSparklineData = (crypto: CryptoMarket) => {
    if (crypto.sparkline && crypto.sparkline.length > 0) return crypto.sparkline
    // Generate random but consistent sparkline based on symbol
    const seed = crypto.symbol.charCodeAt(0) + crypto.symbol.charCodeAt(1)
    return Array.from({ length: 24 }, (_, i) => {
      const noise = Math.sin(seed + i) * 0.1
      return crypto.current_price * (1 + noise)
    })
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header - Revolut Style für Krypto */}
      <div className="sticky top-0 z-50 bg-[#121212]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Camera Icon (QR Scanner) */}
          <button className="w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </button>

          {/* Search Bar */}
          <button 
            onClick={() => setShowSearch(true)}
            className="flex-1 mx-3 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#2a2a2a]"
          >
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Suche</span>
          </button>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </button>
            <button className="w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <Menu className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
            <p className="text-gray-400">Lade Krypto-Daten...</p>
          </div>
        ) : (
          <>
            {/* Hero Section - Gradient Background */}
            <div className="relative px-4 pt-8 pb-6 bg-gradient-to-br from-[#3d2a1a] via-[#2a2218] to-[#121212]">
              <h1 className="text-3xl font-bold text-white text-center mb-1">
                Dein Weg in die Krypto-Welt
              </h1>
              <p className="text-gray-300 text-center text-sm">
                Trade mit Gebühren ab 0 %, abhängig vom Abo
              </p>

              <button 
                onClick={() => router.push('/trading-agent')}
                className="mt-6 w-full py-4 rounded-2xl bg-[#3a3a3a]/80 text-white font-medium text-lg"
              >
                Mit dem Trading beginnen
              </button>
            </div>

            {/* Hero Crypto Cards (BTC, ETH) */}
            <div className="px-4 -mt-2">
              <div className="flex gap-3">
                {heroCoins.map((coin) => {
                  const sparkData = getSparklineData(coin)
                  const isPositive = coin.price_change_percentage_24h >= 0
                  return (
                    <button 
                      key={coin.id}
                      className="flex-1 p-4 rounded-2xl bg-[#1e1e1e]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 text-sm">
                          {coin.symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '')}
                        </span>
                        <img 
                          src={getCryptoLogo(coin.symbol)}
                          alt={coin.symbol}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = '/logos/cryptocurrency/default.png'
                          }}
                        />
                      </div>
                      <p className="text-white text-xl font-bold mb-1">
                        {formatCurrency(coin.current_price)}
                      </p>
                      <p className={cn(
                        "text-sm mb-3",
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {formatPercent(coin.price_change_percentage_24h)}
                      </p>
                      <Sparkline data={sparkData} positive={isPositive} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Top Mover */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Top Mover</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Segment Tabs */}
              <div className="flex p-1 rounded-xl bg-[#2a2a2a] mb-4">
                <button
                  onClick={() => setActiveMoversTab('gainers')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeMoversTab === 'gainers' 
                      ? "bg-[#3a3a3a] text-white" 
                      : "text-gray-400"
                  )}
                >
                  Top-Gewinner
                </button>
                <button
                  onClick={() => setActiveMoversTab('losers')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeMoversTab === 'losers' 
                      ? "bg-[#3a3a3a] text-white" 
                      : "text-gray-400"
                  )}
                >
                  Top-Verlierer
                </button>
              </div>

              {/* Movers Grid 3x2 */}
              <div className="grid grid-cols-3 gap-4">
                {(activeMoversTab === 'gainers' ? topGainers : topLosers).map((crypto) => (
                  <button 
                    key={crypto.id}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={getCryptoLogo(crypto.symbol)}
                        alt={crypto.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/logos/cryptocurrency/default.png'
                        }}
                      />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {crypto.symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '')}
                    </span>
                    <span className={cn(
                      "text-xs font-medium",
                      crypto.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {formatPercent(crypto.price_change_percentage_24h)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Funktionen */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <h3 className="text-gray-400 mb-4">Funktionen</h3>

              <div className="space-y-1">
                <button className="w-full flex items-center justify-between p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Percent className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Verdienen</p>
                      <p className="text-gray-400 text-sm">Bis zu 22.54% APY</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button 
                  onClick={() => router.push('/trading-agent')}
                  className="w-full flex items-center justify-between p-3 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Strategien</p>
                      <p className="text-gray-400 text-sm">Trading auf einem neuen Level</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Revolut X</p>
                      <p className="text-gray-400 text-sm">Trading wie ein Profi</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Lernen</p>
                      <p className="text-gray-400 text-sm">Erhalte Fr 7.25 in Krypto</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Alle Kryptowährungen */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Alle Kryptowährungen</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {topCryptos.map((crypto) => (
                  <div key={crypto.id} className="flex items-center justify-between py-3">
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
                        <p className="text-white font-medium">{crypto.name || crypto.symbol}</p>
                        <p className="text-gray-400 text-xs">
                          {crypto.symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(crypto.current_price)}</p>
                      <p className={cn(
                        "text-xs",
                        crypto.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {formatPercent(crypto.price_change_percentage_24h)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 text-white text-sm">
                Alle anzeigen
              </button>
            </div>

            {/* Am meisten gehandelt */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Am meisten gehandelt</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {mostTraded.map((crypto) => (
                  <div key={crypto.id} className="flex items-center justify-between py-2">
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
                        <p className="text-white font-medium">{crypto.name || crypto.symbol}</p>
                        <p className="text-gray-400 text-xs">
                          {crypto.buyPercent}% Käufe · {100 - crypto.buyPercent}% Verkäufe
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(crypto.current_price)}</p>
                      <p className={cn(
                        "text-xs",
                        crypto.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {formatPercent(crypto.price_change_percentage_24h)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 text-white text-sm">
                Alle anzeigen
              </button>
            </div>

            {/* Alarme */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Alarme</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => router.push('/price-alerts')}
                className="w-full flex items-center gap-3 p-3 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-white">Alarm hinzufügen</span>
              </button>
            </div>

            {/* Beobachtungsliste */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Beobachtungsliste</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button className="w-full flex items-center gap-3 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-white">Zur Beobachtungsliste hinzufügen</span>
              </button>
            </div>

            {/* Neu hinzugefügt */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Neu hinzugefügt</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {newlyAdded.map((crypto) => (
                  <button 
                    key={crypto.id}
                    className="flex flex-col items-center min-w-[72px]"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={getCryptoLogo(crypto.symbol)}
                        alt={crypto.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/logos/cryptocurrency/default.png'
                        }}
                      />
                    </div>
                    <span className="text-white text-xs font-medium">
                      {crypto.symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '').slice(0, 4)}
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      crypto.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {formatPercent(crypto.price_change_percentage_24h)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-1 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              </div>
            </div>

            {/* Widgets hinzufügen Button */}
            <div className="mt-6 mb-8 px-4">
              <button className="w-full py-3 rounded-full bg-[#3a3a3a] text-white font-medium flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Widgets hinzufügen
              </button>
            </div>

            {/* Disclaimer */}
            <div className="px-4 text-center text-gray-500 text-xs leading-relaxed mb-8">
              <p>
                Die Dienstleistungen werden von FinFlow Digital Assets erbracht. 
                <span className="text-blue-400 ml-1">Offenlegungen zu Krypto</span>.
              </p>
              <p className="mt-2">
                Die Wertentwicklung in der Vergangenheit ist kein zuverlässiger 
                Indikator für zukünftige Ergebnisse.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
