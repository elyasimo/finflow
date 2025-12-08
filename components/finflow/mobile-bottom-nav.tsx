"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import MobileMoreMenu from "./mobile-more-menu"
import { cn } from "@/lib/utils"

// Navigation Items
const navItems = [
  { 
    href: "/dashboard", 
    labelKey: "dashboard" as const,
    matchPaths: ["/dashboard", "/accounts", "/transactions", "/categories", "/budgets", "/recurring"]
  },
  { 
    href: "/invest", 
    labelKey: "invest" as const,
    matchPaths: ["/invest", "/markets", "/robo-advisor", "/trading-agent", "/stock-trading-agent", "/trading-history", "/trading-performance", "/price-alerts", "/backtesting", "/risk-analysis"]
  },
  { 
    href: "/crypto", 
    labelKey: "crypto" as const,
    matchPaths: ["/crypto"]
  },
  { 
    href: "/reports", 
    labelKey: "reports" as const,
    matchPaths: ["/reports", "/analytics"]
  },
]

// Modern Icons
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <path d="M3 9.5L12 2L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z" fill="url(#home-grad)" />
    ) : (
      <path d="M3 9.5L12 2L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    )}
    <path d="M9 22V12H15V22" stroke={active ? "white" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <defs>
      <linearGradient id="home-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
)

const InvestIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" fill="url(#invest-grad)" />
        <path d="M6 15L10 11L14 13L18 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="8" r="1.5" fill="white" />
      </>
    ) : (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M6 15L10 11L14 13L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
    <defs>
      <linearGradient id="invest-grad" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
)

const CryptoIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <>
        <circle cx="12" cy="12" r="10" fill="url(#crypto-grad)" />
        <path d="M12 6V8M12 16V18M15.5 9C15.5 9 15 8 12 8C9 8 8.5 10 8.5 10.5C8.5 12 10 12.5 12 12.5C14 12.5 15.5 13 15.5 14.5C15.5 15 15 16 12 16C9 16 8.5 15 8.5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M12 6V8M12 16V18M15.5 9C15.5 9 15 8 12 8C9 8 8.5 10 8.5 10.5C8.5 12 10 12.5 12 12.5C14 12.5 15.5 13 15.5 14.5C15.5 15 15 16 12 16C9 16 8.5 15 8.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
    <defs>
      <linearGradient id="crypto-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
)

const ReportsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <>
        <rect x="6" y="10" width="4" height="10" rx="1" fill="url(#rep-grad-1)" />
        <rect x="10" y="6" width="4" height="14" rx="1" fill="url(#rep-grad-2)" />
        <rect x="14" y="3" width="4" height="17" rx="1" fill="url(#rep-grad-3)" />
      </>
    ) : (
      <>
        <rect x="6" y="10" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="10" y="6" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="14" y="3" width="4" height="17" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    )}
    <defs>
      <linearGradient id="rep-grad-1" x1="6" y1="10" x2="10" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id="rep-grad-2" x1="10" y1="6" x2="14" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#9333EA" />
      </linearGradient>
      <linearGradient id="rep-grad-3" x1="14" y1="3" x2="18" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C084FC" />
        <stop offset="1" stopColor="#A855F7" />
      </linearGradient>
    </defs>
  </svg>
)

const MoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
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

  const isActive = (item: typeof navItems[0]) => {
    return item.matchPaths?.some(path => pathname.startsWith(path)) || false
  }

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    } else {
      setShowMenu(true)
    }
  }

  return (
    <>
      <nav 
        className={cn(
          "lg:hidden w-full bg-white dark:bg-[#0f1623] border-t border-gray-100 dark:border-gray-800",
          fixed && "fixed bottom-0 left-0 right-0"
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 50,
        }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const active = isActive(item)
            const IconComponent = iconComponents[item.labelKey]
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px]"
              >
                <div className={`transition-transform ${active ? 'scale-110' : ''}`}>
                  <IconComponent active={active} />
                </div>
                <span className={`text-[10px] font-medium ${
                  active 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {t(item.labelKey) || item.labelKey}
                </span>
              </Link>
            )
          })}
          
          {/* More Button */}
          <button
            onClick={handleMenuClick}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] text-gray-500 dark:text-gray-400"
          >
            <MoreIcon />
            <span className="text-[10px] font-medium">
              {t('more') || 'Mehr'}
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu */}
      {!onMenuClick && (
        <MobileMoreMenu 
          isOpen={showMenu} 
          onClose={() => setShowMenu(false)}
        />
      )}
    </>
  )
}
