"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "./CurrencyContext"

interface Commodity {
  symbol: string
  name: string
  price: number
  changePercent: number
}

interface MobileCommoditiesPageProps {
  commodities: Commodity[]
  isLoading: boolean
}

// Commodity display info
const COMMODITY_INFO: Record<string, { element: string; name: string; color: string; textColor: string }> = {
  'XAU': { element: 'Au', name: 'Gold', color: 'bg-amber-100', textColor: 'text-amber-700' },
  'XAG': { element: 'Ag', name: 'Silber', color: 'bg-gray-100', textColor: 'text-gray-600' },
  'XPT': { element: 'Pt', name: 'Platin', color: 'bg-gray-200', textColor: 'text-gray-700' },
  'XPD': { element: 'Pd', name: 'Palladium', color: 'bg-slate-200', textColor: 'text-slate-600' },
}

export default function MobileCommoditiesPage({ commodities, isLoading }: MobileCommoditiesPageProps) {
  const router = useRouter()
  const { currency } = useCurrency()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 4,
    }).format(Number.isFinite(value) ? value : 0)
  }

  // Default commodities if none provided
  const displayCommodities = commodities.length > 0 ? commodities : [
    { symbol: 'XAU', name: 'Gold', price: 3392.38, changePercent: 0 },
    { symbol: 'XPD', name: 'Palladium', price: 1169.23, changePercent: 0 },
    { symbol: 'XPT', name: 'Platin', price: 1345.54, changePercent: 0 },
    { symbol: 'XAG', name: 'Silber', price: 45.37, changePercent: 0 },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-4 px-4 h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Title */}
        <div className="px-4 pb-6">
          <h1 className="text-3xl font-bold text-white">Rohstoffe</h1>
        </div>
      </header>

      {/* Content */}
      <main className="pb-24">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : (
          <div className="mx-4 rounded-2xl bg-[#1c1c1e] overflow-hidden divide-y divide-[#2c2c2e]">
            {displayCommodities.map((commodity) => {
              const info = COMMODITY_INFO[commodity.symbol] || {
                element: commodity.symbol.slice(0, 2),
                name: commodity.name,
                color: 'bg-gray-200',
                textColor: 'text-gray-700'
              }
              
              return (
                <button
                  key={commodity.symbol}
                  className="w-full flex items-center gap-4 px-4 py-4 active:bg-[#2c2c2e] transition-colors cursor-default"
                >
                  {/* Element Symbol Circle */}
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    info.color
                  )}>
                    <span className={cn("font-bold text-lg", info.textColor)}>
                      {info.element}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium text-lg">{info.name}</p>
                    <p className="text-gray-400 text-sm">{commodity.symbol}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {formatCurrency(commodity.price)}
                    </p>
                    <p className={cn(
                      "text-sm",
                      commodity.changePercent > 0 ? "text-emerald-500" : 
                      commodity.changePercent < 0 ? "text-red-500" : "text-gray-400"
                    )}>
                      {commodity.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
