"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  X, 
  Bitcoin, 
  TrendingUp, 
  Settings, 
  Bot,
  Sparkles,
  ChevronRight,
  Shield,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface RoboAdvisorSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenCreateSheet?: () => void
  onSelectAgent?: (type: 'crypto' | 'trading') => void
}

type AgentChoice = 'crypto' | 'trading' | 'configure'

interface AgentOption {
  id: AgentChoice
  icon: React.ElementType
  iconBg: string
  title: string
  titleKey: string
  description: string
  descriptionKey: string
  route?: string
}

export default function RoboAdvisorSelectionModal({ 
  isOpen, 
  onClose,
  onOpenCreateSheet,
  onSelectAgent
}: RoboAdvisorSelectionModalProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const [rememberChoice, setRememberChoice] = useState(false)

  // Agent options configuration
  const agentOptions: AgentOption[] = [
    {
      id: 'crypto',
      icon: Bitcoin,
      iconBg: 'from-orange-500 to-yellow-500',
      title: 'Krypto Agent',
      titleKey: 'cryptoAgent',
      description: 'Automatisiertes Trading und Risikomanagement für Kryptowährungen',
      descriptionKey: 'cryptoAgentDescription',
      route: '/robo-advisor?type=crypto'
    },
    {
      id: 'trading',
      icon: TrendingUp,
      iconBg: 'from-blue-500 to-indigo-600',
      title: 'Trading Agent',
      titleKey: 'tradingAgent',
      description: 'Aktien, ETFs und weitere Finanzinstrumente automatisch handeln',
      descriptionKey: 'tradingAgentDescription',
      route: '/robo-advisor?type=trading'
    },
    {
      id: 'configure',
      icon: Settings,
      iconBg: 'from-purple-500 to-pink-500',
      title: 'Neuen Agent konfigurieren',
      titleKey: 'configureNewAgent',
      description: 'Erstelle einen individuellen Robo-Advisor mit eigenen Einstellungen',
      descriptionKey: 'configureAgentDescription'
    }
  ]

  // Track analytics event
  const trackSelection = useCallback((choice: AgentChoice) => {
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'robo_advisor_choice', {
        event_category: 'agent_select',
        event_label: choice
      })
    }
    console.log('[Analytics] Robo-Advisor selection:', choice)
  }, [])

  // Handle selection
  const handleSelect = useCallback((option: AgentOption) => {
    trackSelection(option.id)
    
    // Save preference if checkbox is checked
    if (rememberChoice && option.id !== 'configure') {
      localStorage.setItem('roboAdvisorPreference', option.id)
    }

    if (option.id === 'configure') {
      onClose()
      if (onOpenCreateSheet) {
        onOpenCreateSheet()
      } else {
        // Navigate to robo-advisor with create param
        router.push('/robo-advisor?action=create')
      }
    } else if (option.id === 'crypto' || option.id === 'trading') {
      // Use callback to set agent type directly without page reload
      if (onSelectAgent) {
        onSelectAgent(option.id)
      }
      onClose()
    }
  }, [rememberChoice, onClose, onOpenCreateSheet, onSelectAgent, router, trackSelection])

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      // Trap focus within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstEl = focusableElements[0] as HTMLElement
        const lastEl = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    // Focus first button when modal opens
    setTimeout(() => {
      firstButtonRef.current?.focus()
    }, 100)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="robo-advisor-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={cn(
          "relative z-10 w-full max-w-md mx-4",
          "bg-white dark:bg-[#1a2332] rounded-3xl",
          "shadow-2xl shadow-black/20",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 
                id="robo-advisor-modal-title" 
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                {t('roboAdvisor') || 'Robo-Advisor'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('selectAnOption') || 'Wähle eine Option'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={'Schließen'}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {agentOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                ref={index === 0 ? firstButtonRef : undefined}
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl",
                  "bg-gray-50 dark:bg-[#232e40]",
                  "hover:bg-gray-100 dark:hover:bg-[#2a3a50]",
                  "active:scale-[0.98] transition-all duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#1a2332]",
                  "group"
                )}
                aria-describedby={`option-${option.id}-desc`}
              >
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                  option.iconBg
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {option.title}
                  </h3>
                  <p 
                    id={`option-${option.id}-desc`}
                    className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                  >
                    {option.description}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </button>
            )
          })}
        </div>

        {/* Remember choice checkbox */}
        <div className="px-5 pb-5">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
              {t('rememberMyChoice') || 'Meine Auswahl merken'}
            </span>
          </label>
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-5">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('roboAdvisorHint') || 'Du kannst deine Präferenz jederzeit in den Einstellungen ändern.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
