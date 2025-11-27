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
  Flag,
  MoreHorizontal
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

// Elegant category configurations
const categoryConfig: Record<string, { icon: React.ElementType, bg: string, iconColor: string }> = {
  'salary': { icon: Banknote, bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500' },
  'income': { icon: TrendingUp, bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500' },
  'food': { icon: Utensils, bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500' },
  'restaurant': { icon: Utensils, bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500' },
  'groceries': { icon: ShoppingBag, bg: 'bg-lime-50 dark:bg-lime-950/30', iconColor: 'text-lime-600' },
  'shopping': { icon: ShoppingBag, bg: 'bg-pink-50 dark:bg-pink-950/30', iconColor: 'text-pink-500' },
  'transport': { icon: Car, bg: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500' },
  'transportation': { icon: Car, bg: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500' },
  'entertainment': { icon: Music, bg: 'bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-500' },
  'subscriptions': { icon: Smartphone, bg: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-500' },
  'bills': { icon: Zap, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-500' },
  'utilities': { icon: Zap, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-500' },
  'health': { icon: Heart, bg: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-400' },
  'healthcare': { icon: Heart, bg: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-400' },
  'travel': { icon: Plane, bg: 'bg-sky-50 dark:bg-sky-950/30', iconColor: 'text-sky-500' },
  'gift': { icon: Gift, bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-500' },
  'gifts': { icon: Gift, bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-500' },
  'coffee': { icon: Coffee, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600' },
  'housing': { icon: Home, bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-500' },
  'rent': { icon: Home, bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-500' },
  'fitness': { icon: Dumbbell, bg: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-500' },
  'sport': { icon: Dumbbell, bg: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-500' },
  'education': { icon: GraduationCap, bg: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-500' },
  'work': { icon: Briefcase, bg: 'bg-slate-50 dark:bg-slate-950/30', iconColor: 'text-slate-500' },
  'phone': { icon: Smartphone, bg: 'bg-cyan-50 dark:bg-cyan-950/30', iconColor: 'text-cyan-500' },
  'default': { icon: Wallet, bg: 'bg-gray-50 dark:bg-gray-900/30', iconColor: 'text-gray-500' },
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

  // Swipe handlers for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const diff = startX.current - currentX
    
    // Only allow left swipe (positive diff) up to 120px
    if (diff > 0 && diff <= 120) {
      setSwipeOffset(diff)
    } else if (diff <= 0) {
      setSwipeOffset(0)
    }
  }

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      setIsRevealed(true)
      setSwipeOffset(100)
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
      className="relative overflow-hidden rounded-2xl mb-3 animate-fade-in"
      onClick={isRevealed ? handleResetSwipe : undefined}
    >
      {/* Swipe Action Background */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFlag?.(id)
            handleResetSwipe()
          }}
          className="h-full w-[50px] bg-amber-500 flex items-center justify-center transition-opacity"
          style={{ opacity: swipeOffset > 30 ? 1 : 0 }}
        >
          <Flag className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(id)
            handleResetSwipe()
          }}
          className="h-full w-[50px] bg-rose-500 flex items-center justify-center transition-opacity"
          style={{ opacity: swipeOffset > 30 ? 1 : 0 }}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Card */}
      <Link
        href={`/transactions/${id}`}
        ref={cardRef}
        className={cn(
          "relative block bg-white dark:bg-[#1a2332] p-4 transition-transform duration-200 ease-out",
          "active:scale-[0.99] hover:bg-gray-50 dark:hover:bg-[#1e2940]"
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-4">
          {/* Category Icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
            "transition-transform duration-300",
            config.bg
          )}>
            <Icon className={cn("w-6 h-6", config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {new Date(transactionDate).toLocaleDateString('de-CH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn(
                  "text-lg font-bold tabular-nums",
                  isIncome ? "text-emerald-500" : "text-gray-900 dark:text-white"
                )}>
                  {isIncome ? '+' : '−'}{formatCurrency(Math.abs(amount), currency)}
                </p>
                {category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mt-1">
                    {category}
                  </span>
                )}
              </div>
            </div>

            {/* Optional Note/Tag */}
            {(note || tag) && (
              <div className="flex items-center gap-2 mt-2">
                {tag && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                    #{tag}
                  </span>
                )}
                {note && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {note}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Arrow Indicator */}
          <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
        </div>
      </Link>
    </div>
  )
}

export { categoryConfig }
