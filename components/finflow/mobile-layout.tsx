"use client"

import { ReactNode } from "react"
import MobileBottomNav from "./mobile-bottom-nav"
import { cn } from "@/lib/utils"

interface MobileLayoutProps {
  /** The page header component - will be fixed at top */
  header?: ReactNode
  /** The main content - will be scrollable */
  children: ReactNode
  /** Additional className for the content area */
  contentClassName?: string
  /** Hide bottom navigation */
  hideNav?: boolean
  /** Custom bottom nav handler */
  onMenuClick?: () => void
  /** Background color class */
  bgClassName?: string
}

/**
 * MobileLayout - Wrapper component for mobile pages
 * 
 * Structure:
 * - Fixed header at top (with safe area)
 * - Scrollable content in middle
 * - Fixed bottom navigation (with safe area)
 * 
 * This ensures the header and nav stay fixed while
 * only the content scrolls, like modern mobile apps.
 */
export default function MobileLayout({
  header,
  children,
  contentClassName,
  hideNav = false,
  onMenuClick,
  bgClassName = "bg-white dark:bg-[#0a0a0a]"
}: MobileLayoutProps) {
  return (
    <div className={cn(
      "min-h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden",
      bgClassName
    )}>
      {/* Fixed Header */}
      {header && (
        <div className="flex-shrink-0 sticky top-0 z-40">
          {header}
        </div>
      )}

      {/* Scrollable Content */}
      <main 
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          "overscroll-contain",
          "-webkit-overflow-scrolling-touch",
          !hideNav && "pb-20", // Add padding for bottom nav
          contentClassName
        )}
      >
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      {!hideNav && (
        <div className="flex-shrink-0 sticky bottom-0 z-50">
          <MobileBottomNav onMenuClick={onMenuClick} />
        </div>
      )}
    </div>
  )
}
