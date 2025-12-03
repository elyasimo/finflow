"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Search,
  ChevronRight,
  BarChart3,
  Landmark,
  Coins,
  LineChart,
  Lightbulb,
  Bell,
  Bot,
  Loader2,
  RefreshCw,
  X,
  Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileBottomNav from "./mobile-bottom-nav"
import Link from "next/link"

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

interface MobileInvestProps {
  stocks: Stock[]
  etfs: ETF[]
  indices: Stock[]
  commodities: Stock[]
  bonds: Stock[]
  news?: NewsItem[]
  isLoading: boolean
  onRefresh: () => void
}

// Produkt-Kategorien mit korrekten Links - Labels werden dynamisch übersetzt
const PRODUCT_CATEGORIES = [
  { id: 'stocks', labelKey: 'stocksLabel', icon: LineChart, href: '/markets' },
  { id: 'etf', labelKey: 'etfLabel', icon: BarChart3, href: '/etf' },
  { id: 'bonds', labelKey: 'bondsLabel', icon: Landmark, href: '/markets?tab=bonds' },
  { id: 'commodities', labelKey: 'commoditiesLabel', icon: Coins, href: '/commodities' },
  { id: 'robo', labelKey: 'roboAdvisorLabel', icon: Bot, href: '/robo-advisor' },
]

// Stock Logo URLs - Using official sources
const STOCK_LOGOS: Record<string, string> = {
  // US Tech Giants
  'AAPL': 'https://logo.clearbit.com/apple.com',
  'MSFT': 'https://logo.clearbit.com/microsoft.com',
  'GOOGL': 'https://logo.clearbit.com/google.com',
  'GOOG': 'https://logo.clearbit.com/google.com',
  'AMZN': 'https://logo.clearbit.com/amazon.com',
  'META': 'https://logo.clearbit.com/meta.com',
  'NVDA': 'https://logo.clearbit.com/nvidia.com',
  'TSLA': 'https://logo.clearbit.com/tesla.com',
  'NFLX': 'https://logo.clearbit.com/netflix.com',
  'AMD': 'https://logo.clearbit.com/amd.com',
  'INTC': 'https://logo.clearbit.com/intel.com',
  'CRM': 'https://logo.clearbit.com/salesforce.com',
  'ORCL': 'https://logo.clearbit.com/oracle.com',
  'ADBE': 'https://logo.clearbit.com/adobe.com',
  'PYPL': 'https://logo.clearbit.com/paypal.com',
  'UBER': 'https://logo.clearbit.com/uber.com',
  'ABNB': 'https://logo.clearbit.com/airbnb.com',
  'SQ': 'https://logo.clearbit.com/squareup.com',
  'SNAP': 'https://logo.clearbit.com/snapchat.com',
  'SPOT': 'https://logo.clearbit.com/spotify.com',
  'SHOP': 'https://logo.clearbit.com/shopify.com',
  'ZM': 'https://logo.clearbit.com/zoom.us',
  'ROKU': 'https://logo.clearbit.com/roku.com',
  'TWLO': 'https://logo.clearbit.com/twilio.com',
  'PLTR': 'https://logo.clearbit.com/palantir.com',
  'COIN': 'https://logo.clearbit.com/coinbase.com',
  'RBLX': 'https://logo.clearbit.com/roblox.com',
  'HOOD': 'https://logo.clearbit.com/robinhood.com',
  'TTWO': 'https://logo.clearbit.com/take2games.com',
  'EA': 'https://logo.clearbit.com/ea.com',
  'ATVI': 'https://logo.clearbit.com/activision.com',
  // Finance
  'JPM': 'https://logo.clearbit.com/jpmorganchase.com',
  'BAC': 'https://logo.clearbit.com/bankofamerica.com',
  'WFC': 'https://logo.clearbit.com/wellsfargo.com',
  'GS': 'https://logo.clearbit.com/goldmansachs.com',
  'MS': 'https://logo.clearbit.com/morganstanley.com',
  'V': 'https://logo.clearbit.com/visa.com',
  'MA': 'https://logo.clearbit.com/mastercard.com',
  'AXP': 'https://logo.clearbit.com/americanexpress.com',
  // Consumer
  'KO': 'https://logo.clearbit.com/coca-colacompany.com',
  'PEP': 'https://logo.clearbit.com/pepsico.com',
  'MCD': 'https://logo.clearbit.com/mcdonalds.com',
  'SBUX': 'https://logo.clearbit.com/starbucks.com',
  'NKE': 'https://logo.clearbit.com/nike.com',
  'DIS': 'https://logo.clearbit.com/disney.com',
  'WMT': 'https://logo.clearbit.com/walmart.com',
  'TGT': 'https://logo.clearbit.com/target.com',
  'COST': 'https://logo.clearbit.com/costco.com',
  'HD': 'https://logo.clearbit.com/homedepot.com',
  // Healthcare
  'JNJ': 'https://logo.clearbit.com/jnj.com',
  'PFE': 'https://logo.clearbit.com/pfizer.com',
  'UNH': 'https://logo.clearbit.com/unitedhealthgroup.com',
  'ABBV': 'https://logo.clearbit.com/abbvie.com',
  'MRK': 'https://logo.clearbit.com/merck.com',
  'LLY': 'https://logo.clearbit.com/lilly.com',
  // Energy
  'XOM': 'https://logo.clearbit.com/exxonmobil.com',
  'CVX': 'https://logo.clearbit.com/chevron.com',
  // German Stocks (DAX)
  'SAP': 'https://logo.clearbit.com/sap.com',
  'SIE': 'https://logo.clearbit.com/siemens.com',
  'ALV': 'https://logo.clearbit.com/allianz.com',
  'BAS': 'https://logo.clearbit.com/basf.com',
  'BAYN': 'https://logo.clearbit.com/bayer.com',
  'BMW': 'https://logo.clearbit.com/bmw.com',
  'DAI': 'https://logo.clearbit.com/mercedes-benz.com',
  'MBG': 'https://logo.clearbit.com/mercedes-benz.com',
  'VOW': 'https://logo.clearbit.com/volkswagen.com',
  'ADS': 'https://logo.clearbit.com/adidas.com',
  'DTE': 'https://logo.clearbit.com/telekom.com',
  'DBK': 'https://logo.clearbit.com/db.com',
  'RHM': 'https://logo.clearbit.com/rheinmetall.com',
  // More
  'BRK.B': 'https://logo.clearbit.com/berkshirehathaway.com',
  'BRK.A': 'https://logo.clearbit.com/berkshirehathaway.com',
}

