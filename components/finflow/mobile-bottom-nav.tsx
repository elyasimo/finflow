"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  PieChart,
  Menu as MenuIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface NavItem {
  href: string
  icon: React.ElementType
  labelKey: string
  matchPaths?: string[]
}

const navItems: NavItem[] = [
  { 
    href: "/dashboard", 
    icon: Home, 
    labelKey: "dashboard",
    matchPaths: ["/dashboard"]
  },
  { 
    href: "/accounts", 
    icon: CreditCard, 
    labelKey: "accounts",
    matchPaths: ["/accounts", "/transactions", "/categories"]
  },
  { 
    href: "/markets", 
    icon: TrendingUp, 
    labelKey: "markets",
    matchPaths: ["/markets", "/trading-agent", "/stock-trading-agent", "/trading-history", "/trading-performance", "/price-alerts", "/backtesting", "/risk-analysis", "/crypto"]
  },
  { 
    href: "/reports", 
    icon: PieChart, 
    labelKey: "reports",
    matchPaths: ["/reports", "/analytics", "/budgets"]
  },
  { 
    href: "#menu", 
    icon: MenuIcon, 
    labelKey: "more",
    matchPaths: ["/settings", "/support"]
  },
]

interface MobileBottomNavProps {
  onMenuClick?: () => void
}

export default function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some(path => pathname.startsWith(path))
    }
    return pathname === item.href
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0f1623] border-t border-gray-200 dark:border-[#232e40] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          
          if (item.href === "#menu") {
            return (
              <button
                key={item.href}
                onClick={onMenuClick}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors",
                  active 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 mb-1",
                  active && "text-blue-600 dark:text-blue-400"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  active && "text-blue-600 dark:text-blue-400"
                )}>
                  {t(item.labelKey as any)}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors",
                active 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <div className={cn(
                "relative",
                active && "after:absolute after:-top-2 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-1 after:bg-blue-600 after:dark:bg-blue-400 after:rounded-full"
              )}>
                <Icon className={cn(
                  "h-5 w-5 mb-1",
                  active && "text-blue-600 dark:text-blue-400"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active && "text-blue-600 dark:text-blue-400"
              )}>
                {t(item.labelKey as any)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
