"use client"

import {
  BarChart2,
  CreditCard,
  Wallet,
  Settings,
  HelpCircle,
  PiggyBank,
  TrendingUp,
  Tags,
  Home,
  Bot,
  Activity,
  LineChart,
  History,
  Award,
  Bell,
  LogOut,
  ChevronUp,
  Shield
} from "lucide-react"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useAuth } from "@/hooks/use-auth"
import { FinflowLogo } from "@/components/icons/finflow-logo"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// User interface
interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface SidebarProps {
  user?: User;
}

// User Profile Menu Component
function UserProfileMenu({ user }: { user?: User }) {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2332] transition-colors">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f1623]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.fullName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
          </div>
          <ChevronUp className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-2 bg-white dark:bg-[#0f1623] border border-gray-200 dark:border-[#232e40] shadow-lg"
        align="end"
        side="top"
        sideOffset={8}
      >
        <div className="space-y-1">
          {/* User Info */}
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.fullName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ''}</p>
          </div>

          <div className="h-px bg-gray-200 dark:bg-[#232e40] my-2" />

          {/* Menu Items */}
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1a2332] transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t('settings')}</span>
            </div>
          </Link>

          <div className="h-px bg-gray-200 dark:bg-[#232e40] my-2" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">{t('logout')}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: any
    children: React.ReactNode
  }) {
    const isActive = pathname === href
    
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
          isActive
            ? "bg-gray-50 text-gray-900 dark:bg-[#232e40] dark:text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#232e40]"
        )}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
      </Link>
    )
  }

  return (
    <nav className="hidden lg:flex flex-col h-full w-64 bg-white dark:bg-[#1a2332] border-r border-gray-200 dark:border-[#232e40]">
        <div className="h-full flex flex-col">
          <Link
            href="/dashboard"
            className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-[#232e40]"
          >
            <FinflowLogo size="md" variant="full" />
          </Link>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('overview')}
                </div>
                <div className="space-y-1">
                  <NavItem href="/dashboard" icon={Home}>
                    {t('dashboard')}
                  </NavItem>
                  <NavItem href="/reports" icon={BarChart2}>
                    {t('reports')}
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('finance')}
                </div>
                <div className="space-y-1">
                  <NavItem href="/accounts" icon={CreditCard}>
                    {t('accounts')}
                  </NavItem>
                  <NavItem href="/budgets" icon={PiggyBank}>
                    {t('budgets')}
                  </NavItem>
                  <NavItem href="/transactions" icon={Wallet}>
                    {t('transactions')}
                  </NavItem>
                  <NavItem href="/categories" icon={Tags}>
                    {t('categories')}
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('markets')}
                </div>
                <div className="space-y-1">
                  <NavItem href="/markets" icon={TrendingUp}>
                    {t('markets')}
                  </NavItem>
                  <NavItem href="/trading-agent" icon={Bot}>
                    {t('tradingAgent')}
                  </NavItem>
                  <NavItem href="/stock-trading-agent" icon={LineChart}>
                    {t('stockTradingAgent')}
                  </NavItem>
                  <NavItem href="/trading-history" icon={History}>
                    {t('tradingHistory')}
                  </NavItem>
                  <NavItem href="/trading-performance" icon={Award}>
                    {t('tradingPerformance')}
                  </NavItem>
                  <NavItem href="/price-alerts" icon={Bell}>
                    {t('priceAlerts')}
                  </NavItem>
                  <NavItem href="/backtesting" icon={Activity}>
                    {t('backtesting')}
                  </NavItem>
                  <NavItem href="/risk-analysis" icon={Shield}>
                    {t('riskAnalysis')}
                  </NavItem>
                  <NavItem href="/analytics" icon={BarChart2}>
                    {t('analytics')}
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#232e40]">
            <div className="space-y-1">
              <NavItem href="/settings" icon={Settings}>
                {t('settings')}
              </NavItem>
              <NavItem href="/support" icon={HelpCircle}>
                {t('support')}
              </NavItem>
            </div>
          </div>

          {/* User Profile Menu */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#232e40]">
            <UserProfileMenu user={user} />
          </div>
        </div>
      </nav>
  );
}
