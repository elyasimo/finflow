"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { 
  Plus,
  Search,
  Calendar,
  X,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  Upload,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  Wallet,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Briefcase,
  Heart,
  Plane,
  Gift,
  Smartphone,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobilePageHeader from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

// Types
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

interface Account {
  id: string
  name: string
  currency: string
}

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
}

interface MobileTransactionsPageProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  isLoading?: boolean
  onAddTransaction: (data: TransactionFormData) => Promise<void>
  onEditTransaction: (id: string, data: TransactionFormData) => Promise<void>
  onDeleteTransaction: (id: string) => Promise<void>
  onImport?: (file: File) => Promise<void>
  user?: { id: string; email: string; fullName?: string }
}

interface TransactionFormData {
  description: string
  amount: number
  type: 'income' | 'expense'
  category?: string
  transactionDate: string
  accountId: string
  note?: string
  merchant?: string
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'shopping': ShoppingCart,
  'einkauf': ShoppingCart,
  'groceries': ShoppingCart,
  'lebensmittel': ShoppingCart,
  'food': Utensils,
  'essen': Utensils,
  'restaurant': Utensils,
  'transport': Car,
  'verkehr': Car,
  'auto': Car,
  'home': Home,
  'wohnen': Home,
  'miete': Home,
  'work': Briefcase,
  'arbeit': Briefcase,
  'gehalt': Briefcase,
  'salary': Briefcase,
  'income': ArrowDownLeft,
  'einnahme': ArrowDownLeft,
  'health': Heart,
  'gesundheit': Heart,
  'travel': Plane,
  'reisen': Plane,
  'entertainment': Gift,
  'unterhaltung': Gift,
  'utilities': Zap,
  'nebenkosten': Zap,
  'phone': Smartphone,
  'telefon': Smartphone,
  'default': Tag,
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'shopping': 'bg-blue-500',
  'einkauf': 'bg-blue-500',
  'groceries': 'bg-green-500',
  'lebensmittel': 'bg-green-500',
  'food': 'bg-orange-500',
  'essen': 'bg-orange-500',
  'restaurant': 'bg-orange-500',
  'transport': 'bg-purple-500',
  'verkehr': 'bg-purple-500',
  'home': 'bg-indigo-500',
  'wohnen': 'bg-indigo-500',
  'work': 'bg-emerald-500',
  'arbeit': 'bg-emerald-500',
  'salary': 'bg-emerald-500',
  'gehalt': 'bg-emerald-500',
  'health': 'bg-rose-500',
  'gesundheit': 'bg-rose-500',
  'travel': 'bg-cyan-500',
  'reisen': 'bg-cyan-500',
  'entertainment': 'bg-pink-500',
  'unterhaltung': 'bg-pink-500',
  'utilities': 'bg-yellow-500',
  'nebenkosten': 'bg-yellow-500',
  'default': 'bg-gray-500',
}

// Transaction type tabs
const TYPE_TABS = [
  { id: 'all', label: 'Alle' },
  { id: 'expense', label: 'Ausgaben' },
  { id: 'income', label: 'Einnahmen' },
]

// Quick date filters
const DATE_FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: '7days', label: '7 Tage' },
  { id: '30days', label: '30 Tage' },
  { id: '90days', label: '3 Monate' },
]

