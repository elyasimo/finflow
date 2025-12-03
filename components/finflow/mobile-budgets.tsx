"use client"

import { useState, useMemo } from "react"
import { 
  Plus,
  PiggyBank,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  Target,
  TrendingUp,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Zap,
  Heart,
  Plane,
  Gift,
  Music,
  Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import { getTranslatedText } from "@/lib/translation-utils"
import { Budget } from "@/lib/types"
import MobileBottomNav from "./mobile-bottom-nav"

interface MobileBudgetsProps {
  budgets: Budget[]
  budgetUsage: Record<string, number>
  onAddBudget: () => void
  onEditBudget: (budget: Budget) => void
  onDeleteBudget: (budget: Budget) => void
}

// Category icons for budgets - Money App Style
const categoryIcons: Record<string, React.ElementType> = {
  'food': Utensils,
  'restaurant': Utensils,
  'groceries': ShoppingBag,
  'shopping': ShoppingBag,
  'transport': Car,
  'transportation': Car,
  'entertainment': Music,
  'bills': Zap,
  'utilities': Zap,
  'health': Heart,
  'healthcare': Heart,
  'travel': Plane,
  'gifts': Gift,
  'housing': Home,
  'rent': Home,
  'savings': PiggyBank,
  'default': Target,
}

const categoryColors: Record<string, { bg: string, iconColor: string, gradient: string }> = {
  'food': { bg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-500', gradient: 'from-orange-400 to-orange-600' },
  'restaurant': { bg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-500', gradient: 'from-orange-400 to-orange-600' },
  'groceries': { bg: 'bg-lime-50 dark:bg-lime-950/40', iconColor: 'text-lime-600', gradient: 'from-lime-400 to-lime-600' },
  'shopping': { bg: 'bg-pink-50 dark:bg-pink-950/40', iconColor: 'text-pink-500', gradient: 'from-pink-400 to-pink-600' },
  'transport': { bg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-500', gradient: 'from-blue-400 to-blue-600' },
  'transportation': { bg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-500', gradient: 'from-blue-400 to-blue-600' },
  'entertainment': { bg: 'bg-purple-50 dark:bg-purple-950/40', iconColor: 'text-purple-500', gradient: 'from-purple-400 to-purple-600' },
  'bills': { bg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500', gradient: 'from-amber-400 to-amber-600' },
  'utilities': { bg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500', gradient: 'from-amber-400 to-amber-600' },
  'health': { bg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-400', gradient: 'from-red-400 to-red-600' },
  'healthcare': { bg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-400', gradient: 'from-red-400 to-red-600' },
  'travel': { bg: 'bg-sky-50 dark:bg-sky-950/40', iconColor: 'text-sky-500', gradient: 'from-sky-400 to-sky-600' },
  'gifts': { bg: 'bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500', gradient: 'from-rose-400 to-rose-600' },
  'housing': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', iconColor: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-600' },
  'rent': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', iconColor: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-600' },
  'savings': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-500', gradient: 'from-emerald-400 to-emerald-600' },
  'default': { bg: 'bg-gray-50 dark:bg-gray-900/40', iconColor: 'text-gray-500', gradient: 'from-gray-400 to-gray-600' },
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
    const overallProgress = total > 0 ? (spent / total) * 100 : 0
    return { total, spent, remaining, overallProgress }
  }, [budgets, budgetUsage])

  const getCategoryConfig = (name: string) => {
    const key = name?.toLowerCase() || 'default'
    const icon = categoryIcons[key] || categoryIcons.default
    const colors = categoryColors[key] || categoryColors.default
    return { icon, ...colors }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Elegant Header */}
      <div className="bg-white dark:bg-[#1a2332] px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('budgets')}</h1>
        </div>

        {/* Overall Budget Progress - Ring Style */}
        <div className="flex justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-gray-100 dark:text-gray-800"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#budgetGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(stats.overallProgress, 100) * 4.4} 440`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={stats.overallProgress >= 100 ? "#EF4444" : stats.overallProgress >= 80 ? "#F59E0B" : "#10B981"} />
                  <stop offset="100%" stopColor={stats.overallProgress >= 100 ? "#DC2626" : stats.overallProgress >= 80 ? "#D97706" : "#059669"} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.overallProgress)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">verwendet</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ausgegeben</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.spent)}</p>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Verbleibend</p>
            <p className="text-lg font-semibold text-emerald-500">{formatCurrency(Math.max(stats.remaining, 0))}</p>
          </div>
        </div>
      </div>

      {/* Budgets List */}
      <div className="px-5 py-6 space-y-4">
        {budgets.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine Budgets</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Erstellen Sie Ihr erstes Budget
            </p>
            <button
              onClick={onAddBudget}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-5 h-5" />
              Budget erstellen
            </button>
          </div>
        ) : (
          budgets.map((budget) => {
            const spent = budgetUsage[budget.id] || 0
            const amount = Number(budget.amount)
            const progress = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0
            const remaining = Math.max(amount - spent, 0)
            const isOverBudget = progress >= 100
            const isWarning = progress >= 80 && progress < 100
            const name = getTranslatedText(budget.name, budget.nameTranslations, language)
            const config = getCategoryConfig(budget.name)
            const Icon = config.icon
            
            return (
              <div
                key={budget.id}
                className="relative bg-white dark:bg-[#1a2332] rounded-3xl p-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", config.bg)}>
                      <Icon className={cn("w-6 h-6", config.iconColor)} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        bis {new Date(budget.endDate).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveMenu(activeMenu === budget.id ? null : budget.id)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#232e40] flex items-center justify-center"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        isOverBudget 
                          ? "bg-gradient-to-r from-rose-400 to-rose-500" 
                          : isWarning 
                            ? "bg-gradient-to-r from-amber-400 to-amber-500"
                            : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(spent)} / {formatCurrency(amount)}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    isOverBudget ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500"
                  )}>
                    {formatCurrency(remaining)} übrig
                  </span>
                </div>

                {/* Action Menu */}
                {activeMenu === budget.id && (
                  <div className="absolute top-16 right-4 bg-white dark:bg-[#232e40] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10 min-w-[140px]">
                    <button
                      onClick={() => {
                        onEditBudget(budget)
                        setActiveMenu(null)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                    >
                      <Edit className="w-4 h-4" />
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        onDeleteBudget(budget)
                        setActiveMenu(null)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                      Löschen
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Add Budget Button */}
        {budgets.length > 0 && (
          <button
            onClick={onAddBudget}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Budget hinzufügen</span>
          </button>
        )}

        {/* Bottom spacing */}
        <div className="h-32" />
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  )
}
