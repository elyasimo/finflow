"use client"

import { useParams } from "next/navigation"
import MobileCryptoDetail from "@/components/finflow/mobile-crypto-detail"

export default function CryptoDetailPage() {
  const params = useParams()
  const symbol = params.symbol as string
  
  return <MobileCryptoDetail symbol={symbol} />
}
