"use client"

// Navigation temporarily disabled - will be rebuilt
interface MobileBottomNavProps {
  onMenuClick?: () => void
  fixed?: boolean
}

export default function MobileBottomNav({ onMenuClick, fixed = false }: MobileBottomNavProps) {
  // Return null - nav is hidden until we rebuild it
  return null
}
