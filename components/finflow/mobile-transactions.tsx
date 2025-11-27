"use client"

import { useState, useMemo } from "react"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Edit,
  Trash2,
  X
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

// Category styles
const categoryStyles: Record<string, { bg: string, text: string, icon: string }> = {
  'income': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: '💰' },
  'salary': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: '💵' },
  'food': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', icon: '🍔' },
  'transport': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: '🚗' },
  'shopping': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', icon: '🛍️' },
  'entertainment': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', icon: '🎬' },
  'bills': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: '📄' },
  'health': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', icon: '💊' },
  'default': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: '📝' },
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

  const getCategoryStyle = (category?: string | { name?: string }) => {
    const categoryName = typeof category === 'string' ? category : (category?.name || '')
    const key = categoryName?.toLowerCase() || 'default'
    return categoryStyles[key] || categoryStyles.default
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
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 border border-gray-100 dark:border-[#232e40]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('income')}</span>
          </div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(summary.income)}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-4 border border-gray-100 dark:border-[#232e40]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('expenses')}</span>
          </div>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            -{formatCurrency(summary.expenses)}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-[#232e40] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
              selectedType === type
                ? type === 'income'
                  ? "bg-emerald-600 text-white"
                  : type === 'expense'
                  ? "bg-red-600 text-white"
                  : "bg-blue-600 text-white"
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#232e40]"
            )}
          >
            {type === 'all' ? t('all') : type === 'income' ? t('income') : t('expenses')}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center border border-gray-100 dark:border-[#232e40]">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('noTransactions')}</p>
            <button
              onClick={onAddTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('addTransaction')}
            </button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
                {date}
              </h3>
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-gray-100 dark:border-[#232e40] overflow-hidden divide-y divide-gray-100 dark:divide-[#232e40]">
                {txs.map((transaction) => {
                  const style = getCategoryStyle(transaction.category)
                  const isIncome = transaction.type === 'income'
                  const description = transaction.description || (isIncome ? t('income') : t('expense'))
                  
                  return (
                    <div
                      key={transaction.id}
                      className="relative flex items-center gap-3 p-4"
                    >
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl", style.bg)}>
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(transaction.transactionDate).toLocaleTimeString('de-CH', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-bold",
                          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                        )}>
                          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)), transaction.currency)}
                        </p>
                        <button
                          onClick={() => setActiveMenu(activeMenu === transaction.id ? null : transaction.id)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232e40] flex items-center justify-center"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Action Menu */}
                      {activeMenu === transaction.id && (
                        <div className="absolute top-12 right-4 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-100 dark:border-[#232e40] overflow-hidden z-10">
                          <button
                            onClick={() => {
                              onEditTransaction(transaction.id)
                              setActiveMenu(null)
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232e40]"
                          >
                            <Edit className="w-4 h-4" />
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => {
                              onDeleteTransaction(transaction.id)
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
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={onAddTransaction}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
