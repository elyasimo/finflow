'use client';

import { useState } from 'react';
import Layout from "@/components/finflow/layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function SupportPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending - In production, connect to your email service
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form
    setSubject('');
    setMessage('');
    
    // Reset success message after 5 seconds
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:info@finflowapp.ch';
  };

  const handleChatClick = () => {
    // Open Crisp chat
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:open']);
    }
  };

  return (
    <Layout user={user}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Wir sind hier um zu helfen. Kontaktiere uns über E-Mail oder Chat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Methods */}
          <div className="lg:col-span-1 space-y-4">
            {/* Email Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleEmailClick}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">E-Mail Support</CardTitle>
                    <CardDescription className="text-sm">Direkt per E-Mail</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:info@finflowapp.ch"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  info@finflowapp.ch
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Antwortzeit: 24-48 Stunden
                </p>
              </CardContent>
            </Card>

            {/* Chat Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Live Chat</CardTitle>
                    <CardDescription className="text-sm">Sofortige Hilfe</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={handleChatClick}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat öffnen
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Mo-Fr: 9:00 - 18:00 Uhr
                </p>
              </CardContent>
            </Card>

            {/* FAQ Link */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Häufig gestellte Fragen</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Vielleicht findest du deine Antwort bereits in unseren FAQs.
                </p>
                <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">
                  Zu den FAQs →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Kontaktformular</CardTitle>
                <CardDescription>
                  Schicke uns eine Nachricht und wir melden uns schnellstmöglich bei dir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                      <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nachricht gesendet!</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Danke für deine Nachricht. Wir werden uns in Kürze bei dir melden.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Betreff</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Worum geht es?"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nachricht</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Beschreibe dein Anliegen..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Nachricht senden
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
