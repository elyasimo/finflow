"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  BarChart3, 
  Bitcoin,
  PieChart,
  Menu as MenuIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useAuth } from "@/hooks/use-auth"
import MobileMoreMenu from "./mobile-more-menu"

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  labelKey: 'dashboard' | 'invest' | 'crypto' | 'reports'
  matchPaths?: string[]
}

// FinFlow Navigation: Start, Investieren, Krypto, Berichte, Mehr
const navItems: NavItem[] = [
  { 
    href: "/dashboard", 
    icon: Home, 
    label: "Start",
    labelKey: "dashboard",
    matchPaths: ["/dashboard", "/accounts", "/transactions", "/categories", "/budgets", "/recurring"]
  },
  { 
    href: "/invest", 
    icon: BarChart3, 
    label: "Investieren",
    labelKey: "invest",
    matchPaths: ["/invest", "/markets", "/robo-advisor", "/trading-agent", "/stock-trading-agent", "/trading-history", "/trading-performance", "/price-alerts", "/backtesting", "/risk-analysis"]
  },
  { 
    href: "/crypto", 
    icon: Bitcoin, 
    label: "Krypto",
    labelKey: "crypto",
    matchPaths: ["/crypto"]
  },
  { 
    href: "/reports", 
    icon: PieChart, 
    label: "Berichte",
    labelKey: "reports",
    matchPaths: ["/reports", "/analytics"]
  },
]

interface MobileBottomNavProps {
  onMenuClick?: () => void
  /** Use fixed positioning (for pages not using the main layout) */
  fixed?: boolean
}

export default function MobileBottomNav({ onMenuClick, fixed = false }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { t, language, isLoaded } = useLanguage()
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
    <nav className={cn(
      "lg:hidden w-full z-50",
      fixed && "fixed bottom-0 left-0 right-0"
    )}>
      {/* Navigation bar - Dark Style */}
      <div className="bg-[#121212] border-t border-[#2a2a2a] safe-area-pb">
        <div className="flex items-stretch justify-around h-16 px-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[64px] px-1 transition-all active:scale-95",
                  active 
                    ? "text-white" 
                    : "text-gray-500"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-medium leading-tight",
                  active && "font-semibold"
                )}>
                  {t(item.labelKey as any) || item.label}
                </span>
              </Link>
            )
          })}
          
          {/* Menu button */}
          <button
            onClick={handleMenuClick}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[64px] px-1 transition-all active:scale-95",
              "text-gray-500"
            )}
          >
            <MenuIcon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">{t('more')}</span>
          </button>
        </div>
      </div>

      {/* Mobile More Menu */}
      {!onMenuClick && (
        <MobileMoreMenu 
          isOpen={showMenu} 
          onClose={() => setShowMenu(false)}
        />
      )}
    </nav>
  )
}
