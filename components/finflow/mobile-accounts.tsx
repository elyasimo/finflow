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

// Color palette for account cards
const accountColors = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-emerald-500 to-emerald-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-cyan-500 to-cyan-600",
]

// Swiss bank colors
const bankColors: Record<string, string> = {
  'postfinance': 'from-[#FFC000] to-[#FFA500]',
  'ubs': 'from-red-600 to-red-700',
  'credit suisse': 'from-blue-700 to-blue-800',
  'raiffeisen': 'from-yellow-500 to-yellow-600',
  'zkb': 'from-blue-500 to-blue-600',
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
    switch (type.toLowerCase()) {
      case 'bank': return <CreditCard className="w-5 h-5" />
      case 'credit card': return <CreditCard className="w-5 h-5" />
      case 'savings': return <PiggyBank className="w-5 h-5" />
      case 'investment': return <TrendingUp className="w-5 h-5" />
      default: return <Wallet className="w-5 h-5" />
    }
  }

  const getCardColor = (account: Account, index: number) => {
    const name = account.name.toLowerCase()
    for (const [bank, color] of Object.entries(bankColors)) {
      if (name.includes(bank)) return color
    }
    return accountColors[index % accountColors.length]
  }

  const accountTypes = [
    { id: 'all', label: t('all') },
    { id: 'bank', label: t('bank') },
    { id: 'savings', label: t('savings') },
    { id: 'cash', label: t('cash') },
    { id: 'investment', label: t('investment') },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1629] pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a2332] px-4 pt-12 pb-4 safe-area-top">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('accounts')}
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Total Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">{t('totalBalance')}</p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {formatBalance(totalBalance)}
            </h1>
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <Wallet className="w-4 h-4" />
              <span>{accounts.length} {t('accounts')}</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {accountTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedType === type.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#232e40]"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Accounts List */}
        <div className="space-y-3">
          {filteredAccounts.length === 0 ? (
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-8 text-center border border-gray-100 dark:border-[#232e40]">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('noData') || 'Keine Konten vorhanden'}</p>
              <button
                onClick={onAddAccount}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium"
              >
                <Plus className="w-4 h-4" />
                {t('addAccount')}
              </button>
            </div>
          ) : (
            filteredAccounts.map((account, index) => (
              <div key={account.id} className="relative">
                <div
                  className={cn(
                    "rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br",
                    getCardColor(account, index)
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        {getAccountIcon(account.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium opacity-90">{account.type}</p>
                        <p className="text-xs opacity-75">{account.currency}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveMenu(activeMenu === account.id ? null : account.id)}
                      className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Account Name */}
                  <p className="text-sm opacity-90 mb-2 truncate">{account.name}</p>

                  {/* Balance */}
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(account.balance), account.currency)}
                  </p>

                  {/* Action Menu */}
                  {activeMenu === account.id && (
                    <div className="absolute top-16 right-4 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-100 dark:border-[#232e40] overflow-hidden z-10">
                      <button
                        onClick={() => {
                          onEditAccount(account.id)
                          setActiveMenu(null)
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232e40]"
                      >
                        <Edit className="w-4 h-4" />
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => {
                          onDeleteAccount(account.id)
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
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Account FAB */}
      <button
        onClick={onAddAccount}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
