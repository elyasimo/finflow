"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface KeyboardState {
  isVisible: boolean
  height: number
}

interface UseKeyboardOptions {
  /** Callback when keyboard shows */
  onShow?: (height: number) => void
  /** Callback when keyboard hides */
  onHide?: () => void
  /** Auto-scroll to focused element */
  autoScroll?: boolean
}

/**
 * Global keyboard hook for iOS/Capacitor apps
 * Detects keyboard visibility and height using Capacitor Keyboard plugin events
 * Falls back to visualViewport API for web browsers
 */
export function useKeyboard(options: UseKeyboardOptions = {}) {
  const { onShow, onHide, autoScroll = true } = options
  const [keyboard, setKeyboard] = useState<KeyboardState>({ isVisible: false, height: 0 })
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  const scrollToFocusedElement = useCallback(() => {
    if (!autoScroll) return
    
    // Clear any pending scroll
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }, [autoScroll])

  useEffect(() => {
    // Capacitor Keyboard plugin events
    const handleKeyboardShow = (e: CustomEvent<{ keyboardHeight: number }>) => {
      const height = e.detail?.keyboardHeight || 300
      setKeyboard({ isVisible: true, height })
      onShow?.(height)
      scrollToFocusedElement()
    }
    
    const handleKeyboardHide = () => {
      setKeyboard({ isVisible: false, height: 0 })
      onHide?.()
    }

    // Capacitor Keyboard plugin fires these events
    window.addEventListener('keyboardWillShow', handleKeyboardShow as EventListener)
    window.addEventListener('keyboardDidShow', handleKeyboardShow as EventListener)
    window.addEventListener('keyboardWillHide', handleKeyboardHide)
    window.addEventListener('keyboardDidHide', handleKeyboardHide)
    
    // Fallback: visualViewport for browsers/PWA
    const handleViewportResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height
        if (heightDiff > 150) {
          // Keyboard is likely visible
          setKeyboard({ isVisible: true, height: heightDiff })
          onShow?.(heightDiff)
          scrollToFocusedElement()
        } else if (keyboard.isVisible) {
          // Keyboard just closed
          setKeyboard({ isVisible: false, height: 0 })
          onHide?.()
        }
      }
    }
    
    window.visualViewport?.addEventListener('resize', handleViewportResize)
    
    return () => {
      window.removeEventListener('keyboardWillShow', handleKeyboardShow as EventListener)
      window.removeEventListener('keyboardDidShow', handleKeyboardShow as EventListener)
      window.removeEventListener('keyboardWillHide', handleKeyboardHide)
      window.removeEventListener('keyboardDidHide', handleKeyboardHide)
      window.visualViewport?.removeEventListener('resize', handleViewportResize)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [onShow, onHide, scrollToFocusedElement, keyboard.isVisible])

  return keyboard
}

/**
 * CSS styles to apply when keyboard is visible
 * Use with a container that should adjust to keyboard
 */
export function getKeyboardAdjustStyles(keyboardHeight: number) {
  return {
    paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined,
    transition: 'padding-bottom 0.25s ease-out',
  }
}

/**
 * Hook that returns inline styles for keyboard-aware containers
 */
export function useKeyboardStyles() {
  const keyboard = useKeyboard()
  
  return {
    keyboard,
    containerStyle: {
      paddingBottom: keyboard.height > 0 ? `${keyboard.height}px` : undefined,
      transition: 'padding-bottom 0.25s ease-out',
    },
  }
}

export default useKeyboard