// Get stock logo URL
const getStockLogoUrl = (symbol: string): string => {
  const cleanSymbol = symbol.replace('.DE', '').replace('.US', '').replace('.SW', '').toUpperCase()
  return STOCK_LOGOS[cleanSymbol] || `https://logo.clearbit.com/${cleanSymbol.toLowerCase()}.com`
}

// ETF Issuer detection and logos
const getETFIssuerLogo = (name: string, symbol: string): { logo: string; color: string } => {
  const lowerName = (name || '').toLowerCase()
  const lowerSymbol = (symbol || '').toLowerCase()
  
  if (lowerName.includes('ishares') || lowerSymbol.startsWith('is') || lowerSymbol.includes('iusu')) {
    return { logo: 'https://logo.clearbit.com/ishares.com', color: 'bg-emerald-500' }
  }
  if (lowerName.includes('vanguard') || lowerSymbol.startsWith('v') || lowerSymbol === 'vuaa') {
    return { logo: 'https://logo.clearbit.com/vanguard.com', color: 'bg-red-600' }
  }
  if (lowerName.includes('xtrackers') || lowerSymbol.startsWith('dbx')) {
    return { logo: 'https://logo.clearbit.com/dws.com', color: 'bg-orange-500' }
  }
  if (lowerName.includes('amundi')) {
    return { logo: 'https://logo.clearbit.com/amundi.com', color: 'bg-blue-500' }
  }
  if (lowerName.includes('lyxor')) {
    return { logo: 'https://logo.clearbit.com/lyxor.com', color: 'bg-orange-400' }
  }
  if (lowerName.includes('spdr')) {
    return { logo: 'https://logo.clearbit.com/ssga.com', color: 'bg-yellow-500' }
  }
  if (lowerName.includes('invesco')) {
    return { logo: 'https://logo.clearbit.com/invesco.com', color: 'bg-blue-600' }
  }
  return { logo: 'https://logo.clearbit.com/ishares.com', color: 'bg-emerald-500' }
}

