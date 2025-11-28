"use client"

import { useState } from "react"
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
import { useAuth } from "@/hooks/use-auth"
import MobileMenu from "./mobile-menu"

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
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    } else {
      setShowMenu(true)
    }
  }

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some(path => pathname.startsWith(path))
    }
    return pathname === item.href
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient shadow */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-white dark:from-[#0f1623] to-transparent pointer-events-none" />
      
      {/* Navigation bar - Larger touch targets */}
      <div className="bg-white/95 dark:bg-[#0f1623]/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-[#232e40]/50 safe-area-pb">
        <div className="flex items-stretch justify-around h-20 px-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 min-h-[72px] px-2 rounded-xl mx-0.5 transition-all active:scale-95",
                  active 
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <Icon className={cn(
                  "h-6 w-6 transition-transform",
                  active && "scale-110"
                )} />
                <span className={cn(
                  "text-[11px] font-medium leading-tight",
                  active && "font-semibold"
                )}>
                  {t(item.labelKey as any)}
                </span>
              </Link>
            )
          })}
          
          {/* Menu button */}
          <button
            onClick={handleMenuClick}
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[72px] px-2 rounded-xl mx-0.5 text-gray-500 dark:text-gray-400 transition-all active:scale-95"
          >
            <MenuIcon className="h-6 w-6" />
            <span className="text-[11px] font-medium leading-tight">{t('more')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu - Only shown when no external handler */}
      {!onMenuClick && (
        <MobileMenu 
          isOpen={showMenu} 
          onClose={() => setShowMenu(false)}
          user={user as any}
        />
      )}
    </nav>
  )
}
