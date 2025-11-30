"use client"

import { useAuth } from "@/hooks/use-auth"
import { useMediaQuery } from "@/hooks/use-mobile"
import Layout from "@/components/finflow/layout"
import MobileETFPage from "@/components/finflow/mobile-etf-page"
import { Loader2, Search, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useCurrency } from "@/components/finflow/CurrencyContext"
import Link from "next/link"

// Popular ETFs data
const POPULAR_ETFS = [
  { symbol: 'VUAA', name: 'Vanguard S&P 500 UCITS ETF', price: 92.45, changePercent: 0.35, issuer: 'vanguard' },
  { symbol: 'IS3C', name: 'iShares Core MSCI World UCITS ETF', price: 84.23, changePercent: 0.60, issuer: 'ishares' },
  { symbol: 'IUSU', name: 'iShares Core S&P 500 UCITS ETF', price: 45.67, changePercent: -0.07, issuer: 'ishares' },
  { symbol: 'EXW1', name: 'iShares MSCI World EUR Hedged', price: 62.34, changePercent: 0.33, issuer: 'ishares' },
  { symbol: 'DBXJ', name: 'Xtrackers MSCI Japan UCITS ETF', price: 58.92, changePercent: 0.30, issuer: 'xtrackers' },
  { symbol: 'IBCD', name: 'iShares $ Corp Bond UCITS ETF', price: 119.45, changePercent: -0.31, issuer: 'ishares' },
  { symbol: 'VWCE', name: 'Vanguard FTSE All-World UCITS ETF', price: 112.89, changePercent: 0.42, issuer: 'vanguard' },
  { symbol: 'CSPX', name: 'iShares Core S&P 500 UCITS ETF', price: 523.45, changePercent: 0.55, issuer: 'ishares' },
  { symbol: 'EUNL', name: 'iShares Core MSCI Europe UCITS ETF', price: 71.23, changePercent: 0.28, issuer: 'ishares' },
  { symbol: 'IWDA', name: 'iShares Core MSCI World UCITS ETF', price: 89.67, changePercent: 0.45, issuer: 'ishares' },
  { symbol: 'VUSA', name: 'Vanguard S&P 500 UCITS ETF', price: 78.34, changePercent: 0.38, issuer: 'vanguard' },
  { symbol: 'SXRV', name: 'iShares Nasdaq 100 UCITS ETF', price: 812.45, changePercent: 0.72, issuer: 'ishares' },
]

export default function ETFPage() {
  const { user } = useAuth()
  const { currency } = useCurrency()
  const isMobile = useMediaQuery("(max-width: 1023px)")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const etfs = POPULAR_ETFS
  
  const filteredETFs = etfs.filter((etf: any) => 
    etf.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    etf.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value)
  }

  if (isMobile) {
    return <MobileETFPage etfs={etfs} isLoading={isLoading} />
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/invest" className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold">ETF</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ETF suchen..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredETFs.map((etf: any) => (
              <div key={etf.symbol} className="flex items-center gap-4 p-4 rounded-xl bg-card border">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                  <img 
                    src={`https://logo.clearbit.com/${etf.issuer || 'ishares'}.com`}
                    alt={etf.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{etf.name}</p>
                  <p className="text-sm text-muted-foreground">{etf.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(etf.price)}</p>
                  <p className={etf.changePercent >= 0 ? "text-emerald-500 text-sm" : "text-red-500 text-sm"}>
                    {etf.changePercent >= 0 ? "▲" : "▼"} {Math.abs(etf.changePercent).toFixed(2)}%
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
