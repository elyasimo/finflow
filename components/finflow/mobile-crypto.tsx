"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Search,
  ChevronRight,
  Plus,
  Bell,
  Loader2,
  X,
  Wallet,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileBottomNav from "./mobile-bottom-nav"
import Link from "next/link"

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
        stroke={positive ? '#10b981' : '#ef4444'}
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
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: amount < 1 ? 4 : 2,
    }).format(Number.isFinite(amount) ? amount : 0)
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
  const filteredCryptos = useMemo(() => {
    if (!searchQuery) return cryptoMarkets
    const query = searchQuery.toLowerCase()
    return cryptoMarkets.filter(c => 
      c.symbol.toLowerCase().includes(query) || 
      c.name?.toLowerCase().includes(query)
    )
  }, [cryptoMarkets, searchQuery])

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

  // Alle Kryptos (Top 8 für Liste)
  const topCryptos = useMemo(() => {
    return (showSearch ? filteredCryptos : cryptoMarkets).slice(0, 8)
  }, [cryptoMarkets, filteredCryptos, showSearch])

  // Meistgehandelt
  const mostTraded = useMemo(() => {
    return cryptoMarkets.slice(0, 3).map(c => ({
      ...c,
      buyPercent: Math.floor(Math.random() * 20) + 75,
    }))
  }, [cryptoMarkets])

  // Crypto Logo URL - Using CoinGecko IDs
  const getCryptoLogo = (symbol: string, id?: string) => {
    const baseSymbol = symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '').toLowerCase()
    
    // Known crypto logos via CoinGecko
    const CRYPTO_LOGOS: Record<string, string> = {
      'btc': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      'eth': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      'bnb': 'https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png',
      'sol': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
      'xrp': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
      'ada': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
      'doge': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
      'dot': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
      'shib': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
      'matic': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      'ltc': 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
      'link': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
      'avax': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
      'atom': 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
      'uni': 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
      'xlm': 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
      'etc': 'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png',
      'algo': 'https://assets.coingecko.com/coins/images/4380/small/download.png',
      'xmr': 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png',
      'bch': 'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
      'fil': 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
      'trx': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
      'near': 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
      'apt': 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
      'arb': 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
      'op': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
      'sui': 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
      'pepe': 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
      'sei': 'https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png',
      'inj': 'https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png',
      'vet': 'https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png',
      'aave': 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
      'mkr': 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',
      'snx': 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
      'crv': 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
      'ldo': 'https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png',
      'grt': 'https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png',
      'rpl': 'https://assets.coingecko.com/coins/images/2090/small/rocket_pool_%28RPL%29.png',
      'render': 'https://assets.coingecko.com/coins/images/11636/small/rndr.png',
      'imx': 'https://assets.coingecko.com/coins/images/17233/small/immutableX-symbol-BLK-RGB.png',
      'sand': 'https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg',
      'mana': 'https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png',
      'axs': 'https://assets.coingecko.com/coins/images/13029/small/axie_infinity_logo.png',
      'ftm': 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png',
      'icp': 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png',
      'hbar': 'https://assets.coingecko.com/coins/images/3688/small/hbar.png',
      'flow': 'https://assets.coingecko.com/coins/images/13446/small/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png',
      'egld': 'https://assets.coingecko.com/coins/images/12335/small/egld-token-logo.png',
      'theta': 'https://assets.coingecko.com/coins/images/2538/small/theta-token-logo.png',
      'ape': 'https://assets.coingecko.com/coins/images/24383/small/apecoin.jpg',
      'kcs': 'https://assets.coingecko.com/coins/images/1047/small/sa9z79.png',
      'xtz': 'https://assets.coingecko.com/coins/images/976/small/Tezos-logo.png',
      'neo': 'https://assets.coingecko.com/coins/images/480/small/NEO_512_512.png',
      'eos': 'https://assets.coingecko.com/coins/images/738/small/eos-eos-logo.png',
      'cake': 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo_%281%29.png',
      'osmo': 'https://assets.coingecko.com/coins/images/16724/small/osmo.png',
      'ton': 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
      'wbtc': 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
      'steth': 'https://assets.coingecko.com/coins/images/13442/small/steth_logo.png',
      'usdt': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
      'usdc': 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
      'busd': 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
      'dai': 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
    }
    
    return CRYPTO_LOGOS[baseSymbol] || `/logos/cryptocurrency/${baseSymbol}.png`
  }

  // Generate sparkline data
  const getSparklineData = (crypto: CryptoMarket) => {
    if (crypto.sparkline && crypto.sparkline.length > 0) return crypto.sparkline
    const seed = crypto.symbol.charCodeAt(0) + crypto.symbol.charCodeAt(1)
    return Array.from({ length: 24 }, (_, i) => {
      const noise = Math.sin(seed + i) * 0.1
      return crypto.current_price * (1 + noise)
    })
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background dark:bg-[#0f1623] overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 z-50 bg-background dark:bg-[#0f1623] border-b border-border dark:border-[#1e293b] pt-[env(safe-area-inset-top)]">
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
                  placeholder={t('searchCrypto') || 'Search crypto...'}
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
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain -webkit-overflow-scrolling-touch">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="relative px-4 pt-8 pb-6 bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-transparent">
              <h1 className="text-3xl font-bold text-foreground dark:text-white text-center mb-1">
                {t('crypto') || 'Krypto'}
              </h1>
              <p className="text-muted-foreground text-center text-sm">
                {t('discoverCrypto') || 'Entdecke die Welt der Kryptowährungen'}
              </p>

              <Link 
                href="/robo-advisor"
                className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-medium text-lg flex items-center justify-center"
              >
                {t('startTrading') || 'Mit dem Trading beginnen'}
              </Link>
            </div>

            {/* Hero Crypto Cards (BTC, ETH) */}
            <div className="px-4 mt-4">
              <div className="flex gap-3">
                {heroCoins.map((coin) => {
                  const sparkData = getSparklineData(coin)
                  const isPositive = coin.price_change_percentage_24h >= 0
                  return (
                    <button 
                      key={coin.id}
                      onClick={() => router.push(`/crypto/${coin.symbol}`)}
                      className="flex-1 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-muted-foreground text-sm">
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
                      <p className="text-foreground dark:text-white text-xl font-bold mb-1">
                        {formatCurrency(coin.current_price)}
                      </p>
                      <p className={cn(
                        "text-sm mb-3",
                        isPositive ? "text-emerald-500" : "text-red-500"
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
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">{t('topMoversToday') || 'Top Movers'}</span>
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

              {/* Movers Grid */}
              <div className="grid grid-cols-3 gap-4">
                {(activeMoversTab === 'gainers' ? topGainers : topLosers).map((crypto) => (
                  <button 
                    key={crypto.id}
                    onClick={() => router.push(`/crypto/${crypto.symbol}`)}
                    className="flex flex-col items-center active:scale-95 transition-transform"
                  >
                    <div className="w-14 h-14 rounded-full bg-secondary dark:bg-[#0f1623] flex items-center justify-center mb-2 overflow-hidden">
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
                    <span className="text-foreground dark:text-white text-sm font-medium">
                      {crypto.symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '')}
                    </span>
                    <span className={cn(
                      "text-xs font-medium",
                      crypto.price_change_percentage_24h >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {formatPercent(crypto.price_change_percentage_24h)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Alle Kryptowährungen */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">
                  {showSearch && searchQuery ? `${t('resultsFor') || 'Results for'} "${searchQuery}"` : (t('allCryptocurrencies') || 'All Cryptocurrencies')}
                </span>
              </div>

              <div className="space-y-1">
                {topCryptos.map((crypto) => (
                  <button 
                    key={crypto.id} 
                    onClick={() => router.push(`/crypto/${crypto.symbol}`)}
                    className="w-full flex items-center justify-between py-3 active:bg-secondary/50 dark:active:bg-[#0f1623]/50 rounded-lg transition-colors"
                  >
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
                      <div className="text-left">
                        <p className="text-foreground dark:text-white font-medium">{crypto.name || crypto.symbol}</p>
                        <p className="text-muted-foreground text-xs">
                          {crypto.symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground dark:text-white font-medium">{formatCurrency(crypto.current_price)}</p>
                      <p className={cn(
                        "text-xs",
                        crypto.price_change_percentage_24h >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {formatPercent(crypto.price_change_percentage_24h)}
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

            {/* Am meisten gehandelt */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">{t('mostTradedWeek') || 'Most Traded'}</span>
              </div>

              <div className="space-y-3">
                {mostTraded.map((crypto) => (
                  <button 
                    key={crypto.id} 
                    onClick={() => router.push(`/crypto/${crypto.symbol}`)}
                    className="w-full flex items-center justify-between py-2 active:bg-secondary/50 dark:active:bg-[#0f1623]/50 rounded-lg transition-colors"
                  >
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
                      <div className="text-left">
                        <p className="text-foreground dark:text-white font-medium">{crypto.name || crypto.symbol}</p>
                        <p className="text-muted-foreground text-xs">
                          {crypto.buyPercent}% {t('buys') || 'Buys'} · {100 - crypto.buyPercent}% {t('sells') || 'Sells'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground dark:text-white font-medium">{formatCurrency(crypto.current_price)}</p>
                      <p className={cn(
                        "text-xs",
                        crypto.price_change_percentage_24h >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {formatPercent(crypto.price_change_percentage_24h)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Alarme */}
            <div className="mt-4 mx-4 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium">{t('alerts') || 'Alerts'}</span>
              </div>

              <Link 
                href="/price-alerts"
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary dark:bg-[#0f1623] active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground dark:text-white font-medium">{t('addAlert') || 'Add Alert'}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
              </Link>
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-8 text-center text-muted-foreground text-xs leading-relaxed">
              <p>
                {t('cryptoDisclaimer') || 'Past performance is not a reliable indicator of future results. Cryptocurrencies are volatile.'}
              </p>
            </div>
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0">
        <MobileBottomNav />
      </div>
    </div>
  )
}
