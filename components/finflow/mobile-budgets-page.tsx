"use client"

import { useState, useMemo } from "react"
import { 
  Plus,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  Loader2,
  AlertCircle,
  PiggyBank,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Plane,
  Zap,
  Gift,
  Heart,
  Calendar,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobilePageHeader, { MobilePageHeaderSpacer } from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"
import { format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

// Types
interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  categoryId?: string
  categoryName?: string
  startDate?: string
  endDate?: string
  color?: string
  currency?: string
}

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
}

interface MobileBudgetsPageProps {
  budgets: Budget[]
  categories: Category[]
  isLoading?: boolean
  onAddBudget: (data: BudgetFormData) => Promise<void>
  onEditBudget: (id: string, data: BudgetFormData) => Promise<void>
  onDeleteBudget: (id: string) => Promise<void>
  user?: { id: string; email: string; fullName?: string }
}

interface BudgetFormData {
  name: string
  amount: number
  categoryId?: string
  startDate?: string
  endDate?: string
  color?: string
}

// Wallet-style gradients
const WALLET_GRADIENTS = [
  { id: 'blue', gradient: 'from-blue-600 to-blue-400', color: '#2563eb' },
  { id: 'purple', gradient: 'from-purple-600 to-purple-400', color: '#9333ea' },
  { id: 'green', gradient: 'from-emerald-600 to-emerald-400', color: '#059669' },
  { id: 'orange', gradient: 'from-orange-600 to-orange-400', color: '#ea580c' },
  { id: 'pink', gradient: 'from-pink-600 to-pink-400', color: '#db2777' },
  { id: 'cyan', gradient: 'from-cyan-600 to-cyan-400', color: '#0891b2' },
  { id: 'rose', gradient: 'from-rose-600 to-rose-400', color: '#e11d48' },
  { id: 'indigo', gradient: 'from-indigo-600 to-indigo-400', color: '#4f46e5' },
]

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'shopping': ShoppingCart,
  'einkauf': ShoppingCart,
  'groceries': ShoppingCart,
  'lebensmittel': ShoppingCart,
  'food': Utensils,
  'essen': Utensils,
  'transport': Car,
  'verkehr': Car,
  'home': Home,
  'wohnen': Home,
  'travel': Plane,
  'reisen': Plane,
  'utilities': Zap,
  'entertainment': Gift,
  'health': Heart,
  'gesundheit': Heart,
  'savings': PiggyBank,
  'sparen': PiggyBank,
  'default': Wallet,
}

