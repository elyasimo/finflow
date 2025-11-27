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
  ChevronRight
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

interface MenuSection {
  title: string
  items: {
    href: string
    icon: React.ElementType
    labelKey: string
  }[]
}

const menuSections: MenuSection[] = [
  {
    title: "overview",
    items: [
      { href: "/dashboard", icon: Home, labelKey: "dashboard" },
      { href: "/reports", icon: PieChart, labelKey: "reports" },
      { href: "/analytics", icon: BarChart2, labelKey: "analytics" },
    ]
  },
  {
    title: "finance",
    items: [
      { href: "/accounts", icon: CreditCard, labelKey: "accounts" },
      { href: "/transactions", icon: Wallet, labelKey: "transactions" },
      { href: "/budgets", icon: PiggyBank, labelKey: "budgets" },
      { href: "/categories", icon: Tags, labelKey: "categories" },
    ]
  },
  {
    title: "markets",
    items: [
      { href: "/markets", icon: TrendingUp, labelKey: "markets" },
      { href: "/trading-agent", icon: Bot, labelKey: "tradingAgent" },
      { href: "/stock-trading-agent", icon: LineChart, labelKey: "stockTradingAgent" },
      { href: "/trading-history", icon: History, labelKey: "tradingHistory" },
      { href: "/trading-performance", icon: Award, labelKey: "tradingPerformance" },
      { href: "/price-alerts", icon: Bell, labelKey: "priceAlerts" },
      { href: "/backtesting", icon: Activity, labelKey: "backtesting" },
      { href: "/risk-analysis", icon: Shield, labelKey: "riskAnalysis" },
    ]
  },
  {
    title: "settings",
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
        "fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white dark:bg-[#0f1623] z-[101] lg:hidden",
        "transform transition-transform duration-300 ease-out",
        "shadow-2xl",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-[#232e40]">
          <FinflowLogo size="sm" variant="full" />
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a2332] transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-[#232e40]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
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

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuSections.map((section, idx) => (
            <div key={section.title} className={cn(idx > 0 && "mt-6")}>
              <div className="px-4 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t(section.title as any)}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        isActive 
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2332]"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                      )} />
                      <span className="flex-1 text-sm font-medium">
                        {t(item.labelKey as any)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-[#232e40] safe-area-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </>
  )
}
