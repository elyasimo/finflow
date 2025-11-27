"use client"

import { useState, useMemo } from "react"
import { 
  Plus,
  PiggyBank,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import { getTranslatedText } from "@/lib/translation-utils"
import { Budget } from "@/lib/types"

interface MobileBudgetsProps {
  budgets: Budget[]
  budgetUsage: Record<string, number> // budgetId -> spent amount
  onAddBudget: () => void
  onEditBudget: (budget: Budget) => void
  onDeleteBudget: (budget: Budget) => void
}

export default function MobileBudgets({
  budgets,
  budgetUsage,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}: MobileBudgetsProps) {
  const { t, language } = useLanguage()
  const { currency } = useCurrency()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate budget statistics
  const stats = useMemo(() => {
    const total = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
    const spent = Object.values(budgetUsage).reduce((sum, s) => sum + s, 0)
    const remaining = total - spent
    return { total, spent, remaining }
  }, [budgets, budgetUsage])

  const getBudgetStatus = (budget: Budget) => {
    const spent = budgetUsage[budget.id] || 0
    const amount = Number(budget.amount)
    const progress = amount > 0 ? (spent / amount) * 100 : 0
    
    if (progress >= 100) return { status: 'over', color: 'red', icon: AlertTriangle }
    if (progress >= 80) return { status: 'warning', color: 'orange', icon: AlertTriangle }
    return { status: 'ok', color: 'emerald', icon: CheckCircle }
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <p className="text-purple-100 text-sm font-medium mb-1">{t('budgets')}</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {formatCurrency(stats.total)}
          </h1>
          
          {/* Progress Bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                stats.spent / stats.total >= 1 ? "bg-red-400" : 
                stats.spent / stats.total >= 0.8 ? "bg-orange-400" : "bg-emerald-400"
              )}
              style={{ width: `${Math.min((stats.spent / stats.total) * 100, 100)}%` }}
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <span className="text-xs text-purple-100">Ausgegeben</span>
              <p className="text-lg font-semibold">{formatCurrency(stats.spent)}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <span className="text-xs text-purple-100">Verbleibend</span>
              <p className="text-lg font-semibold">{formatCurrency(Math.max(stats.remaining, 0))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budgets List */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white px-1">
          {t('budgets')} ({budgets.length})
        </h2>
        
        {budgets.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center border border-gray-100 dark:border-[#232e40]">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('noData') || 'Keine Budgets'}</p>
            <button
              onClick={onAddBudget}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('addBudget')}
            </button>
          </div>
        ) : (
          budgets.map((budget) => {
            const spent = budgetUsage[budget.id] || 0
            const amount = Number(budget.amount)
            const progress = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0
            const { status, color } = getBudgetStatus(budget)
            const name = getTranslatedText(budget.name, budget.nameTranslations, language)
            
            return (
              <div
                key={budget.id}
                className="relative bg-white dark:bg-[#1a2332] rounded-2xl p-4 border border-gray-100 dark:border-[#232e40]"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      color === 'red' ? "bg-red-100 dark:bg-red-900/30" :
                      color === 'orange' ? "bg-orange-100 dark:bg-orange-900/30" :
                      "bg-emerald-100 dark:bg-emerald-900/30"
                    )}>
                      <PiggyBank className={cn(
                        "w-5 h-5",
                        color === 'red' ? "text-red-600 dark:text-red-400" :
                        color === 'orange' ? "text-orange-600 dark:text-orange-400" :
                        "text-emerald-600 dark:text-emerald-400"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(budget.startDate).toLocaleDateString('de-CH')} - {new Date(budget.endDate).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveMenu(activeMenu === budget.id ? null : budget.id)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232e40] flex items-center justify-center"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{Math.round(progress)}% verwendet</span>
                    <span className={cn(
                      "font-medium",
                      color === 'red' ? "text-red-600" :
                      color === 'orange' ? "text-orange-600" :
                      "text-emerald-600"
                    )}>
                      {formatCurrency(amount - spent, budget.currency)} übrig
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-[#232e40] rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        color === 'red' ? "bg-red-500" :
                        color === 'orange' ? "bg-orange-500" :
                        "bg-emerald-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatCurrency(spent, budget.currency)} / {formatCurrency(amount, budget.currency)}
                  </span>
                </div>

                {/* Action Menu */}
                {activeMenu === budget.id && (
                  <div className="absolute top-14 right-4 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-100 dark:border-[#232e40] overflow-hidden z-10">
                    <button
                      onClick={() => {
                        onEditBudget(budget)
                        setActiveMenu(null)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232e40]"
                    >
                      <Edit className="w-4 h-4" />
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => {
                        onDeleteBudget(budget)
                        setActiveMenu(null)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('delete')}
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add Budget Button */}
      {budgets.length > 0 && (
        <button
          onClick={onAddBudget}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#232e40] flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t('addBudget')}</span>
        </button>
      )}
    </div>
  )
}
