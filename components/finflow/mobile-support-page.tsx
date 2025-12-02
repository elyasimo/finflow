"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Send, User, Mail, HelpCircle, FileText, Clock,
  Loader2, CheckCircle2, AlertCircle, X, Sparkles, ChevronLeft
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
  user?: { id: string; email: string; fullName?: string }
  onSendEmail?: (subject: string, message: string) => Promise<void>
}

export default function MobileSupportPage({ user, onSendEmail }: MobileSupportPageProps) {
  const { t } = useLanguage()
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const FAQ_RESPONSES: Record<string, string> = {
    'konto': t('faqAccount'), 'account': t('faqAccount'),
    'budget': t('faqBudget'), 'passwort': t('faqPassword'),
    'password': t('faqPassword'), 'faceid': t('faqFaceId'),
    'crypto': t('faqCrypto'), 'trading': t('faqTrading'),
  }

  const QUICK_ACTIONS = [
    { icon: HelpCircle, label: t('howToAddAccount'), keyword: 'konto' },
    { icon: FileText, label: t('howToCreateBudget'), keyword: 'budget' },
    { icon: Mail, label: t('howToChangePassword'), keyword: 'passwort' },
    { icon: Clock, label: t('howToEnableFaceId'), keyword: 'faceid' },
  ]

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1', type: 'bot',
        content: `${t('supportGreeting')}${user?.fullName ? ` ${user.fullName.split(' ')[0]}` : ''}! 👋 ${t('supportAssistantIntro')}`,
        timestamp: new Date()
      }])
    }
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight)
    }
    updateHeight()
    window.visualViewport?.addEventListener('resize', updateHeight)
    window.addEventListener('resize', updateHeight)
    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight)
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [messages, isTyping, viewportHeight])

  const findResponse = (input: string): string | null => {
    const lower = input.toLowerCase()
    for (const [k, v] of Object.entries(FAQ_RESPONSES)) if (lower.includes(k)) return v
    if (lower.includes('kontakt') || lower.includes('email')) return 'CONTACT_FORM'
    return null
  }

  const handleSendMessage = async (content?: string) => {
    const text = content || inputMessage.trim()
    if (!text) return
    setMessages(p => [...p, { id: Date.now().toString(), type: 'user', content: text, timestamp: new Date() }])
    setInputMessage('')
    setIsTyping(true)
    await new Promise(r => setTimeout(r, 800))
    const resp = findResponse(text)
    let bot = resp === 'CONTACT_FORM' 
      ? (setTimeout(() => setShowContactForm(true), 500), t('openingContactForm'))
      : resp || `${t('notSureHowToHelp')} "${text}"`
    setIsTyping(false)
    setMessages(p => [...p, { id: (Date.now()+1).toString(), type: 'bot', content: bot, timestamp: new Date() }])
  }

  const handleSendContactEmail = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) return
    setIsSendingEmail(true)
    try {
      onSendEmail ? await onSendEmail(contactSubject, contactMessage) : await new Promise(r => setTimeout(r, 1500))
      setEmailSent(true)
      setTimeout(() => { setShowContactForm(false); setContactSubject(''); setContactMessage(''); setEmailSent(false) }, 2000)
    } catch {} finally { setIsSendingEmail(false) }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0f1623]"
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh', paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex-shrink-0 bg-[#0f1623] border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-white flex-1">{t('support') || 'Support'}</h1>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />Online
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-4">
          {messages.map(m => (
            <div key={m.id} className={cn("flex gap-3", m.type === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                m.type === 'user' ? "bg-blue-500" : "bg-gradient-to-br from-purple-500 to-indigo-600")}>
                {m.type === 'user' ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
              </div>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-3",
                m.type === 'user' ? "bg-blue-500 text-white rounded-tr-sm" : "bg-[#1a2332] text-gray-200 rounded-tl-sm")}>
                <p className="text-[15px] whitespace-pre-wrap">{m.content}</p>
                <p className={cn("text-[10px] mt-1", m.type === 'user' ? "text-blue-100" : "text-gray-500")}>
                  {m.timestamp.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#1a2332] rounded-2xl px-4 py-3 flex gap-1">
                {[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}} />)}
              </div>
            </div>
          )}
          <div className="pt-4">
            <p className="text-xs text-gray-500 mb-3">{t('quickHelp')}</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a,i) => (
                <button key={i} onClick={() => handleSendMessage(a.label)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#1a2332] rounded-xl text-sm text-gray-300">
                  <a.icon className="w-4 h-4 text-blue-500" /><span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-800 bg-[#1a2332] px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <input ref={inputRef} type="text" value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)}
            placeholder={t('writeYourQuestion') || 'Schreibe deine Frage...'}
            className="flex-1 px-4 py-3 rounded-full bg-[#232e40] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontSize: '16px' }} autoComplete="off" />
          <button onClick={() => handleSendMessage()} disabled={!inputMessage.trim() || isTyping}
            className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showContactForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !isSendingEmail && setShowContactForm(false)} />
          <div className="relative bg-[#1a2332] rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/30 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white">{t('contact')}</h2>
              </div>
              <button onClick={() => setShowContactForm(false)} className="w-10 h-10 rounded-full bg-[#232e40] flex items-center justify-center">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {emailSent ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white">{t('messageSent')}</h3>
                </div>
              ) : (
                <>
                  <input type="text" value={contactSubject} onChange={e => setContactSubject(e.target.value)}
                    placeholder={t('subjectPlaceholder')} style={{ fontSize: '16px' }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#232e40] text-white placeholder-gray-500" />
                  <textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)}
                    placeholder={t('describeYourConcern')} rows={4} style={{ fontSize: '16px' }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#232e40] text-white placeholder-gray-500 resize-none" />
                  <button onClick={handleSendContactEmail} disabled={isSendingEmail || !contactSubject.trim() || !contactMessage.trim()}
                    className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isSendingEmail ? t('sending') : t('sendMessage')}
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
