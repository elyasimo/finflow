'use client'

import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft, Wallet, SendHorizontal, QrCode, Plus, ArrowRight, CreditCard } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface AccountItem {
  id: string
  title: string
  description?: string
  balance: string
  type: "savings" | "checking" | "investment" | "debt"
}

interface List01Props {
  totalBalance?: string
  accounts?: AccountItem[]
  className?: string
  hasMultipleCurrencies?: boolean
  userCurrency?: string
  onAddClick?: () => void
  onSendClick?: () => void
  onTopUpClick?: () => void
  onMoreClick?: () => void
}

const ACCOUNTS: AccountItem[] = [
  {
    id: "1",
    title: "Main Savings",
    description: "Personal savings",
    balance: "$8,459.45",
    type: "savings",
  },
  {
    id: "2",
    title: "Checking Account",
    description: "Daily expenses",
    balance: "$2,850.00",
    type: "checking",
  },
  {
    id: "3",
    title: "Investment Portfolio",
    description: "Stock & ETFs",
    balance: "$15,230.80",
    type: "investment",
  },
  {
    id: "4",
    title: "Credit Card",
    description: "Pending charges",
    balance: "$1,200.00",
    type: "debt",
  },
  {
    id: "5",
    title: "Savings Account",
    description: "Emergency fund",
    balance: "$3,000.00",
    type: "savings",
  },
]

export default function List01({
  totalBalance = "$26,540.25",
  accounts = ACCOUNTS,
  className,
  hasMultipleCurrencies = false,
  userCurrency = "EUR",
  onAddClick,
  onSendClick,
  onTopUpClick,
  onMoreClick
}: List01Props) {
  const { t } = useLanguage()

  return (
    <div
      className={cn(
        "w-full",
        "bg-white dark:bg-[#1a2e42]",
        "border border-zinc-100 dark:border-[#2d3b4e]",
        "rounded-xl shadow-sm backdrop-blur-xl",
        className,
      )}
    >
      {/* Total Balance Section - Mobile Optimized */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-[#2d3b4e] bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-t-xl">
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">
          {t('totalBalance')}
          {hasMultipleCurrencies && (
            <span className="text-orange-500 ml-1 text-[10px] sm:text-xs">({userCurrency} accounts only)</span>
          )}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">{totalBalance}</h1>
      </div>

      {/* Accounts List - Mobile Optimized */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('yourAccounts')}</h2>
        </div>

        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={cn(
                "group flex items-center justify-between",
                "p-3 sm:p-3 rounded-xl",
                "bg-zinc-50 dark:bg-[#232e40]",
                "hover:bg-zinc-100 dark:hover:bg-[#2a3544]",
                "transition-all duration-200",
                "cursor-pointer active:scale-[0.98]",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn("p-2.5 sm:p-2 rounded-xl", {
                    "bg-emerald-100 dark:bg-emerald-900/30": account.type === "savings",
                    "bg-blue-100 dark:bg-blue-900/30": account.type === "checking",
                    "bg-purple-100 dark:bg-purple-900/30": account.type === "investment",
                    "bg-red-100 dark:bg-red-900/30": account.type === "debt",
                  })}
                >
                  {account.type === "savings" && (
                    <Wallet className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {account.type === "checking" && <QrCode className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />}
                  {account.type === "investment" && (
                    <ArrowUpRight className="w-5 h-5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                  )}
                  {account.type === "debt" && <CreditCard className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{account.title}</h3>
                  {account.description && (
                    <p className="text-xs sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{account.description}</p>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-2">
                <span className="text-sm sm:text-xs font-bold text-zinc-900 dark:text-zinc-100">{account.balance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons - Mobile Optimized */}
      <div className="p-3 sm:p-4 border-t border-zinc-100 dark:border-[#2d3b4e]">
        <div className="grid grid-cols-4 gap-2 sm:gap-2">
          <button
            type="button"
            onClick={onAddClick}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
              "py-3 sm:py-2 px-2 sm:px-3 rounded-xl",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
              "active:scale-[0.96]",
            )}
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="text-[10px] sm:text-xs">{t('add')}</span>
          </button>
          <button
            type="button"
            onClick={onSendClick}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
              "py-3 sm:py-2 px-2 sm:px-3 rounded-xl",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
              "active:scale-[0.96]",
            )}
          >
            <SendHorizontal className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="text-[10px] sm:text-xs">{t('send')}</span>
          </button>
          <button
            type="button"
            onClick={onTopUpClick}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
              "py-3 sm:py-2 px-2 sm:px-3 rounded-xl",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
              "active:scale-[0.96]",
            )}
          >
            <ArrowDownLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="text-[10px] sm:text-xs">{t('topUp')}</span>
          </button>
          <button
            type="button"
            onClick={onMoreClick}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
              "py-3 sm:py-2 px-2 sm:px-3 rounded-xl",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
              "active:scale-[0.96]",
            )}
          >
            <ArrowRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="text-[10px] sm:text-xs">{t('more')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
