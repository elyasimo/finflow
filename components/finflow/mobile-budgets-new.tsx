"use client"

import { useState, useMemo } from "react"
import { 
  Plus,
  ChevronLeft,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileBottomNav from "./mobile-bottom-nav"
import BudgetWalletCard, { EmptyBudgetCard } from "./ui/budget-wallet-card"

interface BudgetItem {
  id: string
  name: string
  amount: number
  spent: number
  currency: string
  startDate?: string
  endDate?: string
}

interface MobileBudgetsNewProps {
  budgets: BudgetItem[]
  onAddBudget: () => void
  onEditBudget: (id: string) => void
  onDeleteBudget: (id: string) => void
}

export default function MobileBudgetsNew({
  budgets,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}: MobileBudgetsNewProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Sort budgets by usage percentage (highest first)
  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      const aUsage = a.amount > 0 ? (a.spent / a.amount) : 0
      const bUsage = b.amount > 0 ? (b.spent / b.amount) : 0
      return bUsage - aUsage
    })
  }, [budgets])

  // Calculate overall statistics
  const stats = useMemo(() => {
    const total = budgets.reduce((sum, b) => sum + b.amount, 0)
    const spent = budgets.reduce((sum, b) => sum + b.spent, 0)
    const remaining = Math.max(total - spent, 0)
    const overallProgress = total > 0 ? (spent / total) * 100 : 0
    const budgetsOverLimit = budgets.filter(b => b.spent >= b.amount).length
    const budgetsNearLimit = budgets.filter(b => {
      const usage = b.amount > 0 ? b.spent / b.amount : 0
      return usage >= 0.8 && usage < 1
    }).length
    
    return { total, spent, remaining, overallProgress, budgetsOverLimit, budgetsNearLimit }
  }, [budgets])

  const getProgressColor = () => {
    if (stats.overallProgress >= 100) return { stroke: 'stroke-rose-500', text: 'text-rose-500' }
    if (stats.overallProgress >= 80) return { stroke: 'stroke-amber-500', text: 'text-amber-500' }
    return { stroke: 'stroke-emerald-500', text: 'text-emerald-500' }
  }

  const progressColors = getProgressColor()

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a2332] px-6 pt-16 pb-8">
        <div className="flex items-center gap-3 mb-8">
          <button 
            onClick={() => window.history.back()}
            className="w-11 h-11 rounded-full bg-gray-50 dark:bg-[#232e40] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('budgets')}</h1>
        </div>

        {/* Overall Progress Ring */}
        <div className="flex justify-center mb-8">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-100 dark:text-gray-800"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(stats.overallProgress, 100) * 4.02} 402`}
                className={cn("transition-all duration-1000", progressColors.stroke)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold", progressColors.text)}>
                {Math.round(stats.overallProgress)}%
              </span>
              <span className="text-xs text-gray-400">verwendet</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex justify-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ausgegeben</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.spent)}</p>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Verbleibend</p>
            <p className="text-lg font-bold text-emerald-500">{formatCurrency(stats.remaining)}</p>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Budgets</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{budgets.length}</p>
          </div>
        </div>

        {/* Status Pills */}
        {(stats.budgetsOverLimit > 0 || stats.budgetsNearLimit > 0) && (
          <div className="flex justify-center gap-3 mt-6">
            {stats.budgetsOverLimit > 0 && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                {stats.budgetsOverLimit} überschritten
              </span>
            )}
            {stats.budgetsNearLimit > 0 && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                {stats.budgetsNearLimit} fast erreicht
              </span>
            )}
          </div>
        )}

        {/* View Mode Toggle */}
        {budgets.length > 0 && (
          <div className="flex p-1 bg-gray-100 dark:bg-[#232e40] rounded-xl mt-6">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                viewMode === 'cards'
                  ? "bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              Karten
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                viewMode === 'list'
                  ? "bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              Liste
            </button>
          </div>
        )}
      </div>

      {/* Budgets */}
      <div className="px-6 py-6">
        {budgets.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Budgets
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
              Erstellen Sie Budgets, um Ihre Ausgaben im Blick zu behalten
            </p>
            <button
              onClick={onAddBudget}
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-500 text-white rounded-2xl font-semibold shadow-xl shadow-purple-500/30 hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erstes Budget erstellen
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          // Card View
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
            {sortedBudgets.map((budget, idx) => (
              <BudgetWalletCard
                key={budget.id}
                id={budget.id}
                name={budget.name}
                amount={budget.amount}
                spent={budget.spent}
                currency={budget.currency}
                startDate={budget.startDate}
                endDate={budget.endDate}
                formatCurrency={formatCurrency}
                onEdit={() => onEditBudget(budget.id)}
                onDelete={() => onDeleteBudget(budget.id)}
                variant="card"
                index={idx}
              />
            ))}
            <EmptyBudgetCard onAdd={onAddBudget} />
          </div>
        ) : (
          // List View
          <div className="space-y-3">
            {sortedBudgets.map((budget, idx) => (
              <BudgetWalletCard
                key={budget.id}
                id={budget.id}
                name={budget.name}
                amount={budget.amount}
                spent={budget.spent}
                currency={budget.currency}
                startDate={budget.startDate}
                endDate={budget.endDate}
                formatCurrency={formatCurrency}
                onEdit={() => onEditBudget(budget.id)}
                onDelete={() => onDeleteBudget(budget.id)}
                variant="list"
                index={idx}
              />
            ))}
            
            {/* Add Budget Button */}
            <button
              onClick={onAddBudget}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Budget hinzufügen</span>
            </button>
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-36" />
      </div>

      {/* FAB */}
      {budgets.length > 0 && (
        <button
          onClick={onAddBudget}
          className="fixed bottom-28 right-6 w-16 h-16 bg-purple-500 rounded-full shadow-2xl shadow-purple-500/40 flex items-center justify-center z-20 active:scale-95 transition-transform hover:bg-purple-600"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  )
}
