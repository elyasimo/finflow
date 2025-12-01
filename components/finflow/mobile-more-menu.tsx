"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  ChevronRight,
  CreditCard,
  Wallet,
  PiggyBank,
  Tags,
  TrendingUp,
  Bot,
  LineChart,
  History,
  Award,
  Bell,
  Activity,
  Shield,
  BarChart2,
  PieChart,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Globe,
  Coins,
  User,
  Smartphone,
  FileText,
  Building2,
  Fingerprint
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "next-themes"
import { useCurrency } from "./CurrencyContext"

interface MobileMoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

// Modern menu structure with icons and colors
const menuSections = [
  {
    id: "finance",
    titleKey: "finance",
    items: [
      { href: "/accounts", icon: CreditCard, labelKey: "accounts", color: "from-blue-500 to-blue-600" },
      { href: "/transactions", icon: Wallet, labelKey: "transactions", color: "from-green-500 to-green-600" },
      { href: "/budgets", icon: PiggyBank, labelKey: "budgets", color: "from-purple-500 to-purple-600" },
      { href: "/categories", icon: Tags, labelKey: "categories", color: "from-orange-500 to-orange-600" },
    ]
  },
  {
    id: "trading",
    titleKey: "trading",
    items: [
      { href: "/robo-advisor", icon: Bot, labelKey: "roboAdvisor", color: "from-cyan-500 to-cyan-600" },
      { href: "/stock-trading-agent", icon: LineChart, labelKey: "stockTradingAgent", color: "from-indigo-500 to-indigo-600" },
      { href: "/price-alerts", icon: Bell, labelKey: "priceAlerts", color: "from-red-500 to-red-600" },
    ]
  },
  {
    id: "analytics",
    titleKey: "analytics",
    items: [
      { href: "/reports", icon: PieChart, labelKey: "reports", color: "from-violet-500 to-violet-600" },
      { href: "/analytics", icon: BarChart2, labelKey: "analytics", color: "from-pink-500 to-pink-600" },
      { href: "/trading-history", icon: History, labelKey: "tradingHistory", color: "from-amber-500 to-amber-600" },
      { href: "/trading-performance", icon: Award, labelKey: "tradingPerformance", color: "from-emerald-500 to-emerald-600" },
      { href: "/backtesting", icon: Activity, labelKey: "backtesting", color: "from-sky-500 to-sky-600" },
      { href: "/risk-analysis", icon: Shield, labelKey: "riskAnalysis", color: "from-rose-500 to-rose-600" },
    ]
  },
]

// Settings items
const settingsItems = [
  { href: "/settings", icon: Settings, labelKey: "settings" },
  { href: "/support", icon: HelpCircle, labelKey: "support" },
]

