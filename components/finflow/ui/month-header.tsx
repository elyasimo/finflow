"use client"

import { cn } from "@/lib/utils"

interface MonthHeaderProps {
  month: string
  year: number
  totalAmount: number
  currency: string
  transactionCount: number
  formatCurrency: (amount: number, currency?: string) => string
  isExpanded?: boolean
  onToggle?: () => void
}

export default function MonthHeader({
  month,
  year,
  totalAmount,
  currency,
  transactionCount,
  formatCurrency,
  isExpanded = true,
  onToggle,
}: MonthHeaderProps) {
  const isNegative = totalAmount < 0

  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between py-4 px-1 mb-2",
        "border-b border-gray-100 dark:border-gray-800",
        onToggle && "cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/20 -mx-1 px-2 rounded-lg"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {month} {year}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {transactionCount} {transactionCount === 1 ? 'Transaktion' : 'Transaktionen'}
          </span>
        </div>
      </div>
      
      <div className="text-right">
        <p className={cn(
          "text-lg font-bold tabular-nums",
          isNegative ? "text-gray-900 dark:text-white" : "text-emerald-500"
        )}>
          {isNegative ? '−' : '+'}{formatCurrency(Math.abs(totalAmount), currency)}
        </p>
      </div>
    </button>
  )
}

// Utility function to group transactions by month
export function groupTransactionsByMonth<T extends { transactionDate: string; amount: number; type: string }>(
  transactions: T[],
  locale: string = 'de-CH'
): Map<string, { transactions: T[]; total: number; month: string; year: number }> {
  const groups = new Map<string, { transactions: T[]; total: number; month: string; year: number }>()
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.transactionDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString(locale, { month: 'long' })
    const year = date.getFullYear()
    
    if (!groups.has(monthKey)) {
      groups.set(monthKey, {
        transactions: [],
        total: 0,
        month: monthName,
        year,
      })
    }
    
    const group = groups.get(monthKey)!
    group.transactions.push(transaction)
    
    // Calculate total (expenses are negative, income is positive)
    const amount = Number(transaction.amount)
    if (transaction.type === 'income') {
      group.total += amount
    } else {
      group.total -= amount
    }
  })
  
  // Sort each group's transactions by date (newest first)
  groups.forEach(group => {
    group.transactions.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )
  })
  
  // Sort groups by date (newest first)
  const sortedEntries = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  const sortedGroups = new Map<string, { transactions: T[]; total: number; month: string; year: number }>(sortedEntries)
  
  return sortedGroups
}
