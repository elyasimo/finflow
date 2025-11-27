"use client"

import { useState } from "react"
import { 
  Bell,
  BellOff,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  Check,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileHeader from "./mobile-header"
import MobileBottomNav from "./mobile-bottom-nav"

interface PriceAlert {
  id: string
  asset: string
  alertType: 'above' | 'below'
  targetPrice: string
  currentPrice: string | null
  isActive: boolean
  triggeredAt: string | null
  createdAt: string
}

interface MobilePriceAlertsProps {
  alerts: PriceAlert[]
  isLoading: boolean
  onCreateAlert: (data: { asset: string; alertType: 'above' | 'below'; targetPrice: string }) => Promise<void>
  onDeleteAlert: (id: string) => Promise<void>
  onToggleAlert: (id: string) => Promise<void>
  isCreating?: boolean
}

export default function MobilePriceAlerts({
  alerts,
  isLoading,
  onCreateAlert,
  onDeleteAlert,
  onToggleAlert,
  isCreating = false,
}: MobilePriceAlertsProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAlert, setNewAlert] = useState({
    asset: '',
    alertType: 'above' as 'above' | 'below',
    targetPrice: '',
  })

  const formatPrice = (price: string | null) => {
    if (!price) return 'N/A'
    const num = parseFloat(price)
    return num < 1 ? num.toFixed(6) : num.toFixed(2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleCreate = async () => {
    if (!newAlert.asset || !newAlert.targetPrice) return
    
    await onCreateAlert(newAlert)
    setNewAlert({ asset: '', alertType: 'above', targetPrice: '' })
    setShowCreateForm(false)
  }

  const activeAlerts = alerts.filter(a => a.isActive && !a.triggeredAt)
  const triggeredAlerts = alerts.filter(a => a.triggeredAt)

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <MobileHeader title="Preisalarme" />

      {/* Content */}
      <div className="px-4 pt-4 pb-28">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 mb-6 text-white shadow-xl shadow-blue-500/25">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Aktive Alarme</p>
                <p className="text-3xl font-bold">{activeAlerts.length}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm">
            Erhalten Sie Benachrichtigungen, wenn Ihre Zielpreise erreicht werden.
          </p>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
            <div className="bg-white dark:bg-[#1a2332] rounded-t-3xl w-full p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Neuer Preisalarm
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Asset Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Asset / Symbol
                  </label>
                  <input
                    type="text"
                    value={newAlert.asset}
                    onChange={(e) => setNewAlert({ ...newAlert, asset: e.target.value.toUpperCase() })}
                    placeholder="z.B. BTCUSDT, AAPL"
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Alert Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Alarmtyp
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNewAlert({ ...newAlert, alertType: 'above' })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all",
                        newAlert.alertType === 'above'
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <TrendingUp className="w-5 h-5" />
                      Über
                    </button>
                    <button
                      onClick={() => setNewAlert({ ...newAlert, alertType: 'below' })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all",
                        newAlert.alertType === 'below'
                          ? "bg-rose-500 text-white"
                          : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <TrendingDown className="w-5 h-5" />
                      Unter
                    </button>
                  </div>
                </div>

                {/* Target Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Zielpreis
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newAlert.targetPrice}
                    onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !newAlert.asset || !newAlert.targetPrice}
                  className="w-full py-4 rounded-xl bg-blue-500 text-white font-semibold text-lg shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Alarm erstellen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Lade Alarme...</p>
          </div>
        ) : (
          <>
            {/* Active Alerts */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Aktive Alarme ({activeAlerts.length})
              </h3>
              
              {activeAlerts.length === 0 ? (
                <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Noch keine Alarme. Erstellen Sie einen, um benachrichtigt zu werden!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            alert.alertType === 'above' 
                              ? "bg-emerald-100 dark:bg-emerald-900/30" 
                              : "bg-rose-100 dark:bg-rose-900/30"
                          )}>
                            {alert.alertType === 'above' ? (
                              <TrendingUp className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {alert.asset}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {alert.alertType === 'above' ? 'Über' : 'Unter'} {formatPrice(alert.targetPrice)}
                            </p>
                            {alert.currentPrice && (
                              <p className="text-xs text-gray-400">
                                Aktuell: {formatPrice(alert.currentPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleAlert(alert.id)}
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                              alert.isActive 
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" 
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            )}
                          >
                            {alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => onDeleteAlert(alert.id)}
                            className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Ausgelöste Alarme ({triggeredAlerts.length})
                </h3>
                <div className="space-y-3">
                  {triggeredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 shadow-sm opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {alert.asset}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Ziel: {formatPrice(alert.targetPrice)} • Ausgelöst: {formatPrice(alert.currentPrice)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {alert.triggeredAt && formatDate(alert.triggeredAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteAlert(alert.id)}
                          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateForm(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-blue-500 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
