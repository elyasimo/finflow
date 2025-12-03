"use client"

import { useState, useEffect } from "react"
import { 
  History,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  Search,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "@/hooks/use-currency"
import { useExchangeRates } from "@/hooks/use-exchange-rates"
import MobilePageHeader, { MobilePageHeaderSpacer } from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"
import { tradingAgentApi } from "@/lib/api"

interface TradeLog {
  id: string
  agentId: string
  agentName: string
  action: string
  asset: string
  quantity: string
  priceAtAction: string
  totalValueCents: number
  reason: string
  orderId: string | null
  status: string
  errorMessage: string | null
  createdAt: string
}

interface Stats {
  totalTrades: number
  executedTrades: number
  failedTrades: number
  totalVolumeEur: number
  profitLossEur: number
}

interface MobileTradingHistoryProps {
  user?: { id: string; email: string; fullName?: string }
}

export default function MobileTradingHistory({ user }: MobileTradingHistoryProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const { convertAndFormat } = useExchangeRates()

  const [logs, setLogs] = useState<TradeLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assetFilter, setAssetFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    loadHistory()
  }, [statusFilter, assetFilter, actionFilter, page])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const filters: any = {
        limit,
        offset: page * limit,
      }

      if (statusFilter !== 'all') filters.status = statusFilter
      if (assetFilter) filters.asset = assetFilter.toUpperCase()
      if (actionFilter !== 'all') filters.action = actionFilter

      const data = await tradingAgentApi.getTradingHistory(filters)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error loading trading history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCsv = () => {
    const headers = ['Date', 'Agent', 'Asset', 'Action', 'Quantity', 'Price', 'Value', 'Status', 'Reason']
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.agentName,
      log.asset,
      log.action,
      log.quantity || '',
      log.priceAtAction || '',
      log.totalValueCents ? (log.totalValueCents / 100).toFixed(2) : '',
      log.status,
      log.reason,
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trading-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'bg-emerald-500'
      case 'failed': return 'bg-rose-500'
      case 'pending': return 'bg-amber-500'
      default: return 'bg-gray-500'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
      case 'sell': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
      case 'stop_loss': return 'text-rose-500 bg-rose-100 dark:bg-rose-900/30'
      case 'take_profit': return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-800'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'buy': return 'Kauf'
      case 'sell': return 'Verkauf'
      case 'stop_loss': return 'Stop Loss'
      case 'take_profit': return 'Take Profit'
      default: return action
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader 
        user={user}
        title={t('tradingHistory') || 'Trading History'}
      />
      <MobilePageHeaderSpacer />

      {/* Stats Summary */}
      {stats && (
        <div className="px-5 py-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-indigo-100 text-sm">Total Trades</p>
                  <p className="text-2xl font-bold">{stats.totalTrades}</p>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full",
                stats.profitLossEur >= 0 ? "bg-emerald-500/30" : "bg-rose-500/30"
              )}>
                {stats.profitLossEur >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {stats.profitLossEur >= 0 ? '+' : ''}{convertAndFormat(stats.profitLossEur, 'EUR', currency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-indigo-200">Ausgeführt</p>
                <p className="text-lg font-bold text-emerald-300">{stats.executedTrades}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-indigo-200">Fehlgeschlagen</p>
                <p className="text-lg font-bold text-rose-300">{stats.failedTrades}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-indigo-200">Volumen</p>
                <p className="text-sm font-bold">{convertAndFormat(stats.totalVolumeEur, 'EUR', currency)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Asset suchen..."
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1a2332] rounded-xl text-sm border-0"
            />
          </div>
          
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
              showFilters 
                ? "bg-blue-500 text-white" 
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white dark:bg-[#1a2332] rounded-xl space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Status</label>
              <div className="flex gap-2">
                {['all', 'executed', 'failed', 'pending'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      statusFilter === status
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {status === 'all' ? 'Alle' : status === 'executed' ? 'Ausgeführt' : status === 'failed' ? 'Fehlgeschlagen' : 'Ausstehend'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Aktion</label>
              <div className="flex gap-2">
                {['all', 'buy', 'sell', 'stop_loss', 'take_profit'].map(action => (
                  <button
                    key={action}
                    onClick={() => setActionFilter(action)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      actionFilter === action
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {action === 'all' ? 'Alle' : getActionLabel(action)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade List */}
      <div className="px-5 pb-40">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
            <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Keine Trades gefunden
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-[#1a2332] rounded-2xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      getActionColor(log.action)
                    )}>
                      {log.action === 'buy' || log.action === 'take_profit' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{log.asset}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          getActionColor(log.action)
                        )}>
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{log.agentName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      getStatusColor(log.status)
                    )} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {log.status === 'executed' ? 'Ausgeführt' : log.status === 'failed' ? 'Fehlgeschlagen' : 'Ausstehend'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div>
                    <p className="text-xs text-gray-400">Menge</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.quantity ? parseFloat(log.quantity).toFixed(4) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Preis</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.priceAtAction ? convertAndFormat(parseFloat(log.priceAtAction), 'EUR', currency) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Wert</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.totalValueCents ? convertAndFormat(log.totalValueCents / 100, 'EUR', currency) : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 truncate max-w-[200px]" title={log.reason}>
                    {log.reason}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {page * limit + 1}-{Math.min((page + 1) * limit, total)} von {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a2332] flex items-center justify-center disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * limit >= total}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a2332] flex items-center justify-center disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB - Export Button */}
      <button
        onClick={exportToCsv}
        disabled={logs.length === 0}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center active:scale-95 transition-transform z-20 disabled:opacity-50"
        aria-label="Export CSV"
      >
        <Download className="w-7 h-7 text-white" />
      </button>

      <MobileBottomNav fixed />
    </div>
  )
}
