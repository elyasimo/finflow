"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  Bot, 
  Shield, 
  Zap, 
  TrendingUp,
  Bitcoin,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useMediaQuery } from '@/hooks/use-mobile'
import { tradingAgentApi } from '@/lib/api'
import MobileBottomNav from '@/components/finflow/mobile-bottom-nav'

// Popular cryptos for quick selection
const POPULAR_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'MATIC', name: 'Polygon' },
]

// Popular stocks for selection
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'JPM', name: 'JPMorgan' },
]

type Strategy = 'conservative' | 'moderate' | 'aggressive'
type AgentType = 'crypto' | 'stocks' | 'mixed'

export default function ConfigureRoboAdvisorPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const isMobile = useMediaQuery("(max-width: 1023px)")
  
  // Form state
  const [agentName, setAgentName] = useState('')
  const [agentType, setAgentType] = useState<AgentType>('crypto')
  const [strategy, setStrategy] = useState<Strategy>('moderate')
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [stopLoss, setStopLoss] = useState(8)
  const [takeProfit, setTakeProfit] = useState(15)
  const [maxDailyTrades, setMaxDailyTrades] = useState(100)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strategies = [
    { 
      id: 'conservative' as Strategy, 
      icon: Shield, 
      title: 'Konservativ',
      description: 'Niedriges Risiko, stabiles Wachstum',
      color: 'from-green-500 to-emerald-600'
    },
    { 
      id: 'moderate' as Strategy, 
      icon: TrendingUp, 
      title: 'Moderat',
      description: 'Ausgewogenes Risiko-Rendite-Verhältnis',
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      id: 'aggressive' as Strategy, 
      icon: Zap, 
      title: 'Aggressiv',
      description: 'Höheres Risiko, höhere Rendite',
      color: 'from-orange-500 to-red-600'
    },
  ]

  const agentTypes = [
    { id: 'crypto' as AgentType, icon: Bitcoin, title: 'Krypto', color: 'from-orange-500 to-yellow-500' },
    { id: 'stocks' as AgentType, icon: TrendingUp, title: 'Aktien', color: 'from-blue-500 to-indigo-600' },
    { id: 'mixed' as AgentType, icon: Bot, title: 'Gemischt', color: 'from-purple-500 to-pink-500' },
  ]

  const availableAssets = agentType === 'crypto' ? POPULAR_CRYPTOS : 
                          agentType === 'stocks' ? POPULAR_STOCKS : 
                          [...POPULAR_CRYPTOS.slice(0, 5), ...POPULAR_STOCKS.slice(0, 5)]

  const toggleAsset = (symbol: string) => {
    setSelectedAssets(prev => 
      prev.includes(symbol) 
        ? prev.filter(a => a !== symbol)
        : [...prev, symbol]
    )
  }

  const handleCreate = async () => {
    if (!agentName.trim()) {
      setError('Bitte gib einen Namen für deinen Agent ein')
      return
    }
    if (selectedAssets.length === 0) {
      setError('Bitte wähle mindestens ein Asset aus')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      await tradingAgentApi.createAgent({
        name: agentName,
        assets: selectedAssets,
        strategy,
        stopLossPercent: stopLoss,
        takeProfitPercent: takeProfit,
        maxDailyTradesEur: maxDailyTrades,
        maxSingleTradeEur: 50,
      })

      // Navigate back to robo-advisor
      router.push('/robo-advisor')
    } catch {
      setError('Fehler beim Erstellen des Agents. Bitte versuche es erneut.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0f1623] overflow-hidden">
      {/* Header */}
      <div 
        className="flex-shrink-0 z-40 bg-[#0f1623] border-b border-gray-800"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 h-12">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-gray-300" />
          </button>
          <h1 className="text-base font-semibold text-white flex-1">
            Neuen Agent erstellen
          </h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}
      >
        <div className="p-4 space-y-6">
          {/* Agent Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="z.B. Mein Krypto Bot"
              className="w-full px-4 py-3 rounded-xl bg-[#1e293b] text-white placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Agent Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">Agent Typ</label>
            <div className="grid grid-cols-3 gap-2">
              {agentTypes.map((type) => {
                const Icon = type.icon
                const isSelected = agentType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setAgentType(type.id)
                      setSelectedAssets([])
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                      isSelected 
                        ? `bg-gradient-to-br ${type.color} shadow-lg` 
                        : "bg-[#1e293b] hover:bg-[#2a3a50]"
                    )}
                  >
                    <Icon className={cn("w-6 h-6", isSelected ? "text-white" : "text-gray-400")} />
                    <span className={cn("text-sm font-medium", isSelected ? "text-white" : "text-gray-400")}>
                      {type.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">Strategie</label>
            <div className="space-y-2">
              {strategies.map((strat) => {
                const Icon = strat.icon
                const isSelected = strategy === strat.id
                return (
                  <button
                    key={strat.id}
                    onClick={() => setStrategy(strat.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl transition-all",
                      isSelected 
                        ? "bg-[#1e293b] ring-2 ring-blue-500" 
                        : "bg-[#1e293b]/50 hover:bg-[#1e293b]"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                      strat.color
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{strat.title}</p>
                      <p className="text-sm text-gray-400">{strat.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Asset Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">
              Assets auswählen ({selectedAssets.length} ausgewählt)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableAssets.map((asset) => {
                const isSelected = selectedAssets.includes(asset.symbol)
                return (
                  <button
                    key={asset.symbol}
                    onClick={() => toggleAsset(asset.symbol)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all",
                      isSelected 
                        ? "bg-blue-500/20 ring-1 ring-blue-500" 
                        : "bg-[#1e293b] hover:bg-[#2a3a50]"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
                    )}>
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={cn("text-sm font-medium", isSelected ? "text-white" : "text-gray-300")}>
                        {asset.symbol}
                      </p>
                      <p className="text-xs text-gray-500">{asset.name}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Risk Settings */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-400">Risiko-Einstellungen</label>
            
            <div className="bg-[#1e293b] rounded-xl p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Stop Loss</span>
                  <span className="text-white font-medium">{stopLoss}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Take Profit</span>
                  <span className="text-white font-medium">{takeProfit}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Max. tägliches Volumen</span>
                  <span className="text-white font-medium">€{maxDailyTrades}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={maxDailyTrades}
                  onChange={(e) => setMaxDailyTrades(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Create Button - inside scrollable area */}
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className={cn(
              "w-full py-4 rounded-2xl font-semibold text-lg",
              "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
              "active:scale-[0.98] transition-transform",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5" />
                Agent erstellen
              </>
            )}
          </button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="flex-shrink-0">
        <MobileBottomNav />
      </div>
    </div>
  )
}
