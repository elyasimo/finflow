"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Search,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  BarChart3,
  Landmark,
  Coins,
  LineChart,
  Lightbulb,
  Star,
  Bell,
  Bot,
  Loader2,
  RefreshCw,
  Globe,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileBottomNav from "./mobile-bottom-nav"

interface Stock {
  symbol: string
  name: string
  price: number
  changePercent: number
  volume?: number
  logo?: string
}

interface ETF {
  symbol: string
  name: string
  price: number
  changePercent: number
  category?: string
}

interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  image?: string
  ticker?: string
  tickerChange?: number
}

interface CorporateAction {
  date: string
  company: string
  logo?: string
  type: 'dividend' | 'split' | 'merger'
  details: string
}

interface MobileInvestProps {
  stocks: Stock[]
  etfs: ETF[]
  indices: Stock[]
  commodities: Stock[]
  bonds: Stock[]
  news?: NewsItem[]
  corporateActions?: CorporateAction[]
  isLoading: boolean
  onRefresh: () => void
}

// Produkt-Kategorien wie bei Revolut
const PRODUCT_CATEGORIES = [
  { id: 'stocks', label: 'Aktien', icon: LineChart },
  { id: 'etf', label: 'ETF', icon: BarChart3 },
  { id: 'bonds', label: 'Anleihen', icon: Landmark },
  { id: 'commodities', label: 'Rohstoffe', icon: Coins },
]

// Rohstoffe-Daten (wie bei Revolut)
const COMMODITIES_ELEMENTS = [
  { symbol: 'Au', name: 'Gold', color: 'bg-amber-100 text-amber-700' },
  { symbol: 'Ag', name: 'Silber', color: 'bg-gray-200 text-gray-700' },
  { symbol: 'Pd', name: 'Palladium', color: 'bg-slate-200 text-slate-700' },
  { symbol: 'Pt', name: 'Platin', color: 'bg-zinc-200 text-zinc-700' },
]

