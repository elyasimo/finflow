"use client"

import { useState, useRef } from "react"
import { 
  Wallet,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Zap,
  Heart,
  Utensils,
  Plane,
  Gift,
  Smartphone,
  Music,
  Dumbbell,
  Briefcase,
  GraduationCap,
  Banknote,
  TrendingUp,
  ChevronRight,
  Trash2,
  Flag
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface TransactionCardProps {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category?: string
  transactionDate: string
  currency: string
  note?: string
  tag?: string
  merchant?: string
  onDelete?: (id: string) => void
  onFlag?: (id: string) => void
  formatCurrency: (amount: number, currency?: string) => string
}

// Category configurations with German support
const categoryConfig: Record<string, { icon: React.ElementType, bg: string, iconColor: string }> = {
  'salary': { icon: Banknote, bg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  'income': { icon: TrendingUp, bg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  'einkommen': { icon: TrendingUp, bg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  'food': { icon: Utensils, bg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400' },
  'restaurant': { icon: Utensils, bg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400' },
  'groceries': { icon: ShoppingBag, bg: 'bg-lime-100 dark:bg-lime-900/40', iconColor: 'text-lime-600 dark:text-lime-400' },
  'lebensmittel': { icon: ShoppingBag, bg: 'bg-lime-100 dark:bg-lime-900/40', iconColor: 'text-lime-600 dark:text-lime-400' },
  'shopping': { icon: ShoppingBag, bg: 'bg-pink-100 dark:bg-pink-900/40', iconColor: 'text-pink-600 dark:text-pink-400' },
  'einkaufen': { icon: ShoppingBag, bg: 'bg-pink-100 dark:bg-pink-900/40', iconColor: 'text-pink-600 dark:text-pink-400' },
  'transport': { icon: Car, bg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
  'transportation': { icon: Car, bg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
  'verkehr': { icon: Car, bg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
  'entertainment': { icon: Music, bg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400' },
  'unterhaltung': { icon: Music, bg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400' },
  'freizeit': { icon: Music, bg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400' },
  'subscriptions': { icon: Smartphone, bg: 'bg-violet-100 dark:bg-violet-900/40', iconColor: 'text-violet-600 dark:text-violet-400' },
  'abos': { icon: Smartphone, bg: 'bg-violet-100 dark:bg-violet-900/40', iconColor: 'text-violet-600 dark:text-violet-400' },
  'bills': { icon: Zap, bg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400' },
  'utilities': { icon: Zap, bg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400' },
  'rechnungen': { icon: Zap, bg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400' },
  'health': { icon: Heart, bg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-500 dark:text-red-400' },
  'healthcare': { icon: Heart, bg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-500 dark:text-red-400' },
  'gesundheit': { icon: Heart, bg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-500 dark:text-red-400' },
  'travel': { icon: Plane, bg: 'bg-sky-100 dark:bg-sky-900/40', iconColor: 'text-sky-600 dark:text-sky-400' },
  'reisen': { icon: Plane, bg: 'bg-sky-100 dark:bg-sky-900/40', iconColor: 'text-sky-600 dark:text-sky-400' },
  'gift': { icon: Gift, bg: 'bg-rose-100 dark:bg-rose-900/40', iconColor: 'text-rose-600 dark:text-rose-400' },
  'gifts': { icon: Gift, bg: 'bg-rose-100 dark:bg-rose-900/40', iconColor: 'text-rose-600 dark:text-rose-400' },
  'geschenke': { icon: Gift, bg: 'bg-rose-100 dark:bg-rose-900/40', iconColor: 'text-rose-600 dark:text-rose-400' },
  'coffee': { icon: Coffee, bg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-700 dark:text-amber-400' },
  'kaffee': { icon: Coffee, bg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-700 dark:text-amber-400' },
  'housing': { icon: Home, bg: 'bg-indigo-100 dark:bg-indigo-900/40', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  'rent': { icon: Home, bg: 'bg-indigo-100 dark:bg-indigo-900/40', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  'miete': { icon: Home, bg: 'bg-indigo-100 dark:bg-indigo-900/40', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  'wohnen': { icon: Home, bg: 'bg-indigo-100 dark:bg-indigo-900/40', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  'fitness': { icon: Dumbbell, bg: 'bg-teal-100 dark:bg-teal-900/40', iconColor: 'text-teal-600 dark:text-teal-400' },
  'sport': { icon: Dumbbell, bg: 'bg-teal-100 dark:bg-teal-900/40', iconColor: 'text-teal-600 dark:text-teal-400' },
  'education': { icon: GraduationCap, bg: 'bg-violet-100 dark:bg-violet-900/40', iconColor: 'text-violet-600 dark:text-violet-400' },
  'bildung': { icon: GraduationCap, bg: 'bg-violet-100 dark:bg-violet-900/40', iconColor: 'text-violet-600 dark:text-violet-400' },
  'work': { icon: Briefcase, bg: 'bg-slate-100 dark:bg-slate-900/40', iconColor: 'text-slate-600 dark:text-slate-400' },
  'arbeit': { icon: Briefcase, bg: 'bg-slate-100 dark:bg-slate-900/40', iconColor: 'text-slate-600 dark:text-slate-400' },
  'phone': { icon: Smartphone, bg: 'bg-cyan-100 dark:bg-cyan-900/40', iconColor: 'text-cyan-600 dark:text-cyan-400' },
  'telefon': { icon: Smartphone, bg: 'bg-cyan-100 dark:bg-cyan-900/40', iconColor: 'text-cyan-600 dark:text-cyan-400' },
  'default': { icon: Wallet, bg: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-500 dark:text-gray-400' },
}

export default function TransactionCard({
  id,
  description,
  amount,
  type,
  category,
  transactionDate,
  currency,
  note,
  tag,
  merchant,
  onDelete,
  onFlag,
  formatCurrency,
}: TransactionCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLAnchorElement>(null)

  const getCategoryConfig = (cat?: string) => {
    const key = cat?.toLowerCase() || 'default'
    return categoryConfig[key] || categoryConfig.default
  }

  const config = getCategoryConfig(category)
  const Icon = config.icon
  const isIncome = type === 'income'
  const displayName = merchant || description || (isIncome ? 'Einnahme' : 'Ausgabe')

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-CH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const diff = startX.current - currentX
    
    if (diff > 0 && diff <= 100) {
      setSwipeOffset(diff)
    } else if (diff <= 0) {
      setSwipeOffset(0)
    }
  }

  const handleTouchEnd = () => {
    if (swipeOffset > 50) {
      setIsRevealed(true)
      setSwipeOffset(80)
    } else {
      setIsRevealed(false)
      setSwipeOffset(0)
    }
  }

  const handleResetSwipe = () => {
    setIsRevealed(false)
    setSwipeOffset(0)
  }

  return (
    <div 
      className="relative overflow-hidden mb-2"
      onClick={isRevealed ? handleResetSwipe : undefined}
    >
      {/* Swipe Actions */}
      <div className="absolute inset-y-0 right-0 flex items-center rounded-2xl overflow-hidden">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFlag?.(id)
            handleResetSwipe()
          }}
          className="h-full w-[40px] bg-amber-500 flex items-center justify-center"
          style={{ opacity: swipeOffset > 20 ? 1 : 0 }}
        >
          <Flag className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(id)
            handleResetSwipe()
          }}
          className="h-full w-[40px] bg-rose-500 flex items-center justify-center"
          style={{ opacity: swipeOffset > 20 ? 1 : 0 }}
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Card - Compact Design */}
      <Link
        href={`/transactions/${id}`}
        ref={cardRef}
        className={cn(
          "relative flex items-center gap-3 bg-white dark:bg-[#1a2332] p-3 rounded-2xl",
          "transition-transform duration-200 ease-out active:scale-[0.99]"
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Icon */}
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
          config.bg
        )}>
          <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {formatDate(transactionDate)}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className={cn(
            "text-sm font-bold tabular-nums",
            isIncome ? "text-emerald-500" : "text-gray-900 dark:text-white"
          )}>
            {isIncome ? '+' : '−'}{formatCurrency(Math.abs(amount), currency)}
          </p>
          {category && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {category}
            </span>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
      </Link>
    </div>
  )
}

export { categoryConfig }
