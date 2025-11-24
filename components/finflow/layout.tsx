"use client"

import type { ReactNode } from "react"
import Sidebar from "./sidebar"
import TopNav from "./top-nav"
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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <CurrencyProvider>
      <div className={`flex h-screen ${theme === "dark" ? "dark" : ""}`}>
        <Sidebar user={user} />
        <div className="w-full flex flex-1 flex-col">
          <header className="h-16 border-b border-gray-200 dark:border-[#232e40]">
            <TopNav user={user} />
          </header>
          <main className="flex-1 overflow-auto p-6 bg-white dark:bg-[#17202e]">{children}</main>
        </div>
      </div>
    </CurrencyProvider>
  )
}
