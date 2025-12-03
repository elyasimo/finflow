"use client"

import { useState } from "react"
import { 
  Bot,
  Plus,
  Trash2,
  History,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Loader2,
  Activity,
  Settings,
  Play,
  Pause,
  ChevronRight,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileHeader from "./mobile-header"
import MobileBottomNav from "./mobile-bottom-nav"

interface TradingAgent {
  id: string
  name: string
  enabled: boolean
  assets: string[]
  strategy: string
  stopLossPercent: string
  takeProfitPercent: string
  totalTradesExecuted: number
  totalProfitCents: number
  lastTradeAt: string | null
  maxDailyTradesCents: number
}

interface PortfolioItem {
  asset: string
  quantity: number
  priceEur: number
  priceChange24h: number
  valueEur: number
  monitoredBy: string | null
}

interface TradeLog {
  id: string
  action: string
  asset: string
  quantity: string
  priceAtAction: string
  reason: string
  status: string
  errorMessage: string | null
  createdAt: string
}

interface MobileTradingAgentProps {
  agents: TradingAgent[]
  portfolio: PortfolioItem[]
  totalValueEur: number
  isLoading: boolean
  onCreateAgent: (data: any) => Promise<void>
  onToggleAgent: (id: string, enabled: boolean) => Promise<void>
  onDeleteAgent: (id: string) => Promise<void>
  onLoadLogs: (agentId: string) => Promise<TradeLog[]>
  isCreating?: boolean
}

export default function MobileTradingAgent({
  agents,
  portfolio,
  totalValueEur,
  isLoading,
  onCreateAgent,
  onToggleAgent,
  onDeleteAgent,
  onLoadLogs,
  isCreating = false,
}: MobileTradingAgentProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showLogsSheet, setShowLogsSheet] = useState(false)
  const [selectedAgentLogs, setSelectedAgentLogs] = useState<TradeLog[]>([])
  const [selectedAgentName, setSelectedAgentName] = useState('')
  const [activeTab, setActiveTab] = useState<'agents' | 'portfolio'>('agents')
  
  // Form state
  const [newAgent, setNewAgent] = useState({
    name: 'Mein Trading Agent',
    assets: [] as string[],
    strategy: 'conservative',
    stopLoss: 8,
    takeProfit: 15,
    maxDailyTrades: 100,
  })

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleCreate = async () => {
    if (!newAgent.name || newAgent.assets.length === 0) return
    
    await onCreateAgent({
      name: newAgent.name,
      assets: newAgent.assets,
      strategy: newAgent.strategy,
      stopLossPercent: newAgent.stopLoss,
      takeProfitPercent: newAgent.takeProfit,
      maxDailyTradesEur: newAgent.maxDailyTrades,
    })
    
    setNewAgent({
      name: 'Mein Trading Agent',
      assets: [],
      strategy: 'conservative',
      stopLoss: 8,
      takeProfit: 15,
      maxDailyTrades: 100,
    })
    setShowCreateForm(false)
  }

  const handleViewLogs = async (agent: TradingAgent) => {
    setSelectedAgentName(agent.name)
    const logs = await onLoadLogs(agent.id)
    setSelectedAgentLogs(logs)
    setShowLogsSheet(true)
  }

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'conservative': return Shield
      case 'moderate': return TrendingUp
      case 'aggressive': return Zap
      default: return Bot
    }
  }

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'conservative': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
      case 'moderate': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30'
      case 'aggressive': return 'text-rose-500 bg-rose-100 dark:bg-rose-900/30'
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-800'
    }
  }

  const popularAssets = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'MATIC']

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
        <MobileHeader title="Trading Agent" />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Lade Trading Agents...</p>
        </div>
        <MobileBottomNav fixed />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <MobileHeader title="Trading Agent" />

      {/* Content */}
      <div className="px-4 pt-4 pb-28">
        {/* Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400 text-sm">Wichtiger Hinweis</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                Trading-Bots handeln automatisch. Investieren Sie nur, was Sie sich leisten können zu verlieren.
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Value Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-5 mb-6 text-white shadow-xl shadow-purple-500/25">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm">Portfolio-Wert</p>
              <p className="text-3xl font-bold">{formatCurrency(totalValueEur)}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-200" />
            <span className="text-purple-200 text-sm">
              {agents.filter(a => a.enabled).length} Aktive Agents • {portfolio.length} Assets
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('agents')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === 'agents'
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
            )}
          >
            Agents ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === 'portfolio'
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
            )}
          >
            Portfolio ({portfolio.length})
          </button>
        </div>

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-3">
            {agents.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
                <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Noch keine Trading Agents erstellt.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25"
                >
                  <Plus className="w-5 h-5" />
                  Ersten Agent erstellen
                </button>
              </div>
            ) : (
              agents.map((agent) => {
                const StrategyIcon = getStrategyIcon(agent.strategy)
                return (
                  <div
                    key={agent.id}
                    className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          getStrategyColor(agent.strategy)
                        )}>
                          <StrategyIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {agent.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {agent.strategy} • {agent.assets.length} Assets
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleAgent(agent.id, !agent.enabled)}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          agent.enabled 
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500" 
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                        )}
                      >
                        {agent.enabled ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gray-50 dark:bg-[#232e40] rounded-xl p-2.5 text-center">
                        <p className="text-xs text-gray-400">Stop-Loss</p>
                        <p className="text-sm font-semibold text-rose-500">-{agent.stopLossPercent}%</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#232e40] rounded-xl p-2.5 text-center">
                        <p className="text-xs text-gray-400">Take-Profit</p>
                        <p className="text-sm font-semibold text-emerald-500">+{agent.takeProfitPercent}%</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#232e40] rounded-xl p-2.5 text-center">
                        <p className="text-xs text-gray-400">Trades</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{agent.totalTradesExecuted}</p>
                      </div>
                    </div>

                    {/* Assets */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {agent.assets.slice(0, 5).map((asset) => (
                        <span key={asset} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                          {asset}
                        </span>
                      ))}
                      {agent.assets.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-400">
                          +{agent.assets.length - 5}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewLogs(agent)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-[#232e40] rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300"
                      >
                        <History className="w-4 h-4" />
                        Verlauf
                      </button>
                      <button
                        onClick={() => onDeleteAgent(agent.id)}
                        className="w-11 h-11 flex items-center justify-center bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-3">
            {portfolio.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Kein Portfolio gefunden.
                </p>
              </div>
            ) : (
              portfolio.map((item) => (
                <div
                  key={item.asset}
                  className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.asset}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.quantity.toFixed(6)} @ {formatCurrency(item.priceEur)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.valueEur)}
                      </p>
                      <div className={cn(
                        "flex items-center justify-end gap-1 text-sm",
                        item.priceChange24h >= 0 
                          ? "text-emerald-500" 
                          : "text-rose-500"
                      )}>
                        {item.priceChange24h >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span className="font-medium">
                          {Math.abs(item.priceChange24h).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {item.monitoredBy && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        Überwacht von: {item.monitoredBy}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
            <div className="bg-white dark:bg-[#1a2332] rounded-t-3xl w-full max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Neuer Trading Agent
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white"
                  />
                </div>

                {/* Strategy */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Strategie
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['conservative', 'moderate', 'aggressive'].map((strat) => {
                      const Icon = getStrategyIcon(strat)
                      return (
                        <button
                          key={strat}
                          onClick={() => setNewAgent({ ...newAgent, strategy: strat })}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                            newAgent.strategy === strat
                              ? getStrategyColor(strat)
                              : "bg-gray-100 dark:bg-[#232e40] text-gray-500"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium capitalize">{strat === 'conservative' ? 'Konservativ' : strat === 'moderate' ? 'Moderat' : 'Aggressiv'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Assets */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Assets auswählen
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {popularAssets.map((asset) => (
                      <button
                        key={asset}
                        onClick={() => {
                          if (newAgent.assets.includes(asset)) {
                            setNewAgent({ ...newAgent, assets: newAgent.assets.filter(a => a !== asset) })
                          } else {
                            setNewAgent({ ...newAgent, assets: [...newAgent.assets, asset] })
                          }
                        }}
                        className={cn(
                          "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                          newAgent.assets.includes(asset)
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-300"
                        )}
                      >
                        {asset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stop Loss */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Stop-Loss
                    </label>
                    <span className="text-sm font-bold text-rose-500">-{newAgent.stopLoss}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={newAgent.stopLoss}
                    onChange={(e) => setNewAgent({ ...newAgent, stopLoss: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Take Profit */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Take-Profit
                    </label>
                    <span className="text-sm font-bold text-emerald-500">+{newAgent.takeProfit}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={newAgent.takeProfit}
                    onChange={(e) => setNewAgent({ ...newAgent, takeProfit: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  disabled={isCreating || newAgent.assets.length === 0}
                  className="w-full py-4 rounded-xl bg-purple-500 text-white font-semibold text-lg shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      Agent erstellen ({newAgent.assets.length} Assets)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs Sheet */}
        {showLogsSheet && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
            <div className="bg-white dark:bg-[#1a2332] rounded-t-3xl w-full max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Trade-Verlauf: {selectedAgentName}
                </h2>
                <button
                  onClick={() => setShowLogsSheet(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {selectedAgentLogs.length === 0 ? (
                <div className="py-8 text-center">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Noch keine Trades ausgeführt.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAgentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-gray-50 dark:bg-[#232e40] rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-xs font-bold uppercase",
                            log.action === 'buy' ? "bg-emerald-100 text-emerald-600" :
                            log.action === 'sell' ? "bg-blue-100 text-blue-600" :
                            log.action === 'stop_loss' ? "bg-rose-100 text-rose-600" :
                            "bg-amber-100 text-amber-600"
                          )}>
                            {log.action}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.asset}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{log.reason}</p>
                      {log.quantity && (
                        <p className="text-xs text-gray-400">
                          Menge: {parseFloat(log.quantity).toFixed(6)} @ {formatCurrency(parseFloat(log.priceAtAction))}
                        </p>
                      )}
                      <span className={cn(
                        "inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium",
                        log.status === 'executed' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateForm(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-purple-500 rounded-full shadow-2xl shadow-purple-500/40 flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  )
}
