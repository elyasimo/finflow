"use client"

import { useState, useMemo } from "react"
import { 
  Wallet, 
  Plus, 
  CreditCard, 
  PiggyBank, 
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  Banknote,
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useCurrency } from "./CurrencyContext"
import MobileBottomNav from "./mobile-bottom-nav"

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  bankName?: string;
}

interface MobileAccountsProps {
  accounts: Account[]
  totalBalance: number
  onAddAccount: () => void
  onEditAccount: (id: string) => void
  onDeleteAccount: (id: string) => void
}

// Elegant gradient colors - Money App Style
const accountGradients = [
  "from-blue-500 via-blue-600 to-indigo-700",
  "from-emerald-500 via-emerald-600 to-teal-700",
  "from-purple-500 via-purple-600 to-violet-700",
  "from-rose-500 via-rose-600 to-pink-700",
  "from-amber-500 via-amber-600 to-orange-700",
  "from-cyan-500 via-cyan-600 to-sky-700",
]

// Swiss bank specific colors
const bankColors: Record<string, string> = {
  'postfinance': 'from-[#FFC000] via-[#FFB000] to-[#FF9500]',
  'ubs': 'from-red-500 via-red-600 to-red-700',
  'credit suisse': 'from-blue-600 via-blue-700 to-blue-800',
  'raiffeisen': 'from-amber-500 via-amber-600 to-amber-700',
  'zkb': 'from-blue-500 via-blue-600 to-blue-700',
}

// Account type icons
const accountTypeIcons: Record<string, React.ElementType> = {
  'bank': Building2,
  'checking': Wallet,
  'savings': PiggyBank,
  'credit card': CreditCard,
  'credit': CreditCard,
  'investment': TrendingUp,
  'cash': Banknote,
  'default': Wallet,
}

export default function MobileAccounts({
  accounts,
  totalBalance,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
}: MobileAccountsProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(amount / 100)
  }

  const formatBalance = (amount: number, curr?: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: curr || currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const filteredAccounts = useMemo(() => {
    if (selectedType === 'all') return accounts
    return accounts.filter(acc => acc.type.toLowerCase() === selectedType)
  }, [accounts, selectedType])

  const getAccountIcon = (type: string) => {
    const key = type?.toLowerCase() || 'default'
    return accountTypeIcons[key] || accountTypeIcons.default
  }

  const getCardColor = (account: Account, index: number) => {
    const name = account.name.toLowerCase()
    for (const [bank, color] of Object.entries(bankColors)) {
      if (name.includes(bank)) return color
    }
    return accountGradients[index % accountGradients.length]
  }

  const accountTypes = [
    { id: 'all', label: 'Alle', icon: Wallet },
    { id: 'bank', label: 'Bank', icon: Building2 },
    { id: 'savings', label: 'Sparen', icon: PiggyBank },
    { id: 'cash', label: 'Bargeld', icon: Banknote },
    { id: 'investment', label: 'Investment', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Elegant Header */}
      <div className="bg-white dark:bg-[#1a2332] px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('accounts')}</h1>
        </div>

        {/* Total Balance - Money App Style */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('totalBalance')}</p>
          <h2 className="text-4xl font-light text-gray-900 dark:text-white tracking-tight">
            {formatBalance(totalBalance)}
          </h2>
        </div>

        {/* Account Count Indicator */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#232e40] rounded-full">
            <Wallet className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{accounts.length} Konten</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-6 space-y-6">
        {/* Filter Pills - Icon Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {accountTypes.map((type) => {
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
                {type.label}
              </button>
            )
          })}
        </div>

        {/* Accounts List */}
        <div className="space-y-4">
          {filteredAccounts.length === 0 ? (
            <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine Konten</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Fügen Sie Ihr erstes Konto hinzu
              </p>
              <button
                onClick={onAddAccount}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-5 h-5" />
                Konto hinzufügen
              </button>
            </div>
          ) : (
            filteredAccounts.map((account, index) => {
              const AccountIcon = getAccountIcon(account.type)
              
              return (
                <div key={account.id} className="relative">
                  <div
                    className={cn(
                      "rounded-3xl p-5 text-white shadow-xl bg-gradient-to-br relative overflow-hidden",
                      getCardColor(account, index)
                    )}
                  >
                    {/* Card Decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
                    
                    <div className="relative z-10">
                      {/* Card Header */}
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
                          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Account Info */}
                      <div>
                        <p className="text-sm opacity-80 mb-1 truncate">{account.name}</p>
                        <p className="text-3xl font-bold tracking-tight">
                          {formatCurrency(Number(account.balance), account.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Action Menu */}
                    {activeMenu === account.id && (
                      <div className="absolute top-20 right-4 bg-white dark:bg-[#232e40] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10 min-w-[140px]">
                        <button
                          onClick={() => {
                            onEditAccount(account.id)
                            setActiveMenu(null)
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                        >
                          <Edit className="w-4 h-4" />
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => {
                            onDeleteAccount(account.id)
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
                </div>
              )
            })
          )}
        </div>

        {/* Bottom spacing */}
        <div className="h-32" />
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
