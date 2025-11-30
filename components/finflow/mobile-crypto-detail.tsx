"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Star, 
  Bell, 
  Share2, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Activity,
  BarChart3,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "./CurrencyContext"

interface CryptoData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  marketCap: number
  circulatingSupply: number
  sparkline: number[]
}

interface MobileCryptoDetailProps {
  symbol: string
}

// Map symbols to CoinGecko IDs
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'MATIC': 'polygon',
  'SHIB': 'shiba-inu',
  'LTC': 'litecoin',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'AAVE': 'aave',
  'EOS': 'eos',
  'XTZ': 'tezos',
  'MKR': 'maker',
  'THETA': 'theta-token',
  'XMR': 'monero',
  'SAND': 'the-sandbox',
  'AXS': 'axie-infinity',
  'APE': 'apecoin',
  'CRO': 'crypto-com-chain',
  'NEAR': 'near',
  'FTM': 'fantom',
  'GRT': 'the-graph',
  'MANA': 'decentraland',
  'EGLD': 'elrond-erd-2',
  'HBAR': 'hedera-hashgraph',
  'FLOW': 'flow',
  'CHZ': 'chiliz',
  'ENJ': 'enjincoin',
  'ZIL': 'zilliqa',
  'BAT': 'basic-attention-token',
  'CAKE': 'pancakeswap-token',
  '1INCH': '1inch',
  'COMP': 'compound-governance-token',
  'SNX': 'havven',
  'CRV': 'curve-dao-token',
  'YFI': 'yearn-finance',
  'SUSHI': 'sushi',
  'ZRX': '0x',
  'REN': 'republic-protocol',
  'OMG': 'omisego',
  'KAVA': 'kava',
  'IOST': 'iostoken',
  'ONT': 'ontology',
  'WAVES': 'waves',
  'ICX': 'icon',
  'SC': 'siacoin',
  'BTT': 'bittorrent',
  'HOT': 'holotoken',
  'QTUM': 'qtum',
  'NANO': 'nano',
  'ZEC': 'zcash',
  'DASH': 'dash',
  'DCR': 'decred',
  'XEM': 'nem',
  'MIOTA': 'iota',
  'NEO': 'neo',
  'ETC': 'ethereum-classic'
}

// Full crypto names
const CRYPTO_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'BNB': 'BNB',
  'XRP': 'Ripple',
  'SOL': 'Solana',
  'DOGE': 'Dogecoin',
  'ADA': 'Cardano',
  'AVAX': 'Avalanche',
  'DOT': 'Polkadot',
  'MATIC': 'Polygon',
  'SHIB': 'Shiba Inu',
  'LTC': 'Litecoin',
  'LINK': 'Chainlink',
  'UNI': 'Uniswap',
  'ATOM': 'Cosmos',
  'XLM': 'Stellar',
  'ALGO': 'Algorand',
  'VET': 'VeChain',
  'FIL': 'Filecoin',
  'AAVE': 'Aave',
  'EOS': 'EOS',
  'XTZ': 'Tezos',
  'MKR': 'Maker',
  'THETA': 'Theta',
  'XMR': 'Monero',
  'SAND': 'The Sandbox',
  'AXS': 'Axie Infinity',
  'APE': 'ApeCoin',
  'CRO': 'Cronos',
  'NEAR': 'NEAR Protocol',
  'FTM': 'Fantom',
  'GRT': 'The Graph',
  'MANA': 'Decentraland',
  'EGLD': 'MultiversX',
  'HBAR': 'Hedera',
  'FLOW': 'Flow',
  'CHZ': 'Chiliz',
  'ENJ': 'Enjin Coin',
  'ZIL': 'Zilliqa',
  'BAT': 'Basic Attention Token',
  'CAKE': 'PancakeSwap',
  '1INCH': '1inch',
  'COMP': 'Compound',
  'SNX': 'Synthetix',
  'CRV': 'Curve DAO',
  'YFI': 'yearn.finance',
  'SUSHI': 'SushiSwap',
  'ZRX': '0x Protocol',
  'REN': 'Ren',
  'OMG': 'OMG Network',
  'KAVA': 'Kava',
  'IOST': 'IOST',
  'ONT': 'Ontology',
  'WAVES': 'Waves',
  'ICX': 'ICON',
  'SC': 'Siacoin',
  'BTT': 'BitTorrent',
  'HOT': 'Holo',
  'QTUM': 'Qtum',
  'NANO': 'Nano',
  'ZEC': 'Zcash',
  'DASH': 'Dash',
  'DCR': 'Decred',
  'XEM': 'NEM',
  'MIOTA': 'IOTA',
  'NEO': 'NEO',
  'ETC': 'Ethereum Classic'
}