export default function MobileTransactionsPage({
  transactions,
  accounts,
  categories,
  isLoading = false,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onImport,
  user
}: MobileTransactionsPageProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  
  // UI State
  const [activeTypeTab, setActiveTypeTab] = useState('all')
  const [activeDateFilter, setActiveDateFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Form State
  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: 0,
    type: 'expense',
    category: '',
    transactionDate: new Date().toISOString().split('T')[0],
    accountId: accounts[0]?.id || '',
    note: '',
    merchant: ''
  })

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Heute'
    if (isYesterday(date)) return 'Gestern'
    return format(date, 'd. MMMM', { locale: de })
  }

  const getCategoryIcon = (category?: string) => {
    if (!category) return CATEGORY_ICONS.default
    const key = category.toLowerCase()
    return CATEGORY_ICONS[key] || CATEGORY_ICONS.default
  }

  const getCategoryColor = (category?: string) => {
    if (!category) return CATEGORY_COLORS.default
    const key = category.toLowerCase()
    return CATEGORY_COLORS[key] || CATEGORY_COLORS.default
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]
    
    // Apply type filter (tabs)
    if (activeTypeTab === 'income') {
      filtered = filtered.filter(t => t.type === 'income')
    } else if (activeTypeTab === 'expense') {
      filtered = filtered.filter(t => t.type === 'expense')
    }
    
    // Apply date filter
    const now = new Date()
    if (activeDateFilter === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(t => new Date(t.transactionDate) >= weekAgo)
    } else if (activeDateFilter === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(t => new Date(t.transactionDate) >= monthAgo)
    } else if (activeDateFilter === '90days') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(t => new Date(t.transactionDate) >= threeMonthsAgo)
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category?.toLowerCase() === selectedCategory.toLowerCase())
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.merchant?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query) ||
        t.note?.toLowerCase().includes(query)
      )
    }
    
    return filtered.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )
  }, [transactions, activeTypeTab, activeDateFilter, selectedCategory, searchQuery])

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, { date: string; transactions: Transaction[]; total: number }>()
    
    filteredTransactions.forEach(transaction => {
      const dateKey = transaction.transactionDate.split('T')[0]
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: dateKey,
          transactions: [],
          total: 0
        })
      }
      
      const group = groups.get(dateKey)!
      group.transactions.push(transaction)
      group.total += transaction.type === 'income' ? transaction.amount : -transaction.amount
    })
    
    return groups
  }, [filteredTransactions])

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

  // Get unique categories
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    transactions.forEach(t => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats)
  }, [transactions])

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      description: '',
      amount: 0,
      type: 'expense',
      category: '',
      transactionDate: new Date().toISOString().split('T')[0],
      accountId: accounts[0]?.id || '',
      note: '',
      merchant: ''
    })
    setError('')
    setShowAddSheet(true)
  }

  const handleOpenEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category || '',
      transactionDate: transaction.transactionDate.split('T')[0],
      accountId: transaction.accountId,
      note: transaction.note || '',
      merchant: transaction.merchant || ''
    })
    setError('')
    setActiveMenu(null)
    setShowEditSheet(true)
  }

  const handleOpenDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setActiveMenu(null)
    setShowDeleteConfirm(true)
  }

  const handleSubmitAdd = async () => {
    if (!formData.description.trim()) {
      setError('Bitte geben Sie eine Beschreibung ein')
      return
    }
    if (formData.amount <= 0) {
      setError('Bitte geben Sie einen gültigen Betrag ein')
      return
    }
    if (!formData.accountId) {
      setError('Bitte wählen Sie ein Konto aus')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      await onAddTransaction(formData)
      setShowAddSheet(false)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Transaktion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedTransaction) return
    
    if (!formData.description.trim()) {
      setError('Bitte geben Sie eine Beschreibung ein')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      await onEditTransaction(selectedTransaction.id, formData)
      setShowEditSheet(false)
      setSelectedTransaction(null)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren der Transaktion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedTransaction) return
    
    try {
      setIsSubmitting(true)
      await onDeleteTransaction(selectedTransaction.id)
      setShowDeleteConfirm(false)
      setSelectedTransaction(null)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen der Transaktion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImport) return
    
    try {
      setIsSubmitting(true)
      await onImport(file)
    } catch (err: any) {
      setError(err.message || 'Import fehlgeschlagen')
    } finally {
      setIsSubmitting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Form Component
  const renderTransactionForm = (isEdit: boolean) => (
    <div className="space-y-5">
      {/* Type Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#232e40] rounded-2xl">
        <button
          onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
            formData.type === 'expense'
              ? "bg-rose-500 text-white shadow-lg"
              : "text-gray-500"
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          Ausgabe
        </button>
        <button
          onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
            formData.type === 'income'
              ? "bg-emerald-500 text-white shadow-lg"
              : "text-gray-500"
          )}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Einnahme
        </button>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Betrag *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-light text-gray-400">
            {currency}
          </span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            className={cn(
              "w-full pl-16 pr-4 py-4 rounded-2xl text-3xl font-light text-center",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "border-2 border-transparent",
              "focus:outline-none focus:border-blue-500"
            )}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Beschreibung *
        </label>
        <input
          type="text"
          placeholder="z.B. Einkauf Migros"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className={cn(
            "w-full px-4 py-3.5 rounded-2xl",
            "bg-gray-50 dark:bg-[#232e40]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "border-2 border-transparent",
            "focus:outline-none focus:border-blue-500"
          )}
        />
      </div>

      {/* Account Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Konto *
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setFormData(prev => ({ ...prev, accountId: account.id }))}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border-2 whitespace-nowrap transition-all",
                formData.accountId === account.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#232e40]"
              )}
            >
              <Wallet className={cn(
                "w-4 h-4",
                formData.accountId === account.id ? "text-blue-500" : "text-gray-400"
              )} />
              <span className={cn(
                "text-sm font-medium",
                formData.accountId === account.id ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
              )}>
                {account.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kategorie
        </label>
        <div className="flex flex-wrap gap-2">
          {uniqueCategories.slice(0, 8).map((cat) => {
            const Icon = getCategoryIcon(cat)
            return (
              <button
                key={cat}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  category: prev.category === cat ? '' : cat 
                }))}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
                  formData.category === cat
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4",
                  formData.category === cat ? "text-blue-500" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-sm",
                  formData.category === cat ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
                )}>
                  {cat}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Datum
        </label>
        <input
          type="date"
          value={formData.transactionDate}
          onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
          className={cn(
            "w-full px-4 py-3.5 rounded-2xl",
            "bg-gray-50 dark:bg-[#232e40]",
            "text-gray-900 dark:text-white",
            "border-2 border-transparent",
            "focus:outline-none focus:border-blue-500"
          )}
        />
      </div>

      {/* Note (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notiz (optional)
        </label>
        <textarea
          placeholder="Zusätzliche Infos..."
          value={formData.note}
          onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
          rows={2}
          className={cn(
            "w-full px-4 py-3 rounded-2xl resize-none",
            "bg-gray-50 dark:bg-[#232e40]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "border-2 border-transparent",
            "focus:outline-none focus:border-blue-500"
          )}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={isEdit ? handleSubmitEdit : handleSubmitAdd}
        disabled={isSubmitting}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-lg",
          formData.type === 'expense' ? "bg-rose-500" : "bg-emerald-500",
          "text-white shadow-lg",
          "hover:opacity-90 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all flex items-center justify-center gap-2"
        )}
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5" />
            {isEdit ? 'Speichern' : 'Hinzufügen'}
          </>
        )}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader 
        user={user} 
        title={t('transactions')}
        showSearch
        onSearchChange={setSearchQuery}
        searchPlaceholder="Transaktionen suchen..."
      />

      {/* Type Tabs - Split Income/Expense */}
      <div className="bg-white dark:bg-[#1a2332] px-5 pt-3">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#232e40] rounded-2xl">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTypeTab(tab.id)}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTypeTab === tab.id
                  ? tab.id === 'income' 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : tab.id === 'expense'
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                    : "bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white shadow-md"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Header */}
      <div className="bg-white dark:bg-[#1a2332] px-5 py-4">
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">{t('income')}</span>
            </div>
            <p className="text-lg font-bold text-emerald-500">
              +{formatCurrency(summary.income)}
            </p>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">{t('expenses')}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              −{formatCurrency(summary.expenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Date Filters (Quick-range Pills) */}
      <div className="bg-white dark:bg-[#1a2332] px-5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveDateFilter(filter.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeDateFilter === filter.id
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        {uniqueCategories.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
              selectedCategory || showFilters
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                : "border-gray-200 dark:border-gray-700 text-gray-500"
            )}
          >
            <Filter className="w-4 h-4" />
            {selectedCategory || 'Kategorie'}
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              showFilters && "rotate-180"
            )} />
          </button>
        )}

        {/* Category Filter Dropdown */}
        {showFilters && uniqueCategories.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-[#232e40] rounded-xl">
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

      {/* Main Content */}
      <div className="px-5 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : groupedTransactions.size === 0 ? (
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
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-2xl font-semibold shadow-xl shadow-blue-500/30 hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erste Transaktion
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupedTransactions.entries()).map(([dateKey, group]) => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {formatDate(group.date)}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    group.total >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {group.total >= 0 ? '+' : ''}{formatCurrency(group.total)}
                  </span>
                </div>

                {/* Transactions for this date */}
                <div className="bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                  {group.transactions.map((transaction) => {
                    const Icon = getCategoryIcon(transaction.category)
                    const colorClass = getCategoryColor(transaction.category)
                    
                    return (
                      <div 
                        key={transaction.id}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#232e40] transition-colors"
                      >
                        {/* Category Icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-white",
                          transaction.type === 'income' ? 'bg-emerald-500' : colorClass
                        )}>
                          {transaction.type === 'income' ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {transaction.category || transaction.merchant || 'Keine Kategorie'}
                          </p>
                        </div>

                        {/* Amount */}
                        <p className={cn(
                          "font-semibold whitespace-nowrap",
                          transaction.type === 'income' ? "text-emerald-500" : "text-gray-900 dark:text-white"
                        )}>
                          {transaction.type === 'income' ? '+' : '−'}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>

                        {/* Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === transaction.id ? null : transaction.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#232e40]"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          {activeMenu === transaction.id && (
                            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-[#232e40] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10 min-w-[130px]">
                              <button
                                onClick={() => handleOpenEdit(transaction)}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                              >
                                <Edit className="w-4 h-4" />
                                Bearbeiten
                              </button>
                              <button
                                onClick={() => handleOpenDelete(transaction)}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 className="w-4 h-4" />
                                Löschen
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-36" />
      </div>

      {/* FAB */}
      <div className="fixed bottom-28 right-6 flex flex-col gap-3 z-20">
        {/* Import Button */}
        {onImport && (
          <button
            onClick={handleImportClick}
            className="w-12 h-12 bg-white dark:bg-[#232e40] rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#1a2332] transition-colors"
            aria-label="Import"
          >
            <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        
        {/* Add Button */}
        <button
          onClick={handleOpenAdd}
          className="w-16 h-16 bg-blue-500 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center active:scale-95 transition-transform hover:bg-blue-600"
          aria-label="Transaktion hinzufügen"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.ofx"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Add Transaction Sheet */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Neue Transaktion
              </h2>
              <button
                onClick={() => setShowAddSheet(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* A1 Fix: Scrollable content with safe area padding */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 pb-[120px]">
                {renderTransactionForm(false)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Sheet */}
      {showEditSheet && selectedTransaction && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Transaktion bearbeiten
              </h2>
              <button
                onClick={() => setShowEditSheet(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* A1 Fix: Scrollable content with safe area padding */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 pb-[120px]">
                {renderTransactionForm(true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white dark:bg-[#1a2332] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Transaktion löschen?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                "{selectedTransaction.description}" wird unwiderruflich gelöscht.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-100 dark:bg-[#232e40] text-gray-700 dark:text-gray-300"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-medium bg-rose-500 text-white flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  )
}
