"use client"

import { useState, useRef, useEffect } from "react"
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
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
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
 * Simple chat support page - NO MobileBottomNav, NO complex keyboard handling
 * Uses simple flexbox layout: Header -> Scrollable Messages -> Fixed Input
 */
export default function MobileSupportPage({ user, onSendEmail }: MobileSupportPageProps) {
  const { t } = useLanguage()
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const FAQ_RESPONSES: Record<string, string> = {
    'konto': t('faqAccount'),
    'account': t('faqAccount'),
    'transaktion': t('faqTransaction'),
    'transaction': t('faqTransaction'),
    'budget': t('faqBudget'),
    'passwort': t('faqPassword'),
    'password': t('faqPassword'),
    'faceid': t('faqFaceId'),
    'face id': t('faqFaceId'),
    'export': t('faqExport'),
    'währung': t('faqCurrency'),
    'currency': t('faqCurrency'),
    'sprache': t('faqLanguage'),
    'language': t('faqLanguage'),
    'benachrichtigung': t('faqNotification'),
    'notification': t('faqNotification'),
    'löschen': t('faqDelete'),
    'delete': t('faqDelete'),
    'crypto': t('faqCrypto'),
    'trading': t('faqTrading'),
    'api': t('faqApi'),
    'import': t('faqImport'),
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const findResponse = (input: string): string | null => {
    const lowerInput = input.toLowerCase()
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerInput.includes(keyword)) return response
    }
    if (lowerInput.includes('hilfe') || lowerInput.includes('help')) {
      return t('supportHelpTopics') || 'Ich kann dir bei vielen Themen helfen!'
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
      botResponse = `${t('notSureHowToHelp')} "${messageText}" 🤔\n\n${t('youCan')}:\n• ${t('chooseQuickOption')}\n• ${t('typeContactToReach')}`
    }

    setIsTyping(false)
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: botResponse,
      timestamp: new Date()
    }])
  }

  const handleQuickAction = (keyword: string) => {
    const action = QUICK_ACTIONS.find(q => q.keyword === keyword)
    if (action) handleSendMessage(action.label)
  }

  const handleSendContactEmail = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) return
    setIsSendingEmail(true)

    try {
      if (onSendEmail) {
        await onSendEmail(contactSubject, contactMessage)
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      setEmailSent(true)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content: `✅ ${t('messageSentSuccess')}`,
        timestamp: new Date()
      }])
      setTimeout(() => {
        setShowContactForm(false)
        setContactSubject('')
        setContactMessage('')
        setEmailSent(false)
      }, 2000)
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ ${t('messageSendError')} info@finflowapp.ch`,
        timestamp: new Date()
      }])
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0f1623]">
      {/* Header - Fixed at top */}
      <div 
        className="flex-shrink-0 bg-[#0f1623] border-b border-gray-800 z-10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-white flex-1">
            {t('support') || 'Support'}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* Messages - Scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                message.type === 'user' 
                  ? "bg-blue-500" 
                  : "bg-gradient-to-br from-purple-500 to-indigo-600"
              )}>
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3",
                message.type === 'user'
                  ? "bg-blue-500 text-white rounded-tr-sm"
                  : "bg-[#1a2332] text-gray-200 rounded-tl-sm"
              )}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <p className={cn(
                  "text-[10px] mt-1.5",
                  message.type === 'user' ? "text-blue-100" : "text-gray-500"
                )}>
                  {message.timestamp.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#1a2332] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4">
            <p className="text-xs text-gray-500 mb-3">{t('quickHelp')}</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.keyword)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#1a2332] rounded-xl text-sm text-gray-300 active:scale-95 transition-transform"
                >
                  <action.icon className="w-4 h-4 text-blue-500" />
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar - Fixed at bottom, ABOVE everything */}
      <div 
        className="flex-shrink-0 border-t border-gray-800 bg-[#1a2332] px-4 py-3"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={t('writeYourQuestion') || 'Schreibe deine Frage...'}
            className="flex-1 px-4 py-3 rounded-full text-base bg-[#232e40] text-white placeholder-gray-400 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-blue-500 text-white active:scale-95 disabled:opacity-50 transition-transform flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          {t('typeContactForSupport') || 'Schreibe "Kontakt" für Support'}
        </p>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => !isSendingEmail && setShowContactForm(false)}
          />
          <div className="relative bg-[#1a2332] rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#1a2332] z-10 px-5 pt-5 pb-4 border-b border-gray-700 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900/30 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{t('contact')}</h2>
                    <p className="text-xs text-gray-500">{t('responseWithin')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactForm(false)}
                  disabled={isSendingEmail}
                  className="w-10 h-10 rounded-full bg-[#232e40] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {emailSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t('messageSent')}</h3>
                  <p className="text-gray-400">{t('weWillContactYouSoon')}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('subject')}</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder={t('subjectPlaceholder')}
                      className="w-full px-4 py-3.5 rounded-2xl bg-[#232e40] text-white placeholder-gray-500 border-2 border-transparent focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('yourMessage')}</label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={t('describeYourConcern')}
                      rows={5}
                      className="w-full px-4 py-3.5 rounded-2xl resize-none bg-[#232e40] text-white placeholder-gray-500 border-2 border-transparent focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="p-4 bg-blue-900/20 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-300">E-Mail: info@finflowapp.ch</p>
                        <p className="text-xs text-blue-400 mt-1">{t('weReplyAsSoonAsPossible')}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSendContactEmail}
                    disabled={isSendingEmail || !contactSubject.trim() || !contactMessage.trim()}
                    className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t('sendMessage')}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
