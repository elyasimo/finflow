"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  Wallet, 
  Plus, 
  CreditCard, 
  PiggyBank, 
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Banknote,
  Building2,
  X,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import { useKeyboard } from "@/hooks/use-keyboard"
import MobilePageHeader, { MobilePageHeaderSpacer } from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  bankName?: string
}

interface MobileAccountsNewProps {
  accounts: Account[]
  totalBalance: number
  isLoading?: boolean
  onAddAccount: (data: AccountFormData) => Promise<void>
  onEditAccount: (id: string, data: AccountFormData) => Promise<void>
  onDeleteAccount: (id: string) => Promise<void>
  user?: { id: string; email: string; fullName?: string }
}

interface AccountFormData {
  name: string
  type: string
  balance: number
  currency: string
  bankName?: string
}

// Swiss banks
const SWISS_BANKS = [
  { name: 'UBS', color: '#E60000' },
  { name: 'Credit Suisse', color: '#0066B3' },
  { name: 'Raiffeisen', color: '#F5A623' },
  { name: 'PostFinance', color: '#FFC000' },
  { name: 'Zürcher Kantonalbank', color: '#0066B3' },
  { name: 'Migros Bank', color: '#FF6600' },
  { name: 'Revolut', color: '#191C1F' },
  { name: 'N26', color: '#36A18B' },
]

// Account types with icons
const ACCOUNT_TYPES = [
  { id: 'bank', name: 'Bank', icon: Building2, color: 'from-blue-500 to-indigo-600' },
  { id: 'savings', name: 'Sparen', icon: PiggyBank, color: 'from-emerald-500 to-teal-600' },
  { id: 'cash', name: 'Bargeld', icon: Banknote, color: 'from-purple-500 to-violet-600' },
  { id: 'credit', name: 'Kreditkarte', icon: CreditCard, color: 'from-rose-500 to-pink-600' },
  { id: 'investment', name: 'Investment', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
]

// Currency options
const CURRENCIES = [
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'MAD', symbol: 'د.م', name: 'Moroccan Dirham', flag: '🇲🇦' },
]

// Bank gradient colors
const bankGradients: Record<string, string> = {
  'postfinance': 'from-[#FFC000] via-[#FFB000] to-[#FF9500]',
  'ubs': 'from-red-500 via-red-600 to-red-700',
  'credit suisse': 'from-blue-600 via-blue-700 to-blue-800',
  'raiffeisen': 'from-amber-500 via-amber-600 to-amber-700',
  'zkb': 'from-blue-500 via-blue-600 to-blue-700',
  'zürcher kantonalbank': 'from-blue-500 via-blue-600 to-blue-700',
  'revolut': 'from-gray-800 via-gray-900 to-black',
  'n26': 'from-teal-500 via-teal-600 to-teal-700',
}

// Default gradients by account type
const typeGradients: Record<string, string> = {
  'bank': 'from-blue-500 via-blue-600 to-indigo-700',
  'savings': 'from-emerald-500 via-emerald-600 to-teal-700',
  'cash': 'from-purple-500 via-purple-600 to-violet-700',
  'credit': 'from-rose-500 via-rose-600 to-pink-700',
  'investment': 'from-amber-500 via-amber-600 to-orange-700',
}

