"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import MobileMoreMenu from "./mobile-more-menu"

interface NavItem {
  href: string
  label: string
  labelKey: 'dashboard' | 'invest' | 'crypto' | 'reports'
  matchPaths?: string[]
}

// FinFlow Navigation: Start, Investieren, Krypto, Berichte, Mehr
const navItems: NavItem[] = [
  { 
    href: "/dashboard", 
    label: "Start",
    labelKey: "dashboard",
    matchPaths: ["/dashboard", "/accounts", "/transactions", "/categories", "/budgets", "/recurring"]
  },
  { 
    href: "/invest", 
    label: "Investieren",
    labelKey: "invest",
    matchPaths: ["/invest", "/markets", "/robo-advisor", "/trading-agent", "/stock-trading-agent", "/trading-history", "/trading-performance", "/price-alerts", "/backtesting", "/risk-analysis"]
  },
  { 
    href: "/crypto", 
    label: "Krypto",
    labelKey: "crypto",
    matchPaths: ["/crypto"]
  },
  { 
    href: "/reports", 
    label: "Berichte",
    labelKey: "reports",
    matchPaths: ["/reports", "/analytics"]
  },
]

// Modern SVG Icons with gradients
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <>
        <path d="M3 10.5L12 3L21 10.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10.5Z" fill="url(#homeGradient)" stroke="url(#homeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="homeGradient" x1="3" y1="3" x2="21" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6"/>
            <stop offset="1" stopColor="#8B5CF6"/>
          </linearGradient>
        </defs>
      </>
    ) : (
      <path d="M3 10.5L12 3L21 10.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10.5Z M9 22V12H15V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
)

const InvestIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <>
        <rect x="2" y="3" width="20" height="18" rx="3" fill="url(#investGradient)"/>
        <path d="M6 16L10 12L14 14L18 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="18" cy="8" r="2" fill="white"/>
        <defs>
          <linearGradient id="investGradient" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981"/>
            <stop offset="1" stopColor="#3B82F6"/>
          </linearGradient>
        </defs>
      </>
    ) : (
      <>
        <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 16L10 12L14 14L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    )}
  </svg>
)

const CryptoIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <>
        <circle cx="12" cy="12" r="10" fill="url(#cryptoGradient)"/>
        <path d="M9.5 8C9.5 8 10 7 12 7C14 7 15 8.5 15 9.5C15 11 13 11.5 12 11.5C11 11.5 9 12 9 14C9 15.5 10.5 17 12 17C13.5 17 14.5 16 14.5 16M12 5.5V7M12 17V18.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="cryptoGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B"/>
            <stop offset="1" stopColor="#EF4444"/>
          </linearGradient>
        </defs>
      </>
    ) : (
      <>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9.5 8C9.5 8 10 7 12 7C14 7 15 8.5 15 9.5C15 11 13 11.5 12 11.5C11 11.5 9 12 9 14C9 15.5 10.5 17 12 17C13.5 17 14.5 16 14.5 16M12 5.5V7M12 17V18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    )}
  </svg>
)

const ReportsIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <>
        <path d="M21 21H4C3.44772 21 3 20.5523 3 20V3" stroke="url(#reportsStroke)" strokeWidth="2" strokeLinecap="round"/>
        <rect x="6" y="13" width="4" height="7" rx="1" fill="url(#reportsGradient1)"/>
        <rect x="11" y="9" width="4" height="11" rx="1" fill="url(#reportsGradient2)"/>
        <rect x="16" y="5" width="4" height="15" rx="1" fill="url(#reportsGradient3)"/>
        <defs>
          <linearGradient id="reportsStroke" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6"/>
            <stop offset="1" stopColor="#EC4899"/>
          </linearGradient>
          <linearGradient id="reportsGradient1" x1="6" y1="13" x2="10" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6"/>
            <stop offset="1" stopColor="#A855F7"/>
          </linearGradient>
          <linearGradient id="reportsGradient2" x1="11" y1="9" x2="15" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A855F7"/>
            <stop offset="1" stopColor="#D946EF"/>
          </linearGradient>
          <linearGradient id="reportsGradient3" x1="16" y1="5" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D946EF"/>
            <stop offset="1" stopColor="#EC4899"/>
          </linearGradient>
        </defs>
      </>
    ) : (
      <>
        <path d="M21 21H4C3.44772 21 3 20.5523 3 20V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="6" y="13" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="9" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="16" y="5" width="4" height="15" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </>
    )}
  </svg>
)

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const iconComponents = {
  dashboard: HomeIcon,
  invest: InvestIcon,
  crypto: CryptoIcon,
  reports: ReportsIcon,
}

interface MobileBottomNavProps {
  onMenuClick?: () => void
  fixed?: boolean
}

export default function MobileBottomNav({ onMenuClick, fixed = false }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
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
      "lg:hidden w-full max-w-full z-50 overflow-hidden",
      fixed && "fixed bottom-0 left-0 right-0"
    )}>
      {/* Modern Glass Navigation Bar */}
      <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-[70px] px-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const active = isActive(item)
            const IconComponent = iconComponents[item.labelKey]
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200",
                  active 
                    ? "text-white" 
                    : "text-gray-500 active:scale-95"
                )}
              >
                {/* Active background glow */}
                {active && (
                  <div className="absolute inset-0 bg-white/5 rounded-2xl" />
                )}
                
                <div className="relative z-10 transition-transform duration-200">
                  <IconComponent active={active} />
                </div>
                
                <span className={cn(
                  "text-[10px] font-medium relative z-10",
                  active ? "text-white" : "text-gray-500"
                )}>
                  {t(item.labelKey as any) || item.label}
                </span>
                
                {/* Active indicator line */}
                {active && (
                  <div className="absolute -bottom-0.5 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                )}
              </Link>
            )
          })}
          
          {/* Menu button */}
          <button
            onClick={handleMenuClick}
            className="relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200 text-gray-500 active:scale-95"
          >
            <MoreIcon />
            <span className="text-[10px] font-medium text-gray-500">
              {t('more')}
            </span>
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
