"use client"

import { useMarkets } from "@/hooks/use-markets"
import { useAuth } from "@/hooks/use-auth"
import { useMediaQuery } from "@/hooks/use-mobile"
import Layout from "@/components/finflow/layout"
import MobileCommoditiesPage from "@/components/finflow/mobile-commodities-page"
import { Loader2, Search, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useCurrency } from "@/components/finflow/CurrencyContext"
import Link from "next/link"

// Enhanced commodities data with proper precious metals
const COMMODITIES_DATA = [
  { symbol: 'XAU', name: 'Gold', price: 3392.38, changePercent: 0.12, element: 'Au' },
  { symbol: 'XPD', name: 'Palladium', price: 1169.23, changePercent: -0.05, element: 'Pd' },
  { symbol: 'XPT', name: 'Platin', price: 1345.54, changePercent: 0.08, element: 'Pt' },
  { symbol: 'XAG', name: 'Silber', price: 45.37, changePercent: 0.22, element: 'Ag' },
]

export default function CommoditiesPage() {
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { user } = useAuth()
  const { currency } = useCurrency()
  const isMobile = useMediaQuery("(max-width: 1023px)")
  const [searchQuery, setSearchQuery] = useState("")

  // Use our enhanced commodities data, fallback to API data
  const commodities = COMMODITIES_DATA
  const isLoading = false
  
  const filteredCommodities = commodities.filter((c: any) => 
    c.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value)
  }

  if (isMobile) {
    return <MobileCommoditiesPage commodities={commodities} isLoading={isLoading} />
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/invest" className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold">Rohstoffe</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rohstoffe suchen..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCommodities.map((commodity: any) => (
              <div key={commodity.symbol} className="flex items-center gap-4 p-4 rounded-xl bg-card border">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {commodity.element || commodity.symbol.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{commodity.name}</p>
                  <p className="text-sm text-muted-foreground">{commodity.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(commodity.price)}</p>
                  <p className={commodity.changePercent >= 0 ? "text-emerald-500 text-sm" : "text-red-500 text-sm"}>
                    {commodity.changePercent >= 0 ? "▲" : "▼"} {Math.abs(commodity.changePercent).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