export default function MobileAccountsNew({
  accounts,
  totalBalance,
  isLoading = false,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  user
}: MobileAccountsNewProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const keyboard = useKeyboard()
  
  // UI State
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Form State
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'bank',
    balance: 0,
    currency: 'CHF',
    bankName: ''
  })

  const formatCurrency = (amount: number, curr?: string) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(safeAmount)
  }

  const filteredAccounts = useMemo(() => {
    if (selectedType === 'all') return accounts
    return accounts.filter(acc => acc.type.toLowerCase() === selectedType)
  }, [accounts, selectedType])

  const getAccountIcon = (type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => t.id === type.toLowerCase())
    return accountType?.icon || Wallet
  }

  const getCardGradient = (account: Account) => {
    const name = account.name.toLowerCase()
    // Check for bank-specific gradient
    for (const [bank, gradient] of Object.entries(bankGradients)) {
      if (name.includes(bank)) return gradient
    }
    // Fall back to type gradient
    return typeGradients[account.type.toLowerCase()] || 'from-slate-700 via-slate-800 to-slate-900'
  }

  const getTextColor = (account: Account) => {
    const name = account.name.toLowerCase()
    if (name.includes('postfinance') || name.includes('raiffeisen')) {
      return 'text-gray-900'
    }
    return 'text-white'
  }

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      type: 'bank',
      balance: 0,
      currency: currency,
      bankName: ''
    })
    setError('')
    setShowAddSheet(true)
  }

  const handleOpenEdit = (account: Account) => {
    setSelectedAccount(account)
    setFormData({
      name: account.name.replace(/^[^-]+ - /, ''), // Remove bank prefix
      type: account.type.toLowerCase(),
      balance: account.balance,
      currency: account.currency,
      bankName: account.bankName || ''
    })
    setError('')
    setActiveMenu(null)
    setShowEditSheet(true)
  }

  const handleOpenDelete = (account: Account) => {
    setSelectedAccount(account)
    setActiveMenu(null)
    setShowDeleteConfirm(true)
  }

  const handleSubmitAdd = async () => {
    if (!formData.name.trim()) {
      setError('Bitte geben Sie einen Namen ein')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      await onAddAccount(formData)
      setShowAddSheet(false)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Kontos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedAccount || !formData.name.trim()) {
      setError('Bitte geben Sie einen Namen ein')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      await onEditAccount(selectedAccount.id, formData)
      setShowEditSheet(false)
      setSelectedAccount(null)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren des Kontos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedAccount) return
    
    try {
      setIsSubmitting(true)
      await onDeleteAccount(selectedAccount.id)
      setShowDeleteConfirm(false)
      setSelectedAccount(null)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen des Kontos')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Form Component
  const renderAccountForm = (isEdit: boolean) => (
    <div className="space-y-5">
      {/* Account Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Kontotyp
        </label>
        <div className="grid grid-cols-5 gap-2">
          {ACCOUNT_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all",
                  formData.type === type.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#232e40]"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5",
                  formData.type === type.id ? "text-blue-500" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  formData.type === type.id ? "text-blue-600 dark:text-blue-400" : "text-gray-500"
                )}>
                  {type.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bank Selection (for Bank/Savings types) */}
      {(formData.type === 'bank' || formData.type === 'savings') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bank (optional)
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {SWISS_BANKS.map((bank) => (
              <button
                key={bank.name}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  bankName: prev.bankName === bank.name ? '' : bank.name 
                }))}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border-2 whitespace-nowrap transition-all",
                  formData.bankName === bank.name
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#232e40]"
                )}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bank.color }}
                />
                <span className={cn(
                  "text-sm font-medium",
                  formData.bankName === bank.name ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
                )}>
                  {bank.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kontoname *
        </label>
        <input
          type="text"
          placeholder="z.B. Hauptkonto, Sparkonto"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className={cn(
            "w-full px-4 py-3.5 rounded-2xl text-base",
            "bg-gray-50 dark:bg-[#232e40]",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "border-2 border-transparent",
            "focus:outline-none focus:border-blue-500"
          )}
        />
      </div>

      {/* Currency Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Währung
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CURRENCIES.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setFormData(prev => ({ ...prev, currency: curr.code }))}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                formData.currency === curr.code
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#232e40]"
              )}
            >
              <span className="text-lg">{curr.flag}</span>
              <span className={cn(
                "text-xs font-medium",
                formData.currency === curr.code ? "text-blue-600 dark:text-blue-400" : "text-gray-500"
              )}>
                {curr.code}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Balance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Aktueller Saldo
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
            {CURRENCIES.find(c => c.code === formData.currency)?.symbol || formData.currency}
          </span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.balance || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
            className={cn(
              "w-full pl-12 pr-4 py-3.5 rounded-2xl text-base",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "border-2 border-transparent",
              "focus:outline-none focus:border-blue-500"
            )}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={isEdit ? handleSubmitEdit : handleSubmitAdd}
        disabled={isSubmitting || !formData.name.trim()}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-lg",
          "bg-blue-500 text-white",
          "shadow-lg shadow-blue-500/30",
          "hover:bg-blue-600 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all flex items-center justify-center gap-2"
        )}
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5" />
            {isEdit ? 'Speichern' : 'Konto erstellen'}
          </>
        )}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader user={user} title={t('accounts')} />
      <MobilePageHeaderSpacer />

      {/* Total Balance Header */}
      <div className="bg-white dark:bg-[#1a2332] px-5 pt-4 pb-6">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('totalBalance')}</p>
          <h2 className="text-4xl font-light text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(totalBalance)}
          </h2>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#232e40] rounded-full">
            <Wallet className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {accounts.length} {t('accounts')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-6 space-y-6">
        {/* Type Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          <button
            onClick={() => setSelectedType('all')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              selectedType === 'all'
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800"
            )}
          >
            <Wallet className="w-4 h-4" />
            Alle
          </button>
          {ACCOUNT_TYPES.map((type) => {
            const TypeIcon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedType === type.id
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800"
                )}
              >
                <TypeIcon className="w-4 h-4" />
                {type.name}
              </button>
            )
          })}
        </div>

        {/* Accounts List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Konten
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Fügen Sie Ihr erstes Konto hinzu
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              Konto hinzufügen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAccounts.map((account) => {
              const AccountIcon = getAccountIcon(account.type)
              const gradient = getCardGradient(account)
              const textColor = getTextColor(account)
              
              return (
                <div key={account.id} className="relative">
                  <div
                    className={cn(
                      "rounded-3xl p-5 shadow-xl bg-gradient-to-br relative overflow-hidden",
                      gradient,
                      textColor
                    )}
                  >
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <AccountIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-medium opacity-90">{account.type}</p>
                            <p className="text-xs opacity-70">{account.currency}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveMenu(activeMenu === account.id ? null : account.id)}
                          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                          aria-label="Mehr Optionen"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Account Info */}
                      <div>
                        <p className="text-sm opacity-80 mb-1 truncate">{account.name}</p>
                        <p className="text-3xl font-bold tracking-tight">
                          {formatCurrency(account.balance, account.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Action Menu */}
                    {activeMenu === account.id && (
                      <div className="absolute top-20 right-4 bg-white dark:bg-[#232e40] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-20 min-w-[150px]">
                        <button
                          onClick={() => handleOpenEdit(account)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                        >
                          <Edit className="w-4 h-4" />
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleOpenDelete(account)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
        )}

        {/* Bottom spacing */}
        <div className="h-32" />
      </div>

      {/* FAB - Add Account */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-28 right-6 w-16 h-16 bg-blue-500 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center z-20 active:scale-95 transition-transform hover:bg-blue-600"
        aria-label="Konto hinzufügen"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Add Account Sheet */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddSheet(false)}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl overflow-y-auto animate-slide-up transition-all duration-200"
            style={{
              maxHeight: keyboard.isVisible 
                ? `calc(100vh - ${keyboard.height}px - 44px)` 
                : '90vh',
              paddingBottom: keyboard.isVisible 
                ? `${keyboard.height + 20}px` 
                : 'max(20px, env(safe-area-inset-bottom))',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Neues Konto
              </h2>
              <button
                onClick={() => setShowAddSheet(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              {renderAccountForm(false)}
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Sheet */}
      {showEditSheet && selectedAccount && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditSheet(false)}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl overflow-y-auto animate-slide-up transition-all duration-200"
            style={{
              maxHeight: keyboard.isVisible 
                ? `calc(100vh - ${keyboard.height}px - 44px)` 
                : '90vh',
              paddingBottom: keyboard.isVisible 
                ? `${keyboard.height + 20}px` 
                : 'max(20px, env(safe-area-inset-bottom))',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Konto bearbeiten
              </h2>
              <button
                onClick={() => setShowEditSheet(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              {renderAccountForm(true)}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedAccount && (
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
                Konto löschen?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Möchten Sie "{selectedAccount.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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
