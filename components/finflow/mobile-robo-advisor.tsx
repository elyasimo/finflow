"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  ChevronRight, 
  TrendingUp, 
  Shield, 
  Target,
  Zap,
  BarChart3,
  Bot,
  Check,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface RiskProfile {
  id: string
  name: string
  description: string
  allocation: {
    stocks: number
    bonds: number
    crypto: number
    commodities: number
    cash: number
  }
  expectedReturn: string
  riskLevel: 'low' | 'medium' | 'high'
  color: string
}

const RISK_PROFILES: RiskProfile[] = [
  {
    id: 'conservative',
    name: 'Konservativ',
    description: 'Fokus auf Kapitalerhalt mit geringem Risiko',
    allocation: { stocks: 20, bonds: 50, crypto: 0, commodities: 10, cash: 20 },
    expectedReturn: '3-5%',
    riskLevel: 'low',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'balanced',
    name: 'Ausgewogen',
    description: 'Balance zwischen Wachstum und Sicherheit',
    allocation: { stocks: 40, bonds: 30, crypto: 5, commodities: 15, cash: 10 },
    expectedReturn: '5-8%',
    riskLevel: 'medium',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'growth',
    name: 'Wachstum',
    description: 'Langfristiges Vermögenswachstum',
    allocation: { stocks: 60, bonds: 15, crypto: 10, commodities: 10, cash: 5 },
    expectedReturn: '8-12%',
    riskLevel: 'medium',
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'aggressive',
    name: 'Aggressiv',
    description: 'Maximales Wachstum, höheres Risiko',
    allocation: { stocks: 70, bonds: 5, crypto: 15, commodities: 5, cash: 5 },
    expectedReturn: '12-20%',
    riskLevel: 'high',
    color: 'from-red-500 to-pink-500'
  }
]

const FEATURES = [
  {
    icon: Bot,
    title: 'Automatisiertes Portfolio',
    description: 'Der Robo-Advisor erstellt und verwaltet ein sorgsam ausgewähltes Portfolio für dich'
  },
  {
    icon: TrendingUp,
    title: 'Marktanpassung',
    description: 'Deine Investitionen werden überwacht und an die Marktentwicklung angepasst'
  },
  {
    icon: Shield,
    title: 'Risikomanagement',
    description: 'Automatisches Rebalancing hält dein Portfolio im gewünschten Risikobereich'
  },
  {
    icon: Target,
    title: 'Zielorientiert',
    description: 'Definiere deine Anlageziele und lass den Advisor den Rest erledigen'
  }
]

