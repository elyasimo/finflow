"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Send,
  MessageSquare,
  Bot,
  User,
  Mail,
  Phone,
  HelpCircle,
  FileText,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobilePageHeader from "./mobile-page-header"
import MobileBottomNav from "./mobile-bottom-nav"

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

// Pre-defined FAQ responses
const FAQ_RESPONSES: Record<string, string> = {
  'konto': 'Um ein neues Konto hinzuzufügen, gehen Sie zu "Konten" → Tippen Sie auf das + Symbol unten rechts → Wählen Sie Ihre Bank und füllen Sie die Details aus.',
  'transaktion': 'Um eine Transaktion hinzuzufügen, gehen Sie zu "Transaktionen" → Tippen Sie auf das + Symbol → Wählen Sie zwischen Einnahme oder Ausgabe und füllen Sie die Details aus.',
  'budget': 'Um ein Budget zu erstellen, gehen Sie zu "Budgets" → Tippen Sie auf "Neues Budget" → Wählen Sie eine Kategorie, setzen Sie einen Betrag und wählen Sie den Zeitraum.',
  'passwort': 'Um Ihr Passwort zu ändern, gehen Sie zu "Einstellungen" → "Sicherheit" → "Passwort ändern". Sie müssen Ihr aktuelles Passwort eingeben.',
  'faceid': 'Um Face ID zu aktivieren, gehen Sie zu "Einstellungen" → "Sicherheit" → Aktivieren Sie "Face ID / Touch ID". Sie werden beim nächsten Login danach gefragt.',
  'export': 'Um Ihre Daten zu exportieren, gehen Sie zu "Reports" → Tippen Sie auf das Export-Symbol → Wählen Sie das Format (PDF oder CSV).',
  'währung': 'Um die Währung zu ändern, gehen Sie zu "Einstellungen" → "Darstellung" → "Währung" → Wählen Sie Ihre bevorzugte Währung.',
  'sprache': 'Um die Sprache zu ändern, gehen Sie zu "Einstellungen" → "Darstellung" → "Sprache" → Wählen Sie Deutsch, English, Français oder العربية.',
  'benachrichtigung': 'Um Benachrichtigungen zu verwalten, gehen Sie zu "Einstellungen" → "Benachrichtigungen" → Aktivieren oder deaktivieren Sie die gewünschten Optionen.',
  'löschen': 'Um Ihr Konto zu löschen, gehen Sie zu "Einstellungen" → Scrollen Sie nach unten → "Konto löschen". Diese Aktion ist endgültig.',
  'crypto': 'Um Kryptowährungen zu verfolgen, verbinden Sie Ihre Binance-API in "Einstellungen" → "API-Schlüssel" → "Binance". Dann sehen Sie Ihr Portfolio unter "Crypto".',
  'trading': 'Der Trading Agent hilft Ihnen beim automatischen Risikomanagement. Gehen Sie zu "Trading Agent" → "Neuer Agent" → Konfigurieren Sie Ihre Stop-Loss und Take-Profit Einstellungen.',
  'api': 'Um API-Schlüssel hinzuzufügen, gehen Sie zu "Einstellungen" → Scrollen Sie zu "API-Schlüssel" → Geben Sie Ihre Binance oder Alpaca Schlüssel ein.',
  'import': 'Um Transaktionen zu importieren, gehen Sie zu "Transaktionen" → Tippen Sie auf "Importieren" → Wählen Sie Ihre CSV-Datei aus.',
}

// Quick action suggestions
const QUICK_ACTIONS = [
  { icon: HelpCircle, label: 'Wie füge ich ein Konto hinzu?', keyword: 'konto' },
  { icon: FileText, label: 'Wie erstelle ich ein Budget?', keyword: 'budget' },
  { icon: Mail, label: 'Wie ändere ich mein Passwort?', keyword: 'passwort' },
  { icon: Clock, label: 'Wie aktiviere ich Face ID?', keyword: 'faceid' },
]