export default function MobileInvest({
  stocks = [],
  etfs = [],
  indices = [],
  commodities = [],
  bonds = [],
  news = [],
  corporateActions = [],
  isLoading,
  onRefresh,
}: MobileInvestProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const router = useRouter()
  const [activeAssetTab, setActiveAssetTab] = useState<'stocks' | 'etf'>('stocks')
  const [activeMoversTab, setActiveMoversTab] = useState<'gainers' | 'losers'>('gainers')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
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

  // Top Movers berechnen
  const topGainers = useMemo(() => {
    return [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 6)
  }, [stocks])

  const topLosers = useMemo(() => {
    return [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 6)
  }, [stocks])

  // Beliebte Erstkäufe (Top 6)
  const popularStocks = useMemo(() => stocks.slice(0, 6), [stocks])
  const popularETFs = useMemo(() => etfs.slice(0, 6), [etfs])

  // Meistgehandelt
  const mostTraded = useMemo(() => {
    return stocks.slice(0, 3).map(s => ({
      ...s,
      buyPercent: Math.floor(Math.random() * 30) + 60, // Demo
    }))
  }, [stocks])

  // Stock Logo URL
  const getStockLogo = (symbol: string) => {
    const cleanSymbol = symbol.replace('.DE', '').replace('.US', '').toLowerCase()
    return `https://logo.clearbit.com/${cleanSymbol}.com`
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header - Revolut Style */}
      <div className="sticky top-0 z-50 bg-[#121212]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Profile Avatar */}
          <button className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold text-sm">
            KB
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
              <Globe className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
            <p className="text-gray-400">Lade Marktdaten...</p>
          </div>
        ) : (
          <>
            {/* Hero Section - Gradient Background */}
            <div className="relative px-4 pt-8 pb-12 bg-gradient-to-br from-[#3d2a1a] via-[#2a2218] to-[#121212]">
              <h1 className="text-4xl font-bold text-white text-center mb-2">
                Baue Vermögen auf
              </h1>
              <p className="text-gray-300 text-center text-lg">
                Investiere ab sofort, ab 1 €
              </p>

              <button 
                onClick={() => router.push('/trading-agent')}
                className="mt-8 w-full py-4 rounded-2xl bg-[#3a3a3a]/80 text-white font-medium text-lg"
              >
                Jetzt investieren
              </button>
            </div>

            {/* Beliebte Erstkäufe */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Beliebte Erstkäufe</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Segment Tabs */}
              <div className="flex p-1 rounded-xl bg-[#2a2a2a] mb-4">
                <button
                  onClick={() => setActiveAssetTab('stocks')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeAssetTab === 'stocks' 
                      ? "bg-[#3a3a3a] text-white" 
                      : "text-gray-400"
                  )}
                >
                  Aktien
                </button>
                <button
                  onClick={() => setActiveAssetTab('etf')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeAssetTab === 'etf' 
                      ? "bg-[#3a3a3a] text-white" 
                      : "text-gray-400"
                  )}
                >
                  ETF
                </button>
              </div>

              {/* Asset Grid 3x2 */}
              <div className="grid grid-cols-3 gap-4">
                {(activeAssetTab === 'stocks' ? popularStocks : popularETFs).map((asset) => (
                  <button 
                    key={asset.symbol}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={getStockLogo(asset.symbol)}
                        alt={asset.symbol}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/placeholder-stock.png'
                          e.currentTarget.className = 'w-8 h-8'
                        }}
                      />
                    </div>
                    <span className="text-white text-sm font-medium">{asset.symbol}</span>
                    <span className={cn(
                      "text-xs font-medium",
                      asset.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {formatPercent(asset.changePercent)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Produkte */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <h3 className="text-gray-400 mb-4">Produkte</h3>
              <div className="grid grid-cols-4 gap-3">
                {PRODUCT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <button 
                      key={cat.id}
                      className="flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#2a2a2a] flex items-center justify-center mb-2">
                        <Icon className="w-6 h-6 text-gray-300" />
                      </div>
                      <span className="text-white text-xs">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Top Mover */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Die Top Mover von heute</span>
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
                {(activeMoversTab === 'gainers' ? topGainers : topLosers).map((stock) => (
                  <button 
                    key={stock.symbol}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={getStockLogo(stock.symbol)}
                        alt={stock.symbol}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/placeholder-stock.png'
                        }}
                      />
                    </div>
                    <span className="text-white text-sm font-medium">{stock.symbol}</span>
                    <span className={cn(
                      "text-xs font-medium",
                      stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {formatPercent(stock.changePercent)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meistgehandelt */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Meistgehandelt dieser Woche</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {mostTraded.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <img 
                          src={getStockLogo(stock.symbol)}
                          alt={stock.symbol}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = '/placeholder-stock.png'
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium">{stock.symbol}</p>
                        <p className="text-gray-400 text-xs">
                          {stock.buyPercent}% Käufe · {100 - stock.buyPercent}% Verkäufe
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(stock.price)}</p>
                      <p className={cn(
                        "text-xs",
                        stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {formatPercent(stock.changePercent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 text-white text-sm">
                Alle anzeigen
              </button>
            </div>

            {/* Neuigkeiten */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Neuigkeiten</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {news.length > 0 ? news.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex-1">
                      {item.ticker && (
                        <p className={cn(
                          "text-xs mb-1",
                          (item.tickerChange || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {item.ticker} {item.tickerChange && formatPercent(item.tickerChange)}
                        </p>
                      )}
                      <p className="text-white text-sm line-clamp-2">{item.title}</p>
                      <p className="text-gray-500 text-xs mt-1">{item.time} · {item.source}</p>
                    </div>
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt=""
                        className="w-20 h-16 rounded-lg object-cover"
                      />
                    )}
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">Keine Neuigkeiten verfügbar</p>
                )}
              </div>

              <button className="w-full mt-4 text-white text-sm">
                Alle anzeigen
              </button>
            </div>

            {/* Rohstoffe */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <h3 className="text-gray-400 mb-4">Rohstoffe</h3>
              <div className="flex justify-between">
                {COMMODITIES_ELEMENTS.map((commodity) => (
                  <button 
                    key={commodity.symbol}
                    className="flex flex-col items-center"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2",
                      commodity.color
                    )}>
                      <span className="text-lg font-bold">{commodity.symbol}</span>
                    </div>
                    <span className="text-white text-xs">{commodity.name}</span>
                    <span className="text-gray-400 text-xs">0.00%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lernen */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Lernen</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button className="w-full p-4 rounded-xl bg-[#2a2a2a] text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Erste Schritte beim Trading</p>
                    <p className="text-gray-400 text-sm">Kurse ansehen</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Trading Agent - Strategien */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-4">
                <button className="flex items-center gap-1 text-gray-400">
                  <span>Funktionen</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/trading-agent')}
                  className="w-full flex items-center justify-between p-3 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Trading Agent</p>
                      <p className="text-gray-400 text-sm">Automatisiertes Trading</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button 
                  onClick={() => router.push('/price-alerts')}
                  className="w-full flex items-center justify-between p-3 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Preisalarme</p>
                      <p className="text-gray-400 text-sm">Benachrichtigungen einrichten</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Beobachtungsliste</p>
                      <p className="text-gray-400 text-sm">Deine Favoriten</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
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
                Die Wertentwicklung in der Vergangenheit ist kein zuverlässiger Indikator für zukünftige Ergebnisse. 
                Deine Investitionen können im Wert steigen oder fallen.
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
