"use client"

import { ReactNode, useRef, useEffect } from 'react'
import { useKeyboard } from '@/hooks/use-keyboard'
import { cn } from '@/lib/utils'

interface KeyboardAwareViewProps {
  children: ReactNode
  className?: string
  /** Enable auto-scroll to focused input */
  autoScroll?: boolean
  /** Extra bottom padding when keyboard is hidden (e.g., for bottom nav) */
  baseBottomPadding?: number
}

/**
 * A wrapper component that automatically adjusts its padding
 * when the iOS keyboard appears/disappears.
 * 
 * Use this for any page or modal with form inputs.
 */
export function KeyboardAwareView({
  children,
  className,
  autoScroll = true,
  baseBottomPadding = 0,
}: KeyboardAwareViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const keyboard = useKeyboard({ autoScroll })

  return (
    <div
      ref={containerRef}
      className={cn("transition-all duration-200 ease-out", className)}
      style={{
        paddingBottom: keyboard.height > 0 
          ? `${keyboard.height}px` 
          : baseBottomPadding > 0 
            ? `${baseBottomPadding}px` 
            : undefined,
      }}
    >
      {children}
    </div>
  )
}

/**
 * A wrapper specifically for bottom sheets/modals with forms
 * Handles the sheet scrolling when keyboard appears
 */
interface KeyboardAwareSheetProps {
  children: ReactNode
  className?: string
  isOpen: boolean
  onClose: () => void
}

export function KeyboardAwareSheet({
  children,
  className,
  isOpen,
  onClose,
}: KeyboardAwareSheetProps) {
  const keyboard = useKeyboard()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Scroll sheet content when keyboard appears
  useEffect(() => {
    if (keyboard.isVisible && sheetRef.current) {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
  }, [keyboard.isVisible])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div 
        ref={sheetRef}
        className={cn(
          "absolute left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl",
          "overflow-y-auto animate-slide-up",
          "transition-all duration-200 ease-out",
          className
        )}
        style={{
          bottom: 0,
          maxHeight: keyboard.isVisible 
            ? `calc(100vh - ${keyboard.height}px - env(safe-area-inset-top))` 
            : '90vh',
          paddingBottom: keyboard.isVisible 
            ? `${keyboard.height}px` 
            : 'env(safe-area-inset-bottom)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default KeyboardAwareView
