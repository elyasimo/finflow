"use client"

import { useState, useMemo } from "react"
import { 
  Plus,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Edit,
  Trash2,
  X,
  ChevronLeft,
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
  Banknote
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileBottomNav from "./mobile-bottom-nav"

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  transactionDate: string;
  currency: string;
  accountId: string;
}

interface AccountOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface MobileTransactionsProps {
  transactions: Transaction[]
  accounts?: AccountOption[]
  categories?: CategoryOption[]
  onAddTransaction: () => void
  onEditTransaction: (id: string) => void
  onDeleteTransaction: (id: string) => void
}

// Elegant category configurations - Money App Style
const categoryConfig: Record<string, { icon: React.ElementType, bg: string, iconColor: string }> = {
  'salary': { icon: Banknote, bg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-500' },
  'income': { icon: TrendingUp, bg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-500' },
  'food': { icon: Utensils, bg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-500' },
  'restaurant': { icon: Utensils, bg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-500' },
  'groceries': { icon: ShoppingBag, bg: 'bg-lime-50 dark:bg-lime-950/40', iconColor: 'text-lime-600' },
  'shopping': { icon: ShoppingBag, bg: 'bg-pink-50 dark:bg-pink-950/40', iconColor: 'text-pink-500' },
  'transport': { icon: Car, bg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-500' },
  'transportation': { icon: Car, bg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-500' },
  'entertainment': { icon: Music, bg: 'bg-purple-50 dark:bg-purple-950/40', iconColor: 'text-purple-500' },
  'bills': { icon: Zap, bg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500' },
  'utilities': { icon: Zap, bg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500' },
  'health': { icon: Heart, bg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-400' },
  'healthcare': { icon: Heart, bg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-400' },
  'travel': { icon: Plane, bg: 'bg-sky-50 dark:bg-sky-950/40', iconColor: 'text-sky-500' },
  'gift': { icon: Gift, bg: 'bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500' },
  'gifts': { icon: Gift, bg: 'bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500' },
  'coffee': { icon: Coffee, bg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-600' },
  'housing': { icon: Home, bg: 'bg-indigo-50 dark:bg-indigo-950/40', iconColor: 'text-indigo-500' },
  'rent': { icon: Home, bg: 'bg-indigo-50 dark:bg-indigo-950/40', iconColor: 'text-indigo-500' },
  'fitness': { icon: Dumbbell, bg: 'bg-teal-50 dark:bg-teal-950/40', iconColor: 'text-teal-500' },
  'sport': { icon: Dumbbell, bg: 'bg-teal-50 dark:bg-teal-950/40', iconColor: 'text-teal-500' },
  'education': { icon: GraduationCap, bg: 'bg-violet-50 dark:bg-violet-950/40', iconColor: 'text-violet-500' },
  'work': { icon: Briefcase, bg: 'bg-slate-50 dark:bg-slate-950/40', iconColor: 'text-slate-500' },
  'phone': { icon: Smartphone, bg: 'bg-cyan-50 dark:bg-cyan-950/40', iconColor: 'text-cyan-500' },
  'default': { icon: Wallet, bg: 'bg-gray-50 dark:bg-gray-900/40', iconColor: 'text-gray-500' },
}

export default function MobileTransactions({
  transactions,
  accounts,
  categories,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: MobileTransactionsProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getCategoryConfig = (category?: string | { name?: string }) => {
    const categoryName = typeof category === 'string' ? category : (category?.name || '')
    const key = categoryName?.toLowerCase() || 'default'
    return categoryConfig[key] || categoryConfig.default
  }

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType)
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => {
        return t.description?.toLowerCase().includes(query)
      })
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )
  }, [transactions, selectedType, searchQuery])

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let key: string
      if (date.toDateString() === today.toDateString()) {
        key = t('today')
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = t('yesterday')
      } else {
        key = date.toLocaleDateString('de-CH', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        })
      }
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(transaction)
    })
    
    return groups
  }, [filteredTransactions, t])

  // Calculate summary
  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return { income, expenses, balance: income - expenses }
  }, [transactions])

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Elegant Header */}
      <div className="bg-white dark:bg-[#1a2332] px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('transactions')}</h1>
          </div>
        </div>

        {/* Summary Cards - Minimal Money App Style */}
        <div className="flex gap-6 justify-center mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('income')}</span>
            </div>
            <p className="text-lg font-semibold text-emerald-500">
              +{formatCurrency(summary.income)}
            </p>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-400"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('expenses')}</span>
            </div>
            <p className="text-lg font-semibold text-rose-500">
              -{formatCurrency(summary.expenses)}
            </p>
          </div>
        </div>

        {/* Search Bar - Elegant */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Transaktion suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-100 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter Pills - Segmented Control Style */}
        <div className="flex p-1 bg-gray-100 dark:bg-[#232e40] rounded-xl">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                selectedType === type
                  ? "bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {type === 'all' ? t('all') : type === 'income' ? t('income') : t('expenses')}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-5 py-6 space-y-6">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine Transaktionen</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Beginnen Sie mit dem Tracking Ihrer Ausgaben
            </p>
            <button
              onClick={onAddTransaction}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              Transaktion hinzufügen
            </button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">
                {date}
              </h3>
              <div className="bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden shadow-sm">
                {txs.map((transaction, idx) => {
                  const config = getCategoryConfig(transaction.category)
                  const Icon = config.icon
                  const isIncome = transaction.type === 'income'
                  const description = transaction.description || (isIncome ? t('income') : t('expense'))
                  
                  return (
                    <div
                      key={transaction.id}
                      className={cn(
                        "relative flex items-center gap-4 p-4",
                        idx < txs.length - 1 && "border-b border-gray-100 dark:border-[#232e40]"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", config.bg)}>
                        <Icon className={cn("w-5 h-5", config.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(transaction.transactionDate).toLocaleTimeString('de-CH', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={cn(
                          "text-sm font-semibold tabular-nums",
                          isIncome ? "text-emerald-500" : "text-gray-900 dark:text-white"
                        )}>
                          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)), transaction.currency)}
                        </p>
                        <button
                          onClick={() => setActiveMenu(activeMenu === transaction.id ? null : transaction.id)}
                          className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#232e40] flex items-center justify-center"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Action Menu - Elegant Dropdown */}
                      {activeMenu === transaction.id && (
                        <div className="absolute top-14 right-4 bg-white dark:bg-[#232e40] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10 min-w-[140px]">
                          <button
                            onClick={() => {
                              onEditTransaction(transaction.id)
                              setActiveMenu(null)
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                          >
                            <Edit className="w-4 h-4" />
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => {
                              onDeleteTransaction(transaction.id)
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
                })}
              </div>
            </div>
          ))
        )}
        
        {/* Bottom spacing */}
        <div className="h-32" />
      </div>

      {/* Floating Action Button - Money App Style */}
      <button
        onClick={onAddTransaction}
        className="fixed bottom-28 right-5 w-14 h-14 bg-blue-500 rounded-full shadow-xl shadow-blue-500/40 flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  )
}
