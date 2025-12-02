"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Send,
  User,
  Mail,
  HelpCircle,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileBottomNav from "./mobile-bottom-nav"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  isTyping?: boolean
}

interface MobileSupportPageProps {
  user?: {
    id: string
    email: string
    fullName?: string
  }
  onSendEmail?: (subject: string, message: string) => Promise<void>
}

/**
 * Keyboard-aware mobile chat page
 * - setzt --vh basierend auf visualViewport (Fallback innerHeight)
 * - verwendet fixed bottom + --vh so dass fixed elements über der Keyboard-UI stehen
 * - passt messages padding-bottom anhand input-bar height (kein doppeltes Hochschieben)
 */

export default function MobileSupportPage({ user, onSendEmail }: MobileSupportPageProps) {
  const { t } = useLanguage()
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputBarRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialHeightRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  // store initial height on mount
  useEffect(() => {
    initialHeightRef.current = window.innerHeight
  }, [])

  // set CSS variable --vh so height: calc(var(--vh)*100) follows the visual viewport
  useEffect(() => {
    const setVh = () => {
      const vv = (window as any).visualViewport as VisualViewport | undefined
      const h = vv?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--vh', `${h * 0.01}px`)
    }

    setVh()
    const vv = (window as any).visualViewport as VisualViewport | undefined
    if (vv) {
      vv.addEventListener('resize', setVh)
      vv.addEventListener('scroll', setVh)
    } else {
      window.addEventListener('resize', setVh)
    }
    window.addEventListener('orientationchange', setVh)

    return () => {
      if (vv) {
        vv.removeEventListener('resize', setVh)
        vv.removeEventListener('scroll', setVh)
      } else {
        window.removeEventListener('resize', setVh)
      }
      window.removeEventListener('orientationchange', setVh)
    }
  }, [])

  // VisualViewport handler (fallback to innerHeight) — used to detect keyboard open for scrolling/padding
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined

    const updateKeyboard = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const initial = initialHeightRef.current || window.innerHeight

        if (vv) {
          const visibleHeight = vv.height
          const offsetTop = vv.offsetTop ?? 0
          const calculated = Math.max(0, initial - visibleHeight - offsetTop)
          const visible = calculated > 80
          setKeyboardHeight(calculated)
          setKeyboardVisible(visible)
        } else {
          const diff = Math.max(0, initial - window.innerHeight)
          const visible = diff > 80
          setKeyboardHeight(diff)
          setKeyboardVisible(visible)
        }
      })
    }

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable
      if (isInput) {
        setTimeout(updateKeyboard, 50)
      }
    }

    const onFocusOut = () => {
      setTimeout(updateKeyboard, 100)
    }

    if (vv) {
      vv.addEventListener('resize', updateKeyboard)
      vv.addEventListener('scroll', updateKeyboard)
      updateKeyboard()
    } else {
      window.addEventListener('resize', updateKeyboard)
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateKeyboard)
        vv.removeEventListener('scroll', updateKeyboard)
      } else {
        window.removeEventListener('resize', updateKeyboard)
      }
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // adjust messages container padding-bottom based on input bar height only
  const adjustMessagesPadding = useCallback(() => {
    const container = messagesContainerRef.current
    const inputBar = inputBarRef.current
    if (!container || !inputBar) return

    const inputBarHeight = inputBar.offsetHeight
    const extra = inputBarHeight + 12
    container.style.paddingBottom = `${extra}px`
  }, [])

  useEffect(() => {
    adjustMessagesPadding()
    if (keyboardVisible) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100)
    }
  }, [keyboardVisible, adjustMessagesPadding])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const ro = new ResizeObserver(() => adjustMessagesPadding())
    if (inputBarRef.current) ro.observe(inputBarRef.current)
    return () => ro.disconnect()
  }, [adjustMessagesPadding])

  // FAQ & chat logic (same as before)
  const FAQ_RESPONSES: Record<string, string> = {
    'konto': t('faqAccount'), 'account': t('faqAccount'),
    'transaktion': t('faqTransaction'), 'transaction': t('faqTransaction'),
    'budget': t('faqBudget'), 'passwort': t('faqPassword'),
    'password': t('faqPassword'), 'faceid': t('faqFaceId'),
    'face id': t('faqFaceId'), 'export': t('faqExport'),
    'währung': t('faqCurrency'), 'currency': t('faqCurrency'),
    'sprache': t('faqLanguage'), 'language': t('faqLanguage'),
    'benachrichtigung': t('faqNotification'), 'notification': t('faqNotification'),
    'löschen': t('faqDelete'), 'delete': t('faqDelete'),
    'crypto': t('faqCrypto'), 'trading': t('faqTrading'),
    'api': t('faqApi'), 'import': t('faqImport'),
  }
  const QUICK_ACTIONS = [
    { icon: HelpCircle, label: t('howToAddAccount'), keyword: 'konto' },
    { icon: FileText, label: t('howToCreateBudget'), keyword: 'budget' },
    { icon: Mail, label: t('howToChangePassword'), keyword: 'passwort' },
    { icon: Clock, label: t('howToEnableFaceId'), keyword: 'faceid' },
  ]

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `${t('supportGreeting')}${user?.fullName ? ` ${user.fullName.split(' ')[0]}` : ''}! 👋 ${t('supportAssistantIntro')}`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const findResponse = (input: string): string | null => {
    const lowerInput = input.toLowerCase()
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerInput.includes(keyword)) return response
    }
    if (lowerInput.includes('hilfe') || lowerInput.includes('help')) {
      return t('supportHelpTopics') || 'I can help you with many topics.'
    }
    if (lowerInput.includes('kontakt') || lowerInput.includes('email') || lowerInput.includes('mensch')) {
      return 'CONTACT_FORM'
    }
    return null
  }

  const handleSendMessage = async (content?: string) => {
    const messageText = content || inputMessage.trim()
    if (!messageText) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
    const response = findResponse(messageText)
    let botResponse: string
    if (response === 'CONTACT_FORM') {
      botResponse = t('openingContactForm')
      setTimeout(() => setShowContactForm(true), 1000)
    } else if (response) {
      botResponse = response
    } else {
      botResponse = `${t('notSureHowToHelp')} "${messageText}" 🤔`
    }
    setIsTyping(false)
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: botResponse,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, botMessage])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120)
  }

  const handleQuickAction = (keyword: string) => {
    const response = FAQ_RESPONSES[keyword]
    if (response) handleSendMessage(QUICK_ACTIONS.find(q => q.keyword === keyword)?.label || keyword)
  }

  const handleSendContactEmail = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) return
    setIsSendingEmail(true)
    try {
      if (onSendEmail) await onSendEmail(contactSubject, contactMessage)
      else await new Promise(resolve => setTimeout(resolve, 1500))
      setEmailSent(true)
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `✅ ${t('messageSentSuccess')}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, confirmMessage])
      setTimeout(() => {
        setShowContactForm(false)
        setContactSubject('')
        setContactMessage('')
        setEmailSent(false)
      }, 2000)
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ ${t('messageSendError')} info@finflowapp.ch`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 flex flex-col bg-[#f8f9fc] dark:bg-[#0f1623]"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <div 
        className="flex-shrink-0 z-40 bg-[#0f1623] border-b border-gray-800"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 h-12">
          <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center" aria-label="Zurück">
            <ChevronLeft className="w-4 h-4 text-gray-300" />
          </button>
          <h1 className="text-base font-semibold text-white flex-1">{t('support') || 'Support'}</h1>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />Online</div>
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 bg-[#f8f9fc] dark:bg-[#0f1623]"
        style={{ paddingBottom: undefined as any }}
      >
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex gap-3", message.type === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", message.type === 'user' ? "bg-blue-500" : "bg-gradient-to-br from-purple-500 to-indigo-600")}>
                {message.type === 'user' ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
              </div>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-3", message.type === 'user' ? "bg-blue-500 text-white rounded-tr-sm" : "bg-white dark:bg-[#1a2332] text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm")}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={cn("text-[10px] mt-1.5", message.type === 'user' ? "text-blue-100" : "text-gray-400")}>
                  {message.timestamp.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!keyboardVisible && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-3">{t('quickHelp')}</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action, index) => (
                <button key={index} onClick={() => handleQuickAction(action.keyword)} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1a2332] rounded-xl text-sm text-gray-700 dark:text-gray-300 shadow-sm active:scale-95 transition-transform">
                  <action.icon className="w-4 h-4 text-blue-500" />
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div 
        ref={inputBarRef}
        className={cn("flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a2332] px-4 py-3", "fixed left-0 right-0 z-50")}
        style={{ bottom: 'env(safe-area-inset-bottom, 8px)', transition: 'bottom 180ms ease' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              onFocus={() => { setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120) }}
              placeholder={t('writeYourQuestion') || 'Schreibe deine Frage...'}
              className={cn("w-full px-4 py-3 rounded-full text-base", "bg-gray-100 dark:bg-[#232e40]", "text-gray-900 dark:text-white placeholder-gray-400", "border-0", "focus:outline-none focus:ring-2 focus:ring-blue-500")}
              style={{ fontSize: '16px' }}
            />
          </div>
          <button onClick={() => handleSendMessage()} disabled={!inputMessage.trim() || isTyping} className={cn("w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0", "bg-blue-500 text-white", "active:scale-95", "disabled:opacity-50 disabled:cursor-not-allowed", "transition-transform")}>
            <Send className="w-5 h-5" />
          </button>
        </div>

        {!keyboardVisible && <p className="text-center text-xs text-gray-400 mt-2">{t('typeContactForSupport') || 'Schreibe "Kontakt" um unser Support-Team zu erreichen'}</p>}
      </div>

      {!keyboardVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <MobileBottomNav />
        </div>
      )}

      {showContactForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isSendingEmail && setShowContactForm(false)} />
          <div className="relative bg-white dark:bg-[#1a2332] rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-scale-in shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-[#1a2332] z-10 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('contact')}</h2>
                    <p className="text-xs text-gray-500">{t('responseWithin')}</p>
                  </div>
                </div>
                <button onClick={() => setShowContactForm(false)} disabled={isSendingEmail} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {emailSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('messageSent')}</h3>
                  <p className="text-gray-500">{t('weWillContactYouSoon')}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('subject')}</label>
                    <input type="text" value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} placeholder={t('subjectPlaceholder')} className={cn("w-full px-4 py-3.5 rounded-2xl", "bg-gray-50 dark:bg-[#232e40]", "text-gray-900 dark:text-white placeholder-gray-400", "border-2 border-transparent", "focus:outline-none focus:border-blue-500")} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('yourMessage')}</label>
                    <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder={t('describeYourConcern')} rows={5} className={cn("w-full px-4 py-3.5 rounded-2xl resize-none", "bg-gray-50 dark:bg-[#232e40]", "text-gray-900 dark:text-white placeholder-gray-400", "border-2 border-transparent", "focus:outline-none focus:border-blue-500")} />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">E-Mail: info@finflowapp.ch</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t('weReplyAsSoonAsPossible')}</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSendContactEmail} disabled={isSendingEmail || !contactSubject.trim() || !contactMessage.trim()} className={cn("w-full py-4 rounded-2xl font-semibold text-lg", "bg-blue-500 text-white shadow-lg", "hover:bg-blue-600 active:scale-[0.98]", "disabled:opacity-50 disabled:cursor-not-allowed", "transition-all flex items-center justify-center gap-2")}>
                    {isSendingEmail ? (<><Loader2 className="w-5 h-5 animate-spin" />{t('sending')}</>) : (<><Send className="w-5 h-5" />{t('sendMessage')}</>)}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}