export default function MobileRoboAdvisor() {
  const router = useRouter()
  const { t } = useLanguage()
  const [step, setStep] = useState<'intro' | 'profile' | 'amount' | 'confirm'>('intro')
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStart = () => {
    setStep('profile')
  }

  const handleSelectProfile = (profile: RiskProfile) => {
    setSelectedProfile(profile)
    setStep('amount')
  }

  const handleConfirm = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setStep('confirm')
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden">
      {/* Intro Screen */}
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
          >
            {/* Close Button */}
            <header className="flex-shrink-0 pt-[env(safe-area-inset-top)]">
              <button 
                onClick={() => router.back()}
                className="p-4"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </header>

            {/* Hero Image */}
            <div className="flex-shrink-0 px-8 py-6">
              <div className="relative w-full aspect-square max-w-[280px] mx-auto">
                {/* Animated Robot Illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Outer ring */}
                    <motion.div 
                      className="w-48 h-48 rounded-full border-2 border-blue-500/20"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Inner robot sphere */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 shadow-2xl flex items-center justify-center overflow-hidden">
                      {/* Screen */}
                      <div className="w-20 h-20 rounded-full bg-black border-4 border-gray-600 flex items-center justify-center overflow-hidden">
                        <motion.div
                          className="w-full h-full flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <svg viewBox="0 0 100 40" className="w-16 h-8">
                            <motion.path
                              d="M 0 20 Q 25 10, 50 20 T 100 20"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                    {/* Orbiting elements */}
                    <motion.div
                      className="absolute w-4 h-4 rounded-full bg-blue-500"
                      style={{ top: '50%', left: '-8px' }}
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6">
              <h1 className="text-4xl font-bold text-white mb-4">
                Robo-Advisor
              </h1>
              
              <p className="text-gray-400 text-sm mb-2">
                Investition auf eigenes Risiko.
              </p>
              
              <p className="text-gray-300 mb-8">
                Erhalte eine finanzielle Orientierungshilfe zu einem Bruchteil des Preises einer Finanzberatung – teste automatisierte Portfolios noch heute.
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {FEATURES.slice(0, 2).map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1c1c1e] flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-white text-sm leading-relaxed pt-1">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
              <button
                onClick={handleStart}
                className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <BarChart3 className="w-5 h-5" />
                Investitionen automatisieren
              </button>
            </div>
          </motion.div>
        )}

        {/* Profile Selection */}
        {step === 'profile' && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
          >
            <header className="flex-shrink-0 pt-[env(safe-area-inset-top)]">
              <button 
                onClick={() => setStep('intro')}
                className="p-4"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </header>

            <div className="px-6 pb-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                Wähle dein Risikoprofil
              </h1>
              <p className="text-gray-400 mb-6">
                Basierend auf deiner Risikobereitschaft erstellen wir ein optimales Portfolio.
              </p>

              <div className="space-y-4">
                {RISK_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className="w-full p-4 rounded-2xl bg-[#1c1c1e] border border-[#2c2c2e] active:scale-[0.98] transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        "px-3 py-1 rounded-full bg-gradient-to-r text-white text-sm font-medium",
                        profile.color
                      )}>
                        {profile.name}
                      </div>
                      <span className="text-emerald-500 font-medium">{profile.expectedReturn} p.a.</span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4">{profile.description}</p>
                    
                    {/* Allocation Bar */}
                    <div className="h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${profile.allocation.stocks}%` }}
                      />
                      <div 
                        className="bg-emerald-500 h-full" 
                        style={{ width: `${profile.allocation.bonds}%` }}
                      />
                      <div 
                        className="bg-amber-500 h-full" 
                        style={{ width: `${profile.allocation.crypto}%` }}
                      />
                      <div 
                        className="bg-orange-500 h-full" 
                        style={{ width: `${profile.allocation.commodities}%` }}
                      />
                      <div 
                        className="bg-gray-500 h-full" 
                        style={{ width: `${profile.allocation.cash}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{profile.allocation.stocks}% Aktien</span>
                      <span>{profile.allocation.bonds}% Anleihen</span>
                      <span>{profile.allocation.crypto}% Krypto</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Amount Selection */}
        {step === 'amount' && selectedProfile && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed inset-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
          >
            <header className="flex-shrink-0 pt-[env(safe-area-inset-top)]">
              <button 
                onClick={() => setStep('profile')}
                className="p-4"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </header>

            <div className="flex-1 px-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                Investitionsbetrag
              </h1>
              <p className="text-gray-400 mb-8">
                Profil: <span className="text-white font-medium">{selectedProfile.name}</span>
              </p>

              {/* Initial Investment */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Erstanlage</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">CHF</span>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="1'000"
                    className="w-full pl-14 pr-4 py-4 rounded-xl bg-[#1c1c1e] text-white text-lg font-medium placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Monthly Investment */}
              <div className="mb-8">
                <label className="text-sm text-gray-400 mb-2 block">Monatliche Einzahlung (optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">CHF</span>
                  <input
                    type="number"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    placeholder="100"
                    className="w-full pl-14 pr-4 py-4 rounded-xl bg-[#1c1c1e] text-white text-lg font-medium placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Portfolio Preview */}
              <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-[#2c2c2e]">
                <h3 className="text-white font-medium mb-4">Portfolio-Aufteilung</h3>
                <div className="space-y-3">
                  {Object.entries(selectedProfile.allocation).map(([key, value]) => {
                    if (value === 0) return null
                    const labels: Record<string, string> = {
                      stocks: 'Aktien',
                      bonds: 'Anleihen',
                      crypto: 'Krypto',
                      commodities: 'Rohstoffe',
                      cash: 'Bargeld'
                    }
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-400">{labels[key]}</span>
                        <span className="text-white font-medium">{value}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
              <button
                onClick={handleConfirm}
                disabled={!investmentAmount || isProcessing}
                className={cn(
                  "w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all",
                  investmentAmount 
                    ? "bg-blue-500 text-white active:scale-[0.98]" 
                    : "bg-[#1c1c1e] text-gray-500"
                )}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                    Portfolio wird erstellt...
                  </>
                ) : (
                  <>
                    Portfolio erstellen
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Confirmation */}
        {step === 'confirm' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-6"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2 text-center">
              Portfolio erstellt!
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Dein automatisiertes Portfolio ist jetzt aktiv und wird kontinuierlich optimiert.
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-lg active:scale-[0.98] transition-transform"
            >
              Zum Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
