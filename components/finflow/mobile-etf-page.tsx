"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "./CurrencyContext"
import Link from "next/link"

interface ETF {
  symbol: string
  name: string
  price: number
  changePercent: number
  issuer?: string
  category?: string
}

interface MobileETFPageProps {
  etfs: ETF[]
  isLoading: boolean
}

// ETF Issuer Logos mapping
const ETF_ISSUERS: Record<string, { logo: string; color: string }> = {
  'ishares': { logo: 'https://logo.clearbit.com/ishares.com', color: 'bg-emerald-500' },
  'vanguard': { logo: 'https://logo.clearbit.com/vanguard.com', color: 'bg-red-600' },
  'spdr': { logo: 'https://logo.clearbit.com/ssga.com', color: 'bg-yellow-500' },
  'invesco': { logo: 'https://logo.clearbit.com/invesco.com', color: 'bg-blue-600' },
  'amundi': { logo: 'https://logo.clearbit.com/amundi.com', color: 'bg-blue-500' },
  'xtrackers': { logo: 'https://logo.clearbit.com/dws.com', color: 'bg-blue-700' },
  'lyxor': { logo: 'https://logo.clearbit.com/lyxor.com', color: 'bg-orange-500' },
  'wisdomtree': { logo: 'https://logo.clearbit.com/wisdomtree.com', color: 'bg-green-600' },
  'axa': { logo: 'https://logo.clearbit.com/axa-im.com', color: 'bg-blue-800' },
}

function getIssuerFromName(name: string): string {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('ishares')) return 'ishares'
  if (lowerName.includes('vanguard') || lowerName.includes('vuaa')) return 'vanguard'
  if (lowerName.includes('spdr')) return 'spdr'
  if (lowerName.includes('invesco')) return 'invesco'
  if (lowerName.includes('amundi')) return 'amundi'
  if (lowerName.includes('xtrackers') || lowerName.includes('dbx')) return 'xtrackers'
  if (lowerName.includes('lyxor')) return 'lyxor'
  if (lowerName.includes('wisdomtree')) return 'wisdomtree'
  if (lowerName.includes('axa')) return 'axa'
  return 'ishares' // default
}

export default function MobileETFPage({ etfs, isLoading }: MobileETFPageProps) {
  const router = useRouter()
  const { currency } = useCurrency()
  const [searchQuery, setSearchQuery] = useState("")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value)
  }

  const filteredETFs = useMemo(() => {
    if (!searchQuery) return etfs
    const query = searchQuery.toLowerCase()
    return etfs.filter(e => 
      e.symbol?.toLowerCase().includes(query) ||
      e.name?.toLowerCase().includes(query)
    )
  }, [etfs, searchQuery])

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
        <div className="px-4 pb-4">
          <h1 className="text-3xl font-bold text-white">ETF</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1c1c1e]">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche"
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-24">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : (
          <div className="mx-4 rounded-2xl bg-[#1c1c1e] overflow-hidden">
            {filteredETFs.map((etf, index) => {
              const issuer = getIssuerFromName(etf.name)
              const issuerInfo = ETF_ISSUERS[issuer]
              
              return (
                <button
                  key={etf.symbol}
                  onClick={() => router.push(`/markets?symbol=${etf.symbol}`)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 active:bg-[#2c2c2e] transition-colors",
                    index !== filteredETFs.length - 1 && "border-b border-[#2c2c2e]"
                  )}
                >
                  {/* Logo */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                    <img 
                      src={issuerInfo?.logo || 'https://logo.clearbit.com/ishares.com'}
                      alt={issuer}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.className = `w-10 h-10 rounded-full ${issuerInfo?.color || 'bg-emerald-500'} flex items-center justify-center flex-shrink-0`
                          parent.innerHTML = `<span class="text-white font-bold text-sm">${etf.symbol.slice(0, 2)}</span>`
                        }
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white font-medium truncate">{etf.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">{etf.symbol}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#2c2c2e] text-gray-400 text-xs">€</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-medium">€ {etf.price?.toFixed(2)}</p>
                    <p className={cn(
                      "text-sm",
                      etf.changePercent >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {etf.changePercent >= 0 ? "▲" : "▼"} {Math.abs(etf.changePercent || 0).toFixed(2)}%
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
