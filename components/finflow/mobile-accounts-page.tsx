"use client"

import { useState, useMemo } from "react"
import { 
  Plus,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Wallet,
  CreditCard,
  Building2,
  PiggyBank,
  Coins,
  TrendingUp,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobilePageHeader from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"
import { PostFinanceIcon, UBSIcon, CreditSuisseIcon, RaiffeisenIcon, ZKBIcon } from "@/components/icons/swiss-brand-icons"

// Types
interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  bankName?: string
  iban?: string
}

interface MobileAccountsPageProps {
  accounts: Account[]
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
  iban?: string
}

// Account Types
const ACCOUNT_TYPES = [
  { id: 'bank', label: 'Bankkonto', icon: Building2, color: 'bg-blue-500' },
  { id: 'credit-card', label: 'Kreditkarte', icon: CreditCard, color: 'bg-purple-500' },
  { id: 'savings', label: 'Sparkonto', icon: PiggyBank, color: 'bg-emerald-500' },
  { id: 'cash', label: 'Bargeld', icon: Coins, color: 'bg-amber-500' },
  { id: 'investment', label: 'Investment', icon: TrendingUp, color: 'bg-rose-500' },
]

// Swiss Banks with brand colors
const SWISS_BANKS = [
  { id: 'postfinance', label: 'PostFinance', icon: PostFinanceIcon, gradient: 'from-yellow-500 to-yellow-600' },
  { id: 'ubs', label: 'UBS', icon: UBSIcon, gradient: 'from-red-600 to-red-700' },
  { id: 'credit-suisse', label: 'Credit Suisse', icon: CreditSuisseIcon, gradient: 'from-blue-800 to-blue-900' },
  { id: 'raiffeisen', label: 'Raiffeisen', icon: RaiffeisenIcon, gradient: 'from-orange-500 to-red-600' },
  { id: 'zkb', label: 'ZKB', icon: ZKBIcon, gradient: 'from-blue-600 to-blue-700' },
  { id: 'other', label: 'Andere Bank', icon: Building2, gradient: 'from-gray-600 to-gray-700' },
]

// Currencies
const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'MAD', symbol: 'MAD', label: 'Moroccan Dirham' },
]