export default function MobileSupportPage({ user, onSendEmail }: MobileSupportPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `Hallo${user?.fullName ? ` ${user.fullName.split(' ')[0]}` : ''}! 👋 Ich bin Ihr FinFlow-Assistent. Wie kann ich Ihnen heute helfen? Sie können mir eine Frage stellen oder eine der Schnelloptionen unten auswählen.`,
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Find best matching FAQ response
  const findResponse = (input: string): string | null => {
    const lowerInput = input.toLowerCase()
    
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerInput.includes(keyword)) {
        return response
      }
    }
    
    // Check for common variations
    if (lowerInput.includes('hilfe') || lowerInput.includes('help')) {
      return 'Ich kann Ihnen bei vielen Themen helfen: Konten, Transaktionen, Budgets, Einstellungen, Trading und mehr. Stellen Sie mir einfach eine Frage!'
    }
    
    if (lowerInput.includes('kontakt') || lowerInput.includes('email') || lowerInput.includes('mensch')) {
      return 'CONTACT_FORM'
    }
    
    return null
  }

  // Send message
  const handleSendMessage = async (content?: string) => {
    const messageText = content || inputMessage.trim()
    if (!messageText) return
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
    
    // Find response
    const response = findResponse(messageText)
    
    let botResponse: string
    
    if (response === 'CONTACT_FORM') {
      botResponse = 'Natürlich! Ich öffne das Kontaktformular für Sie. Unser Team antwortet normalerweise innerhalb von 24-48 Stunden.'
      setTimeout(() => setShowContactForm(true), 1000)
    } else if (response) {
      botResponse = response
    } else {
      botResponse = `Ich bin mir nicht ganz sicher, wie ich Ihnen bei "${messageText}" helfen kann. 🤔\n\nSie können:\n• Eine der Schnelloptionen unten wählen\n• "Kontakt" eingeben, um unser Support-Team zu erreichen\n\nOder versuchen Sie, Ihre Frage anders zu formulieren!`
    }
    
    setIsTyping(false)
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: botResponse,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, botMessage])
  }

  // Handle quick action
  const handleQuickAction = (keyword: string) => {
    const response = FAQ_RESPONSES[keyword]
    if (response) {
      handleSendMessage(QUICK_ACTIONS.find(q => q.keyword === keyword)?.label || keyword)
    }
  }

  // Send contact email
  const handleSendContactEmail = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) return
    
    setIsSendingEmail(true)
    
    try {
      if (onSendEmail) {
        await onSendEmail(contactSubject, contactMessage)
      } else {
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      setEmailSent(true)
      
      // Add bot message about email sent
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: '✅ Ihre Nachricht wurde erfolgreich gesendet! Unser Team wird sich in Kürze bei Ihnen melden.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, confirmMessage])
      
      // Reset form after delay
      setTimeout(() => {
        setShowContactForm(false)
        setContactSubject('')
        setContactMessage('')
        setEmailSent(false)
      }, 2000)
      
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: '❌ Beim Senden Ihrer Nachricht ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder senden Sie uns direkt eine E-Mail an info@finflowapp.ch',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419] flex flex-col">
      <MobilePageHeader 
        user={user as any} 
        title="Support"
      />

      {/* Chat Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
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
              
              {/* Message Bubble */}
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3",
                message.type === 'user'
                  ? "bg-blue-500 text-white rounded-tr-sm"
                  : "bg-white dark:bg-[#1a2332] text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm"
              )}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <p className={cn(
                  "text-[10px] mt-1.5",
                  message.type === 'user' ? "text-blue-100" : "text-gray-400"
                )}>
                  {message.timestamp.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
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

        {/* Quick Actions - Always visible for continued help */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 mb-3">Schnelle Hilfe</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.keyword)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1a2332] rounded-xl text-sm text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md transition-shadow"
              >
                <action.icon className="w-4 h-4 text-blue-500" />
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a2332] p-4 pb-24">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Schreiben Sie Ihre Frage..."
                className={cn(
                  "w-full px-4 py-3 rounded-2xl text-base",
                  "bg-gray-50 dark:bg-[#232e40]",
                  "text-gray-900 dark:text-white placeholder-gray-400",
                  "border-2 border-transparent",
                  "focus:outline-none focus:border-blue-500"
                )}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                "bg-blue-500 text-white shadow-lg shadow-blue-500/30",
                "hover:bg-blue-600 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Contact Hint */}
          <p className="text-center text-xs text-gray-400 mt-3">
            Schreiben Sie "Kontakt" um unser Support-Team zu erreichen
          </p>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isSendingEmail && setShowContactForm(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up safe-area-inset-bottom">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Kontakt
                  </h2>
                  <p className="text-xs text-gray-500">
                    Antwort innerhalb von 24-48 Stunden
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowContactForm(false)}
                disabled={isSendingEmail}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {emailSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Nachricht gesendet!
                  </h3>
                  <p className="text-gray-500">
                    Wir melden uns in Kürze bei Ihnen.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Betreff
                    </label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="Worum geht es?"
                      className={cn(
                        "w-full px-4 py-3.5 rounded-2xl",
                        "bg-gray-50 dark:bg-[#232e40]",
                        "text-gray-900 dark:text-white placeholder-gray-400",
                        "border-2 border-transparent",
                        "focus:outline-none focus:border-blue-500"
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ihre Nachricht
                    </label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Beschreiben Sie Ihr Anliegen..."
                      rows={5}
                      className={cn(
                        "w-full px-4 py-3.5 rounded-2xl resize-none",
                        "bg-gray-50 dark:bg-[#232e40]",
                        "text-gray-900 dark:text-white placeholder-gray-400",
                        "border-2 border-transparent",
                        "focus:outline-none focus:border-blue-500"
                      )}
                    />
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          E-Mail: info@finflowapp.ch
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Wir antworten so schnell wie möglich
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSendContactEmail}
                    disabled={isSendingEmail || !contactSubject.trim() || !contactMessage.trim()}
                    className={cn(
                      "w-full py-4 rounded-2xl font-semibold text-lg",
                      "bg-blue-500 text-white shadow-lg",
                      "hover:bg-blue-600 active:scale-[0.98]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all flex items-center justify-center gap-2"
                    )}
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Nachricht senden
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
      
      {/* Styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
