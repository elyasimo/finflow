"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useMediaQuery } from "@/hooks/use-mobile"
import Layout from "@/components/finflow/layout"
import MobileTradingAgentPage from "@/app/trading-agent/mobile/page"
import TradingAgentPage from "@/app/trading-agent/page"

export default function RoboAdvisorPage() {
  const { user } = useAuth()
  const isMobile = useMediaQuery("(max-width: 1023px)")
  const router = useRouter()

  // Redirect to use trading-agent functionality under robo-advisor name
  if (isMobile) {
    return <MobileTradingAgentPage />
  }

  // Desktop version - use trading agent desktop
  return <TradingAgentPage />
}
