"use client"

import { useAuth } from "@/hooks/use-auth"
import { useMediaQuery } from "@/hooks/use-mobile"
import Layout from "@/components/finflow/layout"
import MobileRoboAdvisor from "@/components/finflow/mobile-robo-advisor"

export default function RoboAdvisorPage() {
  const { user } = useAuth()
  const isMobile = useMediaQuery("(max-width: 1023px)")

  if (isMobile) {
    return <MobileRoboAdvisor />
  }

  // Desktop version
  return (
    <Layout user={user}>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Robo-Advisor</h1>
        <p className="text-muted-foreground">Desktop-Version in Entwicklung. Bitte verwenden Sie die Mobile-App.</p>
      </div>
    </Layout>
  )
}
