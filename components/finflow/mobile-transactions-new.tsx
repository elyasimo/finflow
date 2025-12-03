"use client"

import { useState, useMemo } from "react"
import { 
  Plus,
  Search,
  Calendar,
  X,
  ChevronLeft,
  Filter,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileBottomNav from "./mobile-bottom-nav"
import TransactionCard from "./ui/transaction-card"
import MonthHeader, { groupTransactionsByMonth } from "./ui/month-header"

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category?: string
  transactionDate: string
  currency: string
  accountId: string
  note?: string
  tag?: string
  merchant?: string
}

interface AccountOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
}

interface MobileTransactionsNewProps {
  transactions: Transaction[]
  accounts?: AccountOption[]
  categories?: CategoryOption[]
  onAddTransaction: () => void
  onEditTransaction: (id: string) => void
  onDeleteTransaction: (id: string) => void
}

// Quick filter options
const quickFilters = [
  { id: 'all', label: 'Alle' },
  { id: '7days', label: '7 Tage' },
  { id: '30days', label: '30 Tage' },
  { id: 'income', label: 'Einnahmen' },
  { id: 'expense', label: 'Ausgaben' },
]

export default function MobileTransactionsNew({
  transactions,
  accounts,
  categories,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: MobileTransactionsNewProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
  }

  // Filter transactions based on active filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]
    
    // Apply quick filter
    const now = new Date()
    if (activeFilter === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(t => new Date(t.transactionDate) >= weekAgo)
    } else if (activeFilter === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(t => new Date(t.transactionDate) >= monthAgo)
    } else if (activeFilter === 'income') {
      filtered = filtered.filter(t => t.type === 'income')
    } else if (activeFilter === 'expense') {
      filtered = filtered.filter(t => t.type === 'expense')
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category?.toLowerCase() === selectedCategory.toLowerCase())
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.merchant?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query) ||
        t.note?.toLowerCase().includes(query)
      )
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )
  }, [transactions, activeFilter, selectedCategory, searchQuery])

  // Group transactions by month
  const groupedTransactions = useMemo(() => 
    groupTransactionsByMonth(filteredTransactions),
    [filteredTransactions]
  )

  // Calculate summary
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return { income, expenses, balance: income - expenses }
  }, [filteredTransactions])

  // Get unique categories from transactions
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    transactions.forEach(t => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats)
  }, [transactions])

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a2332] px-6 pt-16 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="w-11 h-11 rounded-full bg-gray-50 dark:bg-[#232e40] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('transactions')}
            </h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
              showFilters || selectedCategory
                ? "bg-blue-500 text-white"
                : "bg-gray-50 dark:bg-[#232e40] text-gray-600 dark:text-gray-300"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">{t('income')}</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">
              +{formatCurrency(summary.income)}
            </p>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">{t('expenses')}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              −{formatCurrency(summary.expenses)}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Transaktionen suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Quick Filters - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {quickFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeFilter === filter.id
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        {showFilters && uniqueCategories.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-[#232e40] rounded-2xl animate-fade-in">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Kategorie</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  !selectedCategory
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
                )}
              >
                Alle
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    selectedCategory === cat
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transactions List - Grouped by Month */}
      <div className="px-6 py-6">
        {groupedTransactions.size === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Transaktionen
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
              {searchQuery || selectedCategory 
                ? "Keine Transaktionen gefunden. Versuchen Sie andere Filter."
                : "Beginnen Sie mit dem Tracking Ihrer Ausgaben und Einnahmen"
              }
            </p>
            <button
              onClick={onAddTransaction}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-2xl font-semibold shadow-xl shadow-blue-500/30 hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erste Transaktion hinzufügen
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupedTransactions.entries()).map(([monthKey, group]) => (
              <div key={monthKey}>
                {/* Month Header with Total */}
                <MonthHeader
                  month={group.month}
                  year={group.year}
                  totalAmount={group.total}
                  currency={currency}
                  transactionCount={group.transactions.length}
                  formatCurrency={formatCurrency}
                />
                
                {/* Transaction Cards for this Month */}
                <div className="space-y-0">
                  {group.transactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      {...transaction}
                      formatCurrency={formatCurrency}
                      onDelete={onDeleteTransaction}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom spacing */}
        <div className="h-36" />
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onAddTransaction}
        className="fixed bottom-28 right-6 w-16 h-16 bg-blue-500 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center z-20 active:scale-95 transition-transform hover:bg-blue-600"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  )
}
