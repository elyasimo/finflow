"use client"

import { ReactNode } from "react"
import { ChevronLeft, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-mobile"

interface MobilePageWrapperProps {
  children: ReactNode
  title: string
  subtitle?: string
  backHref?: string
  showAddButton?: boolean
  onAddClick?: () => void
  addButtonLabel?: string
  headerRight?: ReactNode
  className?: string
  // Desktop content - if provided, shows this on desktop instead
  desktopContent?: ReactNode
}

export default function MobilePageWrapper({
  children,
  title,
  subtitle,
  backHref = "/dashboard",
  showAddButton = false,
  onAddClick,
  addButtonLabel,
  headerRight,
  className,
  desktopContent,
}: MobilePageWrapperProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)")

  // On desktop, show desktop content if provided, otherwise wrap in container
  if (!isMobile) {
    if (desktopContent) {
      return <>{desktopContent}</>
    }
    return (
      <div className={cn("container mx-auto py-6", className)}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {(showAddButton || headerRight) && (
            <div className="flex items-center gap-2">
              {headerRight}
              {showAddButton && (
                <button
                  onClick={onAddClick}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {addButtonLabel || "Add"}
                </button>
              )}
            </div>
          )}
        </div>
        {children}
      </div>
    )
  }

  // Mobile view
  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-[#0f1419]", className)}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a2332]/80 backdrop-blur-xl border-b border-gray-100 dark:border-[#232e40]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400 active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {headerRight}
            {showAddButton && (
              <button
                onClick={onAddClick}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white active:scale-95 transition-transform shadow-lg shadow-blue-600/25"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-24">
        {children}
      </div>
    </div>
  )
}