export default function MobileAccountsPage({
  accounts,
  isLoading = false,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  user
}: MobileAccountsPageProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  
  // UI State
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hideBalance, setHideBalance] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'bank',
    balance: 0,
    currency: currency,
    bankName: '',
    iban: ''
  })

  const formatCurrency = (amount: number, curr?: string) => {
    if (hideBalance) return '••••••'
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate totals
  const summary = useMemo(() => {
    const total = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
    const byType = ACCOUNT_TYPES.map(type => ({
      ...type,
      total: accounts
        .filter(acc => acc.type.toLowerCase() === type.id || acc.type.toLowerCase() === type.label.toLowerCase())
        .reduce((sum, acc) => sum + Number(acc.balance), 0),
      count: accounts.filter(acc => acc.type.toLowerCase() === type.id || acc.type.toLowerCase() === type.label.toLowerCase()).length
    }))
    return { total, byType }
  }, [accounts])

  const getAccountIcon = (type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => 
      t.id === type.toLowerCase() || t.label.toLowerCase() === type.toLowerCase()
    )
    return accountType?.icon || Wallet
  }

  const getAccountColor = (type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => 
      t.id === type.toLowerCase() || t.label.toLowerCase() === type.toLowerCase()
    )
    return accountType?.color || 'bg-gray-500'
  }

  const getBankInfo = (bankName?: string) => {
    if (!bankName) return null
    const bank = SWISS_BANKS.find(b => 
      b.id === bankName.toLowerCase() || 
      b.label.toLowerCase() === bankName.toLowerCase()
    )
    return bank
  }

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      type: 'bank',
      balance: 0,
      currency: currency,
      bankName: '',
      iban: ''
    })
    setError('')
    setShowAddSheet(true)
  }

  const handleOpenEdit = (account: Account) => {
    setSelectedAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      bankName: account.bankName || '',
      iban: account.iban || ''
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
      setError('Bitte geben Sie einen Kontonamen ein')
      return
    }
    if (!formData.type) {
      setError('Bitte wählen Sie einen Kontotyp')
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
    if (!selectedAccount) return
    
    if (!formData.name.trim()) {
      setError('Bitte geben Sie einen Kontonamen ein')
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

  // Format IBAN with spaces
  const formatIban = (value: string) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase()
    const groups = cleaned.match(/.{1,4}/g)
    return groups ? groups.join(' ') : cleaned
  }

  // Form Component
  const renderAccountForm = (isEdit: boolean) => (
    <div className="space-y-5">
      {/* Account Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kontoname *
        </label>
        <input
          type="text"
          placeholder="z.B. Privatkonto"
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

      {/* Account Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kontotyp *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  formData.type === type.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                  type.color
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-xs font-medium text-center",
                  formData.type === type.id ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
                )}>
                  {type.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bank Selection (for bank accounts) */}
      {(formData.type === 'bank' || formData.type === 'savings') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bank
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SWISS_BANKS.map((bank) => {
              const BankIcon = bank.icon
              return (
                <button
                  key={bank.id}
                  onClick={() => setFormData(prev => ({ ...prev, bankName: bank.id }))}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                    formData.bankName === bank.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white",
                    bank.gradient
                  )}>
                    <BankIcon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-center leading-tight",
                    formData.bankName === bank.id ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {bank.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* IBAN (optional for bank accounts) */}
      {(formData.type === 'bank' || formData.type === 'savings') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            IBAN (optional)
          </label>
          <input
            type="text"
            placeholder="CH00 0000 0000 0000 0000 0"
            value={formatIban(formData.iban || '')}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              iban: e.target.value.replace(/\s/g, '').toUpperCase() 
            }))}
            maxLength={26}
            className={cn(
              "w-full px-4 py-3.5 rounded-2xl font-mono",
              "bg-gray-50 dark:bg-[#232e40]",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "border-2 border-transparent",
              "focus:outline-none focus:border-blue-500"
            )}
          />
        </div>
      )}

      {/* Balance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kontostand
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-light text-gray-400">
            {CURRENCIES.find(c => c.code === formData.currency)?.symbol || formData.currency}
          </span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.balance || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
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

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Währung
        </label>
        <div className="flex gap-2">
          {CURRENCIES.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setFormData(prev => ({ ...prev, currency: curr.code }))}
              className={cn(
                "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                formData.currency === curr.code
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              {curr.code}
            </button>
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
          "bg-blue-500 text-white shadow-lg",
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
            {isEdit ? 'Speichern' : 'Konto erstellen'}
          </>
        )}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      <MobilePageHeader 
        user={user} 
        title={t('accounts')}
        rightActions={
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            {hideBalance ? (
              <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        }
      />

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 mx-5 mt-4 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-blue-100 text-sm">Gesamtvermögen</p>
          <Wallet className="w-6 h-6 text-blue-100" />
        </div>
        <p className="text-4xl font-bold mb-4">
          {formatCurrency(summary.total)}
        </p>
        
        {/* Account Type Summary */}
        <div className="flex flex-wrap gap-2">
          {summary.byType.filter(t => t.count > 0).map((type) => (
            <div 
              key={type.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-sm"
            >
              <type.icon className="w-4 h-4" />
              <span>{type.count}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accounts List */}
      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Ihre Konten
          </h2>
          <span className="text-sm text-gray-500">
            {accounts.length} {accounts.length === 1 ? 'Konto' : 'Konten'}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Konten
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
              Fügen Sie Ihr erstes Konto hinzu, um Ihre Finanzen zu verwalten.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-2xl font-semibold shadow-xl shadow-blue-500/30 hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erstes Konto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const Icon = getAccountIcon(account.type)
              const colorClass = getAccountColor(account.type)
              const bankInfo = getBankInfo(account.bankName)
              
              return (
                <div 
                  key={account.id}
                  className={cn(
                    "relative rounded-2xl overflow-hidden",
                    bankInfo 
                      ? `bg-gradient-to-br ${bankInfo.gradient}` 
                      : "bg-white dark:bg-[#1a2332]"
                  )}
                >
                  {/* Bank background pattern */}
                  {bankInfo && (
                    <>
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
                      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
                    </>
                  )}
                  
                  <div className={cn(
                    "relative flex items-center gap-4 p-4",
                    bankInfo && "text-white"
                  )}>
                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      bankInfo 
                        ? "bg-white/20" 
                        : `${colorClass} text-white`
                    )}>
                      {bankInfo ? (
                        <bankInfo.icon className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold truncate",
                        !bankInfo && "text-gray-900 dark:text-white"
                      )}>
                        {account.name}
                      </p>
                      <p className={cn(
                        "text-sm truncate",
                        bankInfo ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                      )}>
                        {bankInfo?.label || account.type}
                        {account.iban && ` • ${account.iban.slice(-4)}`}
                      </p>
                    </div>

                    {/* Balance */}
                    <p className={cn(
                      "font-bold text-lg whitespace-nowrap",
                      !bankInfo && "text-gray-900 dark:text-white"
                    )}>
                      {formatCurrency(account.balance, account.currency)}
                    </p>

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === account.id ? null : account.id)}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          bankInfo 
                            ? "hover:bg-white/20" 
                            : "hover:bg-gray-100 dark:hover:bg-[#232e40]"
                        )}
                      >
                        <MoreVertical className={cn(
                          "w-5 h-5",
                          bankInfo ? "text-white/70" : "text-gray-400"
                        )} />
                      </button>
                      
                      {activeMenu === account.id && (
                        <div className="absolute top-full right-0 mt-1 bg-white dark:bg-[#232e40] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-10 min-w-[130px]">
                          <button
                            onClick={() => handleOpenEdit(account)}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                          >
                            <Edit className="w-4 h-4" />
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleOpenDelete(account)}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                            Löschen
                          </button>
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
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up safe-area-inset-bottom">
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
            <div className="p-5 pb-8">
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
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up safe-area-inset-bottom">
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
            <div className="p-5 pb-8">
              {renderAccountForm(true)}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
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
                "{selectedAccount.name}" und alle zugehörigen Daten werden unwiderruflich gelöscht.
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