export default function MobileBudgetsPage({
  budgets,
  categories,
  isLoading = false,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  user
}: MobileBudgetsPageProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  
  // UI State
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Form State
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    amount: 0,
    categoryId: '',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    color: WALLET_GRADIENTS[0].id
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryIcon = (categoryName?: string) => {
    if (!categoryName) return CATEGORY_ICONS.default
    const key = categoryName.toLowerCase()
    return CATEGORY_ICONS[key] || CATEGORY_ICONS.default
  }

  const getWalletGradient = (colorId?: string) => {
    const wallet = WALLET_GRADIENTS.find(w => w.id === colorId)
    return wallet || WALLET_GRADIENTS[0]
  }

  // Calculate budget status
  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100
    const remaining = budget.amount - budget.spent
    
    let status: 'good' | 'warning' | 'danger' = 'good'
    if (percentage >= 100) {
      status = 'danger'
    } else if (percentage >= 80) {
      status = 'warning'
    }
    
    // Calculate days remaining
    let daysRemaining = 0
    if (budget.endDate) {
      daysRemaining = Math.max(0, differenceInDays(parseISO(budget.endDate), new Date()))
    }
    
    return { percentage: Math.min(percentage, 100), remaining, status, daysRemaining }
  }

  // Summary calculations
  const summary = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0)
    const remaining = totalBudget - totalSpent
    const avgUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    
    return { totalBudget, totalSpent, remaining, avgUtilization }
  }, [budgets])

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      amount: 0,
      categoryId: '',
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      color: WALLET_GRADIENTS[Math.floor(Math.random() * WALLET_GRADIENTS.length)].id
    })
    setError('')
    setShowAddSheet(true)
  }

  const handleOpenEdit = (budget: Budget) => {
    setSelectedBudget(budget)
    setFormData({
      name: budget.name,
      amount: budget.amount,
      categoryId: budget.categoryId || '',
      startDate: budget.startDate?.split('T')[0] || format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: budget.endDate?.split('T')[0] || format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      color: budget.color || WALLET_GRADIENTS[0].id
    })
    setError('')
    setActiveMenu(null)
    setShowEditSheet(true)
  }

  const handleOpenDelete = (budget: Budget) => {
    setSelectedBudget(budget)
    setActiveMenu(null)
    setShowDeleteConfirm(true)
  }

  const handleSubmitAdd = async () => {
    if (!formData.name.trim()) {
      setError('Bitte geben Sie einen Namen ein')
      return
    }
    if (formData.amount <= 0) {
      setError('Bitte geben Sie einen gültigen Betrag ein')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      await onAddBudget(formData)
      setShowAddSheet(false)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Budgets')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedBudget) return
    
    if (!formData.name.trim()) {
      setError('Bitte geben Sie einen Namen ein')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      await onEditBudget(selectedBudget.id, formData)
      setShowEditSheet(false)
      setSelectedBudget(null)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren des Budgets')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedBudget) return
    
    try {
      setIsSubmitting(true)
      await onDeleteBudget(selectedBudget.id)
      setShowDeleteConfirm(false)
      setSelectedBudget(null)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen des Budgets')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Form Component
  const renderBudgetForm = (isEdit: boolean) => (
    <div className="space-y-5">
      {/* Budget Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Budget Name *
        </label>
        <input
          type="text"
          placeholder="z.B. Monatliche Ausgaben"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className={cn(
            "w-full px-4 py-3.5 rounded-2xl",
            "bg-gray-50 dark:bg-[#232e40]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "border-2 border-transparent",
            "focus:outline-none focus:border-blue-500"
          )}
        />
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Budget Betrag *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-light text-gray-400">
            {currency}
          </span>
          <input
            type="number"
            step="100"
            placeholder="0"
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

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kategorie (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setFormData(prev => ({ ...prev, categoryId: '' }))
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
              !formData.categoryId
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700"
            )}
          >
            <Wallet className={cn(
              "w-4 h-4",
              !formData.categoryId ? "text-blue-500" : "text-gray-400"
            )} />
            <span className={cn(
              "text-sm",
              !formData.categoryId ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
            )}>
              Alle
            </span>
          </button>
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setFormData(prev => ({ 
                    ...prev, 
                    categoryId: prev.categoryId === cat.id ? '' : cat.id 
                  }))
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
                  formData.categoryId === cat.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4",
                  formData.categoryId === cat.id ? "text-blue-500" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-sm",
                  formData.categoryId === cat.id ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
                )}>
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className={cn(
              "w-full px-4 py-3 rounded-2xl",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white",
              "border-2 border-transparent",
              "focus:outline-none focus:border-blue-500"
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ende
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            className={cn(
              "w-full px-4 py-3 rounded-2xl",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white",
              "border-2 border-transparent",
              "focus:outline-none focus:border-blue-500"
            )}
          />
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Farbe
        </label>
        <div className="flex flex-wrap gap-3">
          {WALLET_GRADIENTS.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setFormData(prev => ({ ...prev, color: wallet.id }))
              }}
              className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br transition-all",
                wallet.gradient,
                formData.color === wallet.id 
                  ? "ring-2 ring-offset-2 ring-blue-500 scale-110" 
                  : "opacity-70 hover:opacity-100"
              )}
            />
          ))}
        </div>
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
          "bg-gradient-to-r",
          getWalletGradient(formData.color).gradient,
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
            {isEdit ? 'Speichern' : 'Budget erstellen'}
          </>
        )}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader 
        user={user} 
        title={t('budgets')}
      />
      <MobilePageHeaderSpacer />

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 mx-5 mt-4 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">Gesamt Budget</p>
            <p className="text-3xl font-bold">{formatCurrency(summary.totalBudget)}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <PiggyBank className="w-7 h-7" />
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-blue-100">Ausgegeben</span>
            <span className="font-medium">{summary.avgUtilization.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                summary.avgUtilization >= 100 ? "bg-rose-400" :
                summary.avgUtilization >= 80 ? "bg-amber-400" : "bg-emerald-400"
              )}
              style={{ width: `${Math.min(summary.avgUtilization, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-blue-100">Ausgegeben: </span>
            <span className="font-semibold">{formatCurrency(summary.totalSpent)}</span>
          </div>
          <div>
            <span className="text-blue-100">Verbleibend: </span>
            <span className="font-semibold">{formatCurrency(summary.remaining)}</span>
          </div>
        </div>
      </div>

      {/* Budget Cards (Wallet-style) */}
      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Ihre Budgets
          </h2>
          <span className="text-sm text-gray-500">
            {budgets.length} {budgets.length === 1 ? 'Budget' : 'Budgets'}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Budgets
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
              Erstellen Sie Ihr erstes Budget, um Ihre Ausgaben besser zu kontrollieren.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-2xl font-semibold shadow-xl shadow-blue-500/30 hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erstes Budget
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const { percentage, remaining, status, daysRemaining } = getBudgetStatus(budget)
              const walletStyle = getWalletGradient(budget.color)
              const Icon = getCategoryIcon(budget.categoryName)
              
              return (
                <div 
                  key={budget.id}
                  className={cn(
                    "relative rounded-3xl p-5 text-white shadow-lg",
                    "bg-gradient-to-br",
                    walletStyle.gradient
                  )}
                >
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
                  
                  {/* Content */}
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{budget.name}</h3>
                          {budget.categoryName && (
                            <p className="text-sm text-white/70">{budget.categoryName}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === budget.id ? null : budget.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {activeMenu === budget.id && (
                          <div className="absolute top-full right-0 mt-1 bg-white dark:bg-[#232e40] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 min-w-[140px]">
                            <button
                              onClick={() => handleOpenEdit(budget)}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => handleOpenDelete(budget)}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Löschen
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Amount Display - A2 Fix: Responsive text for large numbers */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-bold truncate max-w-[160px]">
                          {formatCurrency(budget.spent)}
                        </span>
                        <span className="text-base sm:text-lg text-white/70 truncate">
                          / {formatCurrency(budget.amount)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            status === 'danger' ? "bg-rose-400" :
                            status === 'warning' ? "bg-amber-400" : "bg-white"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        {status === 'danger' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : status === 'warning' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>
                          {remaining >= 0 
                            ? `${formatCurrency(remaining)} verbleibend`
                            : `${formatCurrency(Math.abs(remaining))} überschritten`
                          }
                        </span>
                      </div>
                      {daysRemaining > 0 && (
                        <div className="flex items-center gap-1 text-white/70">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{daysRemaining} Tage</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-36" />
      </div>

      {/* FAB */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-28 right-6 w-16 h-16 bg-blue-500 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center active:scale-95 transition-transform hover:bg-blue-600 z-20"
        aria-label="Budget hinzufügen"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Add Budget Sheet */}
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
                Neues Budget
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
                {renderBudgetForm(false)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Budget Sheet */}
      {showEditSheet && selectedBudget && (
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
                Budget bearbeiten
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
                {renderBudgetForm(true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedBudget && (
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
                Budget löschen?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                "{selectedBudget.name}" wird unwiderruflich gelöscht.
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

      <MobileBottomNav fixed />
    </div>
  )
}
