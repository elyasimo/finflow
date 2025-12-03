"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  X, 
  Home,
  CreditCard,
  Wallet,
  PiggyBank,
  Tags,
  TrendingUp,
  Bot,
  LineChart,
  History,
  Award,
  Bell,
  Activity,
  Shield,
  BarChart2,
  PieChart,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useAuth } from "@/hooks/use-auth"
import { FinflowLogo } from "@/components/icons/finflow-logo"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  user?: {
    id: string
    email: string
    fullName?: string
  }
}

// Quick access items (most used)
const quickAccessItems = [
  { href: "/dashboard", icon: Home, labelKey: "dashboard", color: "bg-blue-500" },
  { href: "/transactions", icon: Wallet, labelKey: "transactions", color: "bg-green-500" },
  { href: "/budgets", icon: PiggyBank, labelKey: "budgets", color: "bg-purple-500" },
  { href: "/markets", icon: TrendingUp, labelKey: "markets", color: "bg-orange-500" },
]

// All menu items grouped by category
const menuGroups = [
  {
    titleKey: "finance",
    items: [
      { href: "/accounts", icon: CreditCard, labelKey: "accounts" },
      { href: "/transactions", icon: Wallet, labelKey: "transactions" },
      { href: "/budgets", icon: PiggyBank, labelKey: "budgets" },
      { href: "/categories", icon: Tags, labelKey: "categories" },
    ]
  },
  {
    titleKey: "trading",
    items: [
      { href: "/markets", icon: TrendingUp, labelKey: "markets" },
      { href: "/robo-advisor", icon: Bot, labelKey: "roboAdvisor" },
    ]
  },
  {
    titleKey: "analytics",
    items: [
      { href: "/reports", icon: PieChart, labelKey: "reports" },
      { href: "/analytics", icon: BarChart2, labelKey: "analytics" },
      { href: "/trading-history", icon: History, labelKey: "tradingHistory" },
      { href: "/trading-performance", icon: Award, labelKey: "tradingPerformance" },
      { href: "/backtesting", icon: Activity, labelKey: "backtesting" },
      { href: "/risk-analysis", icon: Shield, labelKey: "riskAnalysis" },
    ]
  },
  {
    titleKey: "settings",
    items: [
      { href: "/settings", icon: Settings, labelKey: "settings" },
      { href: "/support", icon: HelpCircle, labelKey: "support" },
    ]
  }
]

export default function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
        onClick={onClose}
      />

      {/* Menu Panel - Slide from Right */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-[90%] max-w-sm bg-white dark:bg-[#0f1623] z-[101] lg:hidden",
        "transform transition-transform duration-300 ease-out",
        "shadow-2xl flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#232e40]">
          <FinflowLogo size="sm" variant="full" />
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#232e40] transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* User Info - Compact */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#232e40]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.fullName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Access - Icon Grid */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#232e40]">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            {t('quickAccess' as any) || 'Schnellzugriff'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {quickAccessItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    isActive 
                      ? item.color + " shadow-lg" 
                      : "bg-gray-100 dark:bg-[#1a2332]"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6",
                      isActive ? "text-white" : "text-gray-600 dark:text-gray-300"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium text-center",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {t(item.labelKey as any)}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Menu Groups - Scrollable */}
        <div className="flex-1 overflow-y-auto py-2">
          {menuGroups.map((group, idx) => (
            <div key={group.titleKey} className={cn(idx > 0 && "mt-2")}>
              <div className="px-4 py-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t(group.titleKey as any)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 px-3">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all active:scale-95",
                        isActive 
                          ? "bg-blue-50 dark:bg-blue-900/20" 
                          : "hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        isActive 
                          ? "bg-blue-500" 
                          : "bg-gray-100 dark:bg-[#232e40]"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                        )} />
                      </div>
                      <span className={cn(
                        "text-xs font-medium truncate",
                        isActive 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-700 dark:text-gray-300"
                      )}>
                        {t(item.labelKey as any)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-[#232e40] safe-area-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium transition-all active:scale-95 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </>
  )
}
