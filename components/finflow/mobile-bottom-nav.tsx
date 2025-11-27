"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  PieChart,
  Menu as MenuIcon,
  Plus
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient shadow overlay */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-white dark:from-[#0f1623] to-transparent pointer-events-none" />
      
      {/* Navigation bar */}
      <div className="bg-white/90 dark:bg-[#0f1623]/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-[#232e40]/50 pb-safe">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item)
            
            // Center FAB button
            if (index === 2) {
              return (
                <div key="fab" className="flex items-center gap-4">
                  {/* Markets Button */}
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center w-14 h-12 transition-all",
                      active 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 mb-0.5 transition-transform",
                      active && "scale-110"
                    )} />
                    <span className={cn(
                      "text-[10px] font-medium",
                      active && "font-semibold"
                    )}>
                      {t(item.labelKey as any)}
                    </span>
                  </Link>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-12 transition-all",
                  active 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-400 dark:text-gray-500"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 mb-0.5 transition-transform",
                  active && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  active && "font-semibold"
                )}>
                  {t(item.labelKey as any)}
                </span>
              </Link>
            )
          })}
          
          {/* Menu button */}
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center w-14 h-12 text-gray-400 dark:text-gray-500 transition-all"
          >
            <MenuIcon className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-medium">{t('more')}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