function getCryptoLogo(symbol: string): string {
  const cleanSymbol = symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '').toLowerCase()
  return `https://assets.coingecko.com/coins/images/1/small/${cleanSymbol}.png`
}

export default function MobileCryptoDetail({ symbol }: MobileCryptoDetailProps) {
  const router = useRouter()
  const { currency } = useCurrency()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [isFavorite, setIsFavorite] = useState(false)

  const cleanSymbol = symbol.replace('EUR', '').replace('USDT', '').replace('CHF', '').toUpperCase()
  const cryptoName = CRYPTO_NAMES[cleanSymbol] || cleanSymbol
  const coingeckoId = COINGECKO_IDS[cleanSymbol]

  const timeframes = ['1H', '1D', '1W', '1M', '3M', '1Y', 'ALL']

  // Fetch crypto data
  const fetchData = async () => {
    try {
      const id = coingeckoId || cleanSymbol.toLowerCase()
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`
      )
      
      if (response.ok) {
        const data = await response.json()
        setCryptoData({
          symbol: cleanSymbol,
          price: data.market_data?.current_price?.[currency.toLowerCase()] || data.market_data?.current_price?.usd || 0,
          change24h: data.market_data?.price_change_24h_in_currency?.[currency.toLowerCase()] || data.market_data?.price_change_24h || 0,
          changePercent24h: data.market_data?.price_change_percentage_24h || 0,
          high24h: data.market_data?.high_24h?.[currency.toLowerCase()] || data.market_data?.high_24h?.usd || 0,
          low24h: data.market_data?.low_24h?.[currency.toLowerCase()] || data.market_data?.low_24h?.usd || 0,
          volume24h: data.market_data?.total_volume?.[currency.toLowerCase()] || data.market_data?.total_volume?.usd || 0,
          marketCap: data.market_data?.market_cap?.[currency.toLowerCase()] || data.market_data?.market_cap?.usd || 0,
          circulatingSupply: data.market_data?.circulating_supply || 0,
          sparkline: data.market_data?.sparkline_7d?.price || []
        })
      } else {
        // Fallback data
        setCryptoData({
          symbol: cleanSymbol,
          price: cleanSymbol === 'BTC' ? 67500 : cleanSymbol === 'ETH' ? 3200 : 100,
          change24h: 0,
          changePercent24h: 2.5,
          high24h: 0,
          low24h: 0,
          volume24h: 0,
          marketCap: 0,
          circulatingSupply: 0,
          sparkline: Array.from({ length: 168 }, (_, i) => Math.random() * 100 + 50)
        })
      }
    } catch (error) {
      console.error('Failed to fetch crypto data:', error)
      // Fallback
      setCryptoData({
        symbol: cleanSymbol,
        price: cleanSymbol === 'BTC' ? 67500 : cleanSymbol === 'ETH' ? 3200 : 100,
        change24h: 0,
        changePercent24h: 2.5,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        marketCap: 0,
        circulatingSupply: 0,
        sparkline: Array.from({ length: 168 }, (_, i) => Math.random() * 100 + 50)
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, currency])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value)
  }

  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toFixed(2)
  }

  // Generate chart path from sparkline data
  const chartPath = useMemo(() => {
    if (!cryptoData?.sparkline?.length) return ''
    
    const data = cryptoData.sparkline
    const width = 350
    const height = 150
    const padding = 10
    
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((value - min) / range) * (height - 2 * padding)
      return `${x},${y}`
    })
    
    return `M ${points.join(' L ')}`
  }, [cryptoData?.sparkline])

  const isPositive = cryptoData ? cryptoData.changePercent24h >= 0 : true

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#0f1623] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#0f1623]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 dark:bg-[#0f1623]/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground dark:text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center"
            >
              <RefreshCw className={cn(
                "w-5 h-5 text-foreground dark:text-white",
                isRefreshing && "animate-spin"
              )} />
            </button>
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center"
            >
              <Star className={cn(
                "w-5 h-5",
                isFavorite ? "fill-yellow-400 text-yellow-400" : "text-foreground dark:text-white"
              )} />
            </button>
            <button 
              onClick={() => router.push(`/price-alerts?symbol=${cleanSymbol}`)}
              className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-foreground dark:text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-32">
        {/* Crypto Info */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={`https://assets.coingecko.com/coins/images/${coingeckoId ? '' : '1/small/'}${coingeckoId || cleanSymbol.toLowerCase()}.png`}
              alt={cleanSymbol}
              className="w-14 h-14 rounded-full bg-secondary"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/logos/cryptocurrency/default.png'
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-white">{cryptoName}</h1>
              <p className="text-muted-foreground">{cleanSymbol}</p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-2">
            <span className="text-4xl font-bold text-foreground dark:text-white">
              {formatCurrency(cryptoData?.price || 0)}
            </span>
          </div>

          {/* Change */}
          <div className={cn(
            "flex items-center gap-2 text-lg font-medium",
            isPositive ? "text-green-500" : "text-red-500"
          )}>
            {isPositive ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : (
              <ArrowDownRight className="w-5 h-5" />
            )}
            <span>
              {isPositive ? '+' : ''}{cryptoData?.changePercent24h.toFixed(2)}%
            </span>
            <span className="text-muted-foreground text-sm">24h</span>
          </div>
        </div>

        {/* Chart */}
        <div className="px-4 mb-6">
          <div className="bg-card dark:bg-[#1e293b] rounded-2xl p-4 border border-border dark:border-[#2d3a4f]">
            {/* Timeframe Selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    selectedTimeframe === tf
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary dark:bg-[#2d3a4f] text-muted-foreground"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* SVG Chart */}
            <div className="h-40 w-full">
              <svg viewBox="0 0 350 150" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                {chartPath && (
                  <path
                    d={`${chartPath} L 340,140 L 10,140 Z`}
                    fill="url(#chartGradient)"
                  />
                )}
                
                {/* Line */}
                {chartPath && (
                  <path
                    d={chartPath}
                    fill="none"
                    stroke={isPositive ? "#22c55e" : "#ef4444"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-white mb-3">Statistiken</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card dark:bg-[#1e293b] rounded-xl p-4 border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">24h Hoch</span>
              </div>
              <p className="text-lg font-semibold text-foreground dark:text-white">
                {cryptoData?.high24h ? formatCurrency(cryptoData.high24h) : '-'}
              </p>
            </div>
            
            <div className="bg-card dark:bg-[#1e293b] rounded-xl p-4 border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">24h Tief</span>
              </div>
              <p className="text-lg font-semibold text-foreground dark:text-white">
                {cryptoData?.low24h ? formatCurrency(cryptoData.low24h) : '-'}
              </p>
            </div>
            
            <div className="bg-card dark:bg-[#1e293b] rounded-xl p-4 border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Volumen (24h)</span>
              </div>
              <p className="text-lg font-semibold text-foreground dark:text-white">
                {cryptoData?.volume24h ? `${currency} ${formatLargeNumber(cryptoData.volume24h)}` : '-'}
              </p>
            </div>
            
            <div className="bg-card dark:bg-[#1e293b] rounded-xl p-4 border border-border dark:border-[#2d3a4f]">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Marktkapitalisierung</span>
              </div>
              <p className="text-lg font-semibold text-foreground dark:text-white">
                {cryptoData?.marketCap ? `${currency} ${formatLargeNumber(cryptoData.marketCap)}` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Supply Info */}
        <div className="px-4 mb-6">
          <div className="bg-card dark:bg-[#1e293b] rounded-xl p-4 border border-border dark:border-[#2d3a4f]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                <span className="text-sm text-muted-foreground">Umlaufende Versorgung</span>
              </div>
              <p className="text-foreground dark:text-white font-medium">
                {cryptoData?.circulatingSupply ? formatLargeNumber(cryptoData.circulatingSupply) : '-'} {cleanSymbol}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 dark:bg-[#0f1623]/80 backdrop-blur-xl border-t border-border dark:border-[#2d3a4f] pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="flex gap-3">
          <button 
            onClick={() => router.push(`/trading-agent?symbol=${cleanSymbol}&action=sell`)}
            className="flex-1 py-4 rounded-xl bg-red-500 text-white font-semibold text-lg"
          >
            Verkaufen
          </button>
          <button 
            onClick={() => router.push(`/trading-agent?symbol=${cleanSymbol}&action=buy`)}
            className="flex-1 py-4 rounded-xl bg-green-500 text-white font-semibold text-lg"
          >
            Kaufen
          </button>
        </div>
      </div>
    </div>
  )
}