// Rohstoffe-Daten - Labels werden dynamisch übersetzt
const COMMODITIES_ELEMENTS = [
  { symbol: 'Au', labelKey: 'goldLabel', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { symbol: 'Ag', labelKey: 'silverLabel', color: 'bg-gray-200 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300' },
  { symbol: 'Pd', labelKey: 'palladiumLabel', color: 'bg-slate-200 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300' },
  { symbol: 'Pt', labelKey: 'platinumLabel', color: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/30 dark:text-zinc-300' },
]

export default function MobileInvest({
  stocks = [],
  etfs = [],
  indices = [],
  commodities = [],
  bonds = [],
  news = [],
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

  // Filter by search
  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks
    const query = searchQuery.toLowerCase()
    return stocks.filter(s => 
      s.symbol.toLowerCase().includes(query) || 
      s.name?.toLowerCase().includes(query)
    )
  }, [stocks, searchQuery])

  // Top Movers berechnen
  const topGainers = useMemo(() => {
    return [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 6)
  }, [stocks])

  const topLosers = useMemo(() => {
    return [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 6)
  }, [stocks])

  // Beliebte Erstkäufe (Top 6)
  const popularStocks = useMemo(() => (showSearch ? filteredStocks : stocks).slice(0, 6), [stocks, filteredStocks, showSearch])
  const popularETFs = useMemo(() => etfs.slice(0, 6), [etfs])

  // State for failed images
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  
  const handleImageError = (symbol: string) => {
    setFailedImages(prev => new Set(prev).add(symbol))
  }

  // Meistgehandelt
  const mostTraded = useMemo(() => {
    return stocks.slice(0, 3).map(s => ({
      ...s,
      buyPercent: Math.floor(Math.random() * 30) + 60,
    }))
  }, [stocks])

  // Stock Logo URL
  const getStockLogo = (symbol: string) => {
    const cleanSymbol = symbol.replace('.DE', '').replace('.US', '').toLowerCase()
    return `https://logo.clearbit.com/${cleanSymbol}.com`
  }

  return (
    <div className="min-h-screen max-h-screen flex flex-col bg-background dark:bg-[#0f1623]">
      {/* Fixed Header */}
      <header className="flex-shrink-0 sticky top-0 z-50 bg-background dark:bg-[#0f1623] border-b border-border dark:border-[#1e293b] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Portfolio Button */}
          <Link 
            href="/accounts"
            className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center"
          >
            <Wallet className="w-5 h-5 text-foreground dark:text-white" />
          </Link>

          {/* Search Bar */}
          {showSearch ? (
            <div className="flex-1 mx-3 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary dark:bg-[#1e293b]">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchStocksEtfs') || 'Search stocks, ETFs...'}
                  className="flex-1 bg-transparent text-sm text-foreground dark:text-white placeholder-muted-foreground focus:outline-none"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground dark:text-white" />
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setShowSearch(true)}
                className="flex-1 mx-3 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary dark:bg-[#1e293b]"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">{t('searchPlaceholder') || 'Search'}</span>
              </button>

              {/* Right Icons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefresh}
                  className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center"
                >
                  <RefreshCw className={cn(
                    "w-4 h-4 text-foreground dark:text-white",
                    isRefreshing && "animate-spin"
                  )} />
                </button>
                <Link 
                  href="/price-alerts"
                  className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center"
                >
                  <Bell className="w-4 h-4 text-foreground dark:text-white" />
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">{t('loadingMarketData') || 'Loading market data...'}</p>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="relative px-4 pt-8 pb-6 bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-transparent">
              <h1 className="text-3xl font-bold text-foreground dark:text-white text-center mb-1">
                {t('invest') || 'Investieren'}
              </h1>
              <p className="text-muted-foreground text-center text-sm">
                {t('buildWealthLongTerm') || 'Baue langfristig Vermögen auf'}
              </p>

              <Link 
                href="/robo-advisor"
                className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-medium text-lg flex items-center justify-center"
              >
                {t('investNow') || 'Jetzt investieren'}
              </Link>
            </div>

            {/* Popular First Purchases */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">
                  {showSearch && searchQuery ? `${t('resultsFor') || 'Results for'} "${searchQuery}"` : (t('popularFirstPurchases') || 'Popular First Purchases')}
                </span>
              </div>

              {/* Segment Tabs */}
              <div className="flex p-1 rounded-xl bg-secondary dark:bg-[#0f1623] mb-4">
                <button
                  onClick={() => setActiveAssetTab('stocks')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeAssetTab === 'stocks' 
                      ? "bg-card dark:bg-[#1e293b] text-foreground dark:text-white shadow-sm" 
                      : "text-muted-foreground"
                  )}
                >
                  {t('stocks') || 'Stocks'}
                </button>
                <button
                  onClick={() => setActiveAssetTab('etf')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeAssetTab === 'etf' 
                      ? "bg-card dark:bg-[#1e293b] text-foreground dark:text-white shadow-sm" 
                      : "text-muted-foreground"
                  )}
                >
                  ETF
                </button>
              </div>

              {/* Asset Grid 3x2 */}
              <div className="grid grid-cols-3 gap-4">
                {(activeAssetTab === 'stocks' ? popularStocks : popularETFs).map((asset) => {
                  const isStock = activeAssetTab === 'stocks'
                  const logoUrl = isStock 
                    ? getStockLogoUrl(asset.symbol)
                    : getETFIssuerLogo(asset.name, asset.symbol).logo
                  const fallbackColor = isStock 
                    ? 'from-blue-500 to-indigo-600' 
                    : getETFIssuerLogo(asset.name, asset.symbol).color
                  const hasFailed = failedImages.has(asset.symbol)
                  
                  return (
                    <button 
                      key={asset.symbol}
                      onClick={() => router.push(`/markets?symbol=${asset.symbol}`)}
                      className="flex flex-col items-center active:scale-95 transition-transform"
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center mb-2 overflow-hidden",
                        hasFailed ? `bg-gradient-to-br ${fallbackColor}` : "bg-white"
                      )}>
                        {!hasFailed ? (
                          <img 
                            src={logoUrl}
                            alt={asset.symbol}
                            className="w-10 h-10 object-contain"
                            onError={() => handleImageError(asset.symbol)}
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {asset.symbol.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <span className="text-foreground dark:text-white text-sm font-medium">{asset.symbol}</span>
                      <span className={cn(
                        "text-xs font-medium",
                        asset.changePercent >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {formatPercent(asset.changePercent)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Produkte - Mit funktionierenden Links */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <h3 className="text-muted-foreground font-medium mb-4">{t('products') || 'Products'}</h3>
              <div className="grid grid-cols-5 gap-2">
                {PRODUCT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <Link 
                      key={cat.id}
                      href={cat.href}
                      className="flex flex-col items-center active:scale-95 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-secondary dark:bg-[#0f1623] flex items-center justify-center mb-2">
                        <Icon className="w-5 h-5 text-foreground dark:text-white" />
                      </div>
                      <span className="text-foreground dark:text-white text-[10px] text-center leading-tight">{t(cat.labelKey as any) || cat.labelKey}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Top Mover */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">{t('topMoversToday') || 'Top Movers Today'}</span>
              </div>

              {/* Segment Tabs */}
              <div className="flex p-1 rounded-xl bg-secondary dark:bg-[#0f1623] mb-4">
                <button
                  onClick={() => setActiveMoversTab('gainers')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeMoversTab === 'gainers' 
                      ? "bg-card dark:bg-[#1e293b] text-foreground dark:text-white shadow-sm" 
                      : "text-muted-foreground"
                  )}
                >
                  {t('topGainers') || 'Top Gainers'}
                </button>
                <button
                  onClick={() => setActiveMoversTab('losers')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeMoversTab === 'losers' 
                      ? "bg-card dark:bg-[#1e293b] text-foreground dark:text-white shadow-sm" 
                      : "text-muted-foreground"
                  )}
                >
                  {t('topLosers') || 'Top Losers'}
                </button>
              </div>

              {/* Movers Grid 3x2 */}
              <div className="grid grid-cols-3 gap-4">
                {(activeMoversTab === 'gainers' ? topGainers : topLosers).map((stock) => {
                  const logoUrl = getStockLogoUrl(stock.symbol)
                  const hasFailed = failedImages.has(`mover-${stock.symbol}`)
                  
                  return (
                    <button 
                      key={stock.symbol}
                      onClick={() => router.push(`/markets?symbol=${stock.symbol}`)}
                      className="flex flex-col items-center active:scale-95 transition-transform"
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center mb-2 overflow-hidden",
                        hasFailed 
                          ? `bg-gradient-to-br ${activeMoversTab === 'gainers' ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'}` 
                          : "bg-white"
                      )}>
                        {!hasFailed ? (
                          <img 
                            src={logoUrl}
                            alt={stock.symbol}
                            className="w-10 h-10 object-contain"
                            onError={() => handleImageError(`mover-${stock.symbol}`)}
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {stock.symbol.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <span className="text-foreground dark:text-white text-sm font-medium">{stock.symbol}</span>
                      <span className={cn(
                        "text-xs font-medium",
                        stock.changePercent >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {formatPercent(stock.changePercent)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Meistgehandelt */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">{t('mostTradedWeek') || 'Most Traded This Week'}</span>
              </div>

              <div className="space-y-3">
                {mostTraded.map((stock) => (
                  <button 
                    key={stock.symbol} 
                    onClick={() => router.push(`/markets?symbol=${stock.symbol}`)}
                    className="w-full flex items-center justify-between py-2 active:bg-secondary/50 dark:active:bg-[#0f1623]/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center overflow-hidden">
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
                      <div className="text-left">
                        <p className="text-foreground dark:text-white font-medium">{stock.symbol}</p>
                        <p className="text-muted-foreground text-xs">
                          {stock.buyPercent}% {t('buys') || 'Buys'} · {100 - stock.buyPercent}% {t('sells') || 'Sells'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground dark:text-white font-medium">{formatCurrency(stock.price)}</p>
                      <p className={cn(
                        "text-xs",
                        stock.changePercent >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {formatPercent(stock.changePercent)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <Link 
                href="/markets"
                className="w-full mt-4 py-3 text-primary text-sm font-medium flex items-center justify-center gap-1"
              >
                {t('showAll') || 'Show All'} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Neuigkeiten */}
            {news && news.length > 0 && (
              <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground font-medium">{t('news') || 'News'}</span>
                </div>

                <div className="space-y-4">
                  {news.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex-1">
                        {item.ticker && (
                          <p className={cn(
                            "text-xs mb-1",
                            (item.tickerChange || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                            {item.ticker} {item.tickerChange && formatPercent(item.tickerChange)}
                          </p>
                        )}
                        <p className="text-foreground dark:text-white text-sm line-clamp-2">{item.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{item.time} · {item.source}</p>
                      </div>
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt=""
                          className="w-20 h-16 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rohstoffe - Mit Links */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <h3 className="text-muted-foreground font-medium mb-4">{t('commoditiesLabel') || 'Commodities'}</h3>
              <div className="flex justify-between">
                {COMMODITIES_ELEMENTS.map((commodity) => (
                  <Link 
                    key={commodity.symbol}
                    href="/commodities"
                    className="flex flex-col items-center active:scale-95 transition-transform"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2",
                      commodity.color
                    )}>
                      <span className="text-lg font-bold">{commodity.symbol}</span>
                    </div>
                    <span className="text-foreground dark:text-white text-xs">{t(commodity.labelKey as any) || commodity.labelKey}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Lernen */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">{t('learn') || 'Learn'}</span>
              </div>

              <Link 
                href="/support"
                className="w-full p-4 rounded-xl bg-secondary dark:bg-[#0f1623] flex items-center gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground dark:text-white font-medium">{t('firstStepsTrading') || 'First Steps in Trading'}</p>
                  <p className="text-muted-foreground text-sm">{t('viewCourses') || 'View Courses'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>

            {/* Trading Tools */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">{t('tradingTools') || 'Trading Tools'}</span>
              </div>

              <div className="space-y-2">
                <Link 
                  href="/robo-advisor"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary dark:bg-[#0f1623] active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-foreground dark:text-white font-medium">Robo-Advisor</p>
                      <p className="text-muted-foreground text-sm">{t('automatedTrading') || 'Automated Trading'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>

                <Link 
                  href="/price-alerts"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary dark:bg-[#0f1623] active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-foreground dark:text-white font-medium">{t('priceAlertsLabel') || 'Price Alerts'}</p>
                      <p className="text-muted-foreground text-sm">{t('setupNotifications') || 'Setup Notifications'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-8 text-center text-muted-foreground text-xs leading-relaxed">
              <p>
                {t('pastPerformanceDisclaimer') || 'Past performance is not a reliable indicator of future results. Your investments may increase or decrease in value.'}
              </p>
            </div>
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  )
}