export default function MobileMoreMenu({ isOpen, onClose }: MobileMoreMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const { logout, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { currency, updateCurrencyInBackend } = useCurrency()
  
  const [showLanguages, setShowLanguages] = useState(false)
  const [showCurrencies, setShowCurrencies] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦' },
  ]

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'MAD', symbol: 'د.م', name: 'Dirham', flag: '🇲🇦' },
  ]

  const handleLogout = () => {
    logout()
    onClose()
    router.push('/login')
  }

  const handleNavigate = (href: string) => {
    onClose()
    router.push(href)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Menu Panel - Full Screen on Mobile */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-0 bg-background dark:bg-[#0f1623] z-[101] flex flex-col"
          >
            {/* Header - Fixed */}
            <div className="flex-shrink-0 px-5 pt-[env(safe-area-inset-top)]">
              <div className="flex items-center justify-between h-16">
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  {t('more') || 'More'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-secondary dark:bg-[#1e293b] flex items-center justify-center active:scale-95 transition-transform"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Profile Card */}
              <div className="px-5 py-4">
                <button
                  onClick={() => handleNavigate('/settings')}
                  className="w-full p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f] active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-foreground dark:text-white">
                        {user?.fullName || user?.email?.split('@')[0] || 'User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.email || 'Profil verwalten'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              </div>

              {/* Quick Settings */}
              <div className="px-5 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* Theme Toggle */}
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f] active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      {theme === 'dark' ? (
                        <Sun className="w-6 h-6 text-white" />
                      ) : (
                        <Moon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {theme === 'dark' ? 'Hell' : 'Dunkel'}
                    </span>
                  </button>

                  {/* Language */}
                  <button
                    onClick={() => setShowLanguages(!showLanguages)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f] active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {languages.find(l => l.code === language)?.flag} {language.toUpperCase()}
                    </span>
                  </button>

                  {/* Currency */}
                  <button
                    onClick={() => setShowCurrencies(!showCurrencies)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f] active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {currencies.find(c => c.code === currency)?.flag} {currency}
                    </span>
                  </button>
                </div>

                {/* Language Dropdown */}
                <AnimatePresence>
                  {showLanguages && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden rounded-xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]"
                    >
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code as any)
                            setShowLanguages(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 transition-colors",
                            language === lang.code 
                              ? "bg-blue-50 dark:bg-blue-900/20" 
                              : "hover:bg-gray-100 dark:hover:bg-[#222]"
                          )}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span className={cn(
                            "font-medium",
                            language === lang.code 
                              ? "text-blue-600 dark:text-blue-400" 
                              : "text-gray-700 dark:text-gray-300"
                          )}>
                            {lang.name}
                          </span>
                          {language === lang.code && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Currency Dropdown */}
                <AnimatePresence>
                  {showCurrencies && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden rounded-xl bg-card dark:bg-[#1e293b] border border-border dark:border-[#2d3a4f]"
                    >
                      {currencies.map(curr => (
                        <button
                          key={curr.code}
                          onClick={async () => {
                            await updateCurrencyInBackend(curr.code)
                            setShowCurrencies(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 transition-colors",
                            currency === curr.code 
                              ? "bg-green-50 dark:bg-green-900/20" 
                              : "hover:bg-gray-100 dark:hover:bg-[#222]"
                          )}
                        >
                          <span className="text-xl">{curr.flag}</span>
                          <div className="flex-1 text-left">
                            <span className={cn(
                              "font-medium",
                              currency === curr.code 
                                ? "text-green-600 dark:text-green-400" 
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              {curr.code}
                            </span>
                            <span className="text-sm text-gray-400 ml-2">{curr.name}</span>
                          </div>
                          {currency === curr.code && (
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu Sections */}
              {menuSections.map((section) => (
                <div key={section.id} className="px-5 pb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                    {t(section.titleKey as any)}
                  </h3>
                  <div className="bg-card dark:bg-[#1e293b] rounded-2xl overflow-hidden divide-y divide-border dark:divide-[#2d3a4f] border border-border dark:border-[#2d3a4f]">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavigate(item.href)}
                          className={cn(
                            "w-full flex items-center gap-4 px-4 py-3.5 transition-colors active:bg-secondary/50 dark:active:bg-[#0f1623]/50",
                            isActive && "bg-primary/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                            item.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className={cn(
                            "flex-1 text-left font-medium",
                            isActive 
                              ? "text-primary" 
                              : "text-foreground dark:text-white"
                          )}>
                            {t(item.labelKey as any)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Settings & Support */}
              <div className="px-5 pb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-1">
                  {t('settings')}
                </h3>
                <div className="bg-gray-50 dark:bg-[#1e293b] rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-[#2d3a4f]">
                  {settingsItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigate(item.href)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 transition-colors active:bg-gray-100 dark:active:bg-[#0f1623]"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200 dark:bg-[#2d3a4f]">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                          {t(item.labelKey as any)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Logout */}
              <div className="px-5 pb-8">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 active:scale-[0.98] transition-transform"
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-red-500">
                    {t('logout')}
                  </span>
                </button>
              </div>

              {/* App Version */}
              <div className="px-5 pb-safe-bottom text-center">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  FinFlow v1.0.0
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
