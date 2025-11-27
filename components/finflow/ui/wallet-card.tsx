"use client"

import { useState } from "react"
import { 
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Banknote,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface WalletCardProps {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  isPinned?: boolean
  color?: string
  bankName?: string
  accountNumber?: string
  formatCurrency: (amount: number, currency?: string) => string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  variant?: 'default' | 'compact' | 'large'
  index?: number
}

// Account type icons
const accountTypeIcons: Record<string, React.ElementType> = {
  'checking': Wallet,
  'giro': Wallet,
  'savings': PiggyBank,
  'spar': PiggyBank,
  'credit': CreditCard,
  'investment': TrendingUp,
  'cash': Banknote,
  'default': Wallet,
}

// Gradient color presets
const gradientPresets = [
  'from-blue-500 via-blue-600 to-indigo-700',
  'from-emerald-500 via-emerald-600 to-teal-700',
  'from-purple-500 via-purple-600 to-violet-700',
  'from-rose-500 via-rose-600 to-pink-700',
  'from-amber-500 via-amber-600 to-orange-700',
  'from-cyan-500 via-cyan-600 to-blue-700',
  'from-fuchsia-500 via-fuchsia-600 to-purple-700',
  'from-lime-500 via-lime-600 to-green-700',
]

export default function WalletCard({
  id,
  name,
  type,
  balance,
  currency,
  isPinned = false,
  bankName,
  accountNumber,
  formatCurrency,
  onEdit,
  onDelete,
  onPin,
  variant = 'default',
  index = 0,
}: WalletCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  
  const getAccountIcon = (accountType: string) => {
    const key = accountType?.toLowerCase() || 'default'
    return accountTypeIcons[key] || accountTypeIcons.default
  }

  const AccountIcon = getAccountIcon(type)
  const gradient = gradientPresets[index % gradientPresets.length]

  // Compact variant for lists
  if (variant === 'compact') {
    return (
      <Link
        href={`/accounts/${id}`}
        className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a2332] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1e2940] transition-colors"
      >
        <div className={cn(
          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
          gradient
        )}>
          <AccountIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{type}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900 dark:text-white tabular-nums">
            {formatCurrency(balance, currency)}
          </p>
          {isPinned && (
            <Pin className="w-4 h-4 text-blue-500 ml-auto mt-1" />
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
      </Link>
    )
  }

  // Default card variant (carousel style)
  return (
    <div
      className={cn(
        "relative w-72 h-48 rounded-3xl p-5 text-white overflow-hidden flex-shrink-0 snap-center",
        "bg-gradient-to-br shadow-xl transition-transform duration-300",
        "active:scale-[0.98]",
        gradient
      )}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      
      {/* Pinned Indicator */}
      {isPinned && (
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-1.5">
          <Pin className="w-3 h-3" />
        </div>
      )}

      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <AccountIcon className="w-6 h-6" />
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute top-10 right-0 bg-white dark:bg-[#232e40] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-30 min-w-[140px]">
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
        </div>

        {/* Footer */}
        <Link href={`/accounts/${id}`} className="block">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
              {type}
            </span>
            {bankName && (
              <span className="text-xs opacity-70">{bankName}</span>
            )}
          </div>
          <p className="text-sm opacity-80 mb-1">{name}</p>
          <p className="text-2xl font-bold tracking-tight">
            {formatCurrency(balance, currency)}
          </p>
          {accountNumber && (
            <p className="text-xs opacity-60 mt-1 font-mono">
              •••• {accountNumber.slice(-4)}
            </p>
          )}
        </Link>
      </div>
    </div>
  )
}

// Empty state placeholder card
export function EmptyWalletCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="w-72 h-48 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex-shrink-0 snap-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Plus className="w-7 h-7" />
      </div>
      <span className="font-medium">Konto hinzufügen</span>
    </button>
  )
}
