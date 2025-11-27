"use client"

import type { ReactNode } from "react"
import Sidebar from "./sidebar"
import TopNav from "./top-nav"
import MobileHeader from "./mobile-header"
import MobileBottomNav from "./mobile-bottom-nav"
import MobileMenu from "./mobile-menu"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { CurrencyProvider } from './CurrencyContext'

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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <CurrencyProvider>
      <div className={`flex h-screen ${theme === "dark" ? "dark" : ""}`}>
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block">
          <Sidebar user={user} />
        </div>
        
        <div className="w-full flex flex-1 flex-col min-w-0">
          {/* Desktop Header - Hidden on Mobile */}
          <header className="hidden lg:block h-16 border-b border-gray-200 dark:border-[#232e40]">
            <TopNav user={user} />
          </header>

          {/* Mobile Header - Hidden on Desktop */}
          <MobileHeader user={user} />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0e17] pb-20 lg:pb-0">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation - Hidden on Desktop */}
          <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />

          {/* Mobile Menu Drawer */}
          <MobileMenu 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)}
            user={user}
          />
        </div>
      </div>
    </CurrencyProvider>
  )
}
