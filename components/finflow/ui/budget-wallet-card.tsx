"use client"

import { useState } from "react"
import { 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  ArrowUpCircle,
  TrendingUp,
  Wallet,
  PiggyBank,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Zap,
  Heart,
  Plane,
  Gift,
  Music,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BudgetWalletCardProps {
  id: string
  name: string
  amount: number
  spent: number
  currency: string
  category?: string
  startDate?: string
  endDate?: string
  isPinned?: boolean
  formatCurrency: (amount: number, currency?: string) => string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  onTopUp?: (id: string) => void
  variant?: 'card' | 'list'
  index?: number
}

// Category icons mapping
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

// Category colors
const categoryColors: Record<string, { bg: string, iconColor: string, gradient: string, ring: string }> = {
  'food': { bg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-500', gradient: 'from-orange-400 to-orange-600', ring: 'stroke-orange-500' },
  'restaurant': { bg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-500', gradient: 'from-orange-400 to-orange-600', ring: 'stroke-orange-500' },
  'groceries': { bg: 'bg-lime-50 dark:bg-lime-950/40', iconColor: 'text-lime-600', gradient: 'from-lime-400 to-lime-600', ring: 'stroke-lime-500' },
  'shopping': { bg: 'bg-pink-50 dark:bg-pink-950/40', iconColor: 'text-pink-500', gradient: 'from-pink-400 to-pink-600', ring: 'stroke-pink-500' },
  'transport': { bg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-500', gradient: 'from-blue-400 to-blue-600', ring: 'stroke-blue-500' },
  'transportation': { bg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-500', gradient: 'from-blue-400 to-blue-600', ring: 'stroke-blue-500' },
  'entertainment': { bg: 'bg-purple-50 dark:bg-purple-950/40', iconColor: 'text-purple-500', gradient: 'from-purple-400 to-purple-600', ring: 'stroke-purple-500' },
  'bills': { bg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500', gradient: 'from-amber-400 to-amber-600', ring: 'stroke-amber-500' },
  'utilities': { bg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500', gradient: 'from-amber-400 to-amber-600', ring: 'stroke-amber-500' },
  'health': { bg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-400', gradient: 'from-red-400 to-red-600', ring: 'stroke-red-500' },
  'healthcare': { bg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-400', gradient: 'from-red-400 to-red-600', ring: 'stroke-red-500' },
  'travel': { bg: 'bg-sky-50 dark:bg-sky-950/40', iconColor: 'text-sky-500', gradient: 'from-sky-400 to-sky-600', ring: 'stroke-sky-500' },
  'gifts': { bg: 'bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500', gradient: 'from-rose-400 to-rose-600', ring: 'stroke-rose-500' },
  'housing': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', iconColor: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-600', ring: 'stroke-indigo-500' },
  'rent': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', iconColor: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-600', ring: 'stroke-indigo-500' },
  'savings': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-500', gradient: 'from-emerald-400 to-emerald-600', ring: 'stroke-emerald-500' },
  'default': { bg: 'bg-gray-50 dark:bg-gray-900/40', iconColor: 'text-gray-500', gradient: 'from-gray-400 to-gray-600', ring: 'stroke-gray-500' },
}

export default function BudgetWalletCard({
  id,
  name,
  amount,
  spent,
  currency,
  category,
  startDate,
  endDate,
  isPinned = false,
  formatCurrency,
  onEdit,
  onDelete,
  onPin,
  onTopUp,
  variant = 'card',
  index = 0,
}: BudgetWalletCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const progress = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0
  const remaining = Math.max(amount - spent, 0)
  const isOverBudget = progress >= 100
  const isWarning = progress >= 80 && progress < 100

  const getCategoryConfig = (cat?: string) => {
    const key = cat?.toLowerCase() || 'default'
    return {
      icon: categoryIcons[key] || categoryIcons.default,
      colors: categoryColors[key] || categoryColors.default,
    }
  }

  const config = getCategoryConfig(category || name)
  const Icon = config.icon

  // Get status color
  const getStatusColor = () => {
    if (isOverBudget) return 'text-rose-500'
    if (isWarning) return 'text-amber-500'
    return 'text-emerald-500'
  }

  const getProgressColor = () => {
    if (isOverBudget) return 'from-rose-400 to-rose-500'
    if (isWarning) return 'from-amber-400 to-amber-500'
    return 'from-emerald-400 to-blue-500'
  }

  // List variant
  if (variant === 'list') {
    return (
      <Link
        href={`/budgets/${id}`}
        className="block p-4 bg-white dark:bg-[#1a2332] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1e2940] transition-colors mb-3"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", config.colors.bg)}>
            <Icon className={cn("w-6 h-6", config.colors.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{name}</p>
              {isPinned && <Pin className="w-3.5 h-3.5 text-blue-500" />}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatCurrency(remaining, currency)} übrig
            </p>
          </div>
          <span className={cn("text-lg font-bold tabular-nums", getStatusColor())}>
            {Math.round(progress)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-700 bg-gradient-to-r",
              getProgressColor()
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        {/* Footer Info */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <span>{formatCurrency(spent, currency)} von {formatCurrency(amount, currency)}</span>
          {endDate && (
            <span>bis {new Date(endDate).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}</span>
          )}
        </div>
      </Link>
    )
  }

  // Card variant (wallet-style)
  return (
    <div className={cn(
      "relative w-72 rounded-3xl p-5 flex-shrink-0 snap-center",
      "bg-white dark:bg-[#1a2332] shadow-lg border border-gray-100 dark:border-gray-800",
      "transition-transform duration-300 active:scale-[0.98]"
    )}>
      {/* Pinned Indicator */}
      {isPinned && (
        <div className="absolute top-4 right-12 bg-blue-50 dark:bg-blue-950/40 rounded-full p-1.5">
          <Pin className="w-3 h-3 text-blue-500" />
        </div>
      )}

      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
            <div className="absolute top-10 right-0 bg-white dark:bg-[#232e40] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-30 min-w-[150px]">
              {onTopUp && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onTopUp(id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                >
                  <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                  Aufstocken
                </button>
              )}
              {onPin && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onPin(id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                >
                  <Pin className="w-4 h-4" />
                  {isPinned ? 'Lösen' : 'Anheften'}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEdit(id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDelete(id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                  Löschen
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", config.colors.bg)}>
          <Icon className={cn("w-6 h-6", config.colors.iconColor)} />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
          {category && category !== name && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{category}</span>
          )}
        </div>
      </div>

      {/* Circular Progress */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-100 dark:text-gray-800"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress * 3.01} 301`}
              className={cn(
                "transition-all duration-700",
                isOverBudget ? "stroke-rose-500" : isWarning ? "stroke-amber-500" : "stroke-emerald-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold", getStatusColor())}>
              {Math.round(progress)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">verwendet</span>
          </div>
        </div>
      </div>

      {/* Balance Info */}
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {formatCurrency(remaining, currency)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          von {formatCurrency(amount, currency)} übrig
        </p>
      </div>

      {/* Action Button */}
      {onTopUp && (
        <button
          onClick={() => onTopUp(id)}
          className="w-full mt-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowUpCircle className="w-4 h-4" />
          Aufstocken
        </button>
      )}
    </div>
  )
}

// Empty state placeholder
export function EmptyBudgetCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="w-72 h-80 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500 hover:border-purple-400 hover:text-purple-500 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors flex-shrink-0 snap-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Plus className="w-7 h-7" />
      </div>
      <span className="font-medium">Budget erstellen</span>
    </button>
  )
}
