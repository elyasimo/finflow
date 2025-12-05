"use client"

import type { ReactNode } from "react"
import Sidebar from "./sidebar"
import TopNav from "./top-nav"
import MobileBottomNav from "./mobile-bottom-nav"
import MobileMoreMenu from "./mobile-more-menu"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { CurrencyProvider } from './CurrencyContext'
import { useMediaQuery } from "@/hooks/use-mobile"

// User interface
interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface LayoutProps {
  children: ReactNode;
  user?: User;
}

export default function Layout({ children, user }: LayoutProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 1023px)")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0e17]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Mobile Layout - Fixed structure with scrollable content
  if (isMobile) {
    return (
      <CurrencyProvider>
        <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-[#0a0e17] overflow-hidden">
          {/* Scrollable Content Area */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain -webkit-overflow-scrolling-touch">
            {children}
          </main>

          {/* Fixed Bottom Navigation */}
          <div className="flex-shrink-0 z-50">
            <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
          </div>

          {/* Mobile More Menu */}
          <MobileMoreMenu 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)}
          />
        </div>
      </CurrencyProvider>
    )
  }

  // Desktop Layout
  return (
    <CurrencyProvider>
      <div className={`flex h-screen ${theme === "dark" ? "dark" : ""}`}>
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar user={user} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="hidden lg:block h-16 flex-shrink-0 border-b border-gray-200 dark:border-[#232e40]">
            <TopNav user={user} />
          </header>
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-[#0a0e17]">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </CurrencyProvider>
  )
}
