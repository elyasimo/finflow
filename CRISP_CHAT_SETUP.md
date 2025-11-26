# Crisp.chat Setup Guide für Finflow

## 🚀 Schnelle Installation (5 Minuten)

### Schritt 1: Crisp Account erstellen
1. Gehe zu https://crisp.chat/
2. Klicke auf "Sign Up" (kostenlos!)
3. Erstelle einen Account mit deiner E-Mail

### Schritt 2: Website hinzufügen
1. Nach dem Login wirst du automatisch gefragt, eine Website hinzuzufügen
2. **Website Name**: Finflow
3. **Website URL**: https://finflowapp.ch
4. Klicke auf "Add Website"

### Schritt 3: Website ID kopieren
1. Gehe zu **Settings** → **Website Settings** → **Setup Instructions**
2. Du siehst dort deine **Website ID** (Format: `12345678-1234-1234-1234-123456789abc`)
3. **KOPIERE** diese ID!

### Schritt 4: In Coolify eintragen
1. Gehe zu Coolify → Dein Finflow Projekt → **Environment Variables**
2. Füge hinzu:
   ```
   NEXT_PUBLIC_CRISP_WEBSITE_ID=12345678-1234-1234-1234-123456789abc
   ```
   (Ersetze mit deiner echten ID!)
3. Klicke auf **Save** und **Redeploy**

### Schritt 5: Chatbot konfigurieren (optional)
1. In Crisp → **Chatbox Settings** → **Chatbot**
2. Aktiviere den **Chatbot**
3. Erstelle Antworten für häufige Fragen:
   - "Wie erstelle ich ein Budget?"
   - "Wie verbinde ich mein Binance Konto?"
   - "Wie funktioniert der Trading Agent?"
   - etc.

## ✨ Features die du bekommst

### Kostenloser Plan beinhaltet:
- ✅ **Live Chat** - Echtzeit Support
- ✅ **Chatbot** - Automatische Antworten
- ✅ **Unlimited Messages** - Keine Limits!
- ✅ **2 Operators** - Bis zu 2 Support Mitarbeiter
- ✅ **Mobile Apps** - iOS & Android Apps für Support Team
- ✅ **Email Integration** - Beantworte Chats per E-Mail
- ✅ **Dark Mode** - Passt sich deinem Theme an
- ✅ **Multilingual** - Deutsch, Englisch, Französisch

### Was Crisp automatisch macht:
- 🤖 Beantwortet häufige Fragen automatisch
- 📧 Sendet Offline-Nachrichten per E-Mail
- 📊 Zeigt Besucheraktivität in Echtzeit
- 🔔 Benachrichtigt dich bei neuen Nachrichten
- 💬 Speichert Chat-History automatisch

## 🎨 Chatbot Szenarien Beispiele

```
Szenario 1: Budget Hilfe
Trigger: "budget", "wie erstelle ich"
Antwort: "Um ein Budget zu erstellen:
1. Gehe zu 'Budgets' im Menü
2. Klicke auf 'Add Budget'
3. Wähle Kategorie und Betrag
4. Fertig! 🎉

Brauchst du weitere Hilfe?"
```

```
Szenario 2: Trading Agent
Trigger: "trading", "agent", "crypto"
Antwort: "Der Trading Agent hilft dir beim automatisierten Trading! 🤖

⚠️ WICHTIG: Stelle sicher, dass:
- Du API Keys in Settings eingetragen hast
- Paper Trading aktiviert ist (für Tests)
- Du die Risiko-Einstellungen geprüft hast

Möchtest du mehr über ein bestimmtes Feature erfahren?"
```

## 📱 Mobile Apps für dein Team

1. **iOS App**: https://apps.apple.com/app/crisp/id1445656630
2. **Android App**: https://play.google.com/store/apps/details?id=im.crisp.client

So kannst du auch unterwegs auf Support-Anfragen antworten!

## 🔧 Erweiterte Konfiguration

### Chat Position ändern
In Crisp → Chatbox → **Appearance**:
- Position: Bottom Right / Bottom Left
- Farbe: Anpassen an Finflow Theme (#6366f1)
- Greeting Message: "👋 Wie können wir helfen?"

### Automatische Nachrichten
In Crisp → Chatbox → **Triggers**:
- "Nach 30 Sekunden: Brauchst du Hilfe? 😊"
- "Bei Page /trading-agent: Möchtest du mehr über den Trading Agent erfahren?"

### E-Mail Forward
In Crisp → Settings → **Email**:
- Forward an: info@finflowapp.ch
- Alle Offline-Nachrichten werden per E-Mail weitergeleitet!

## 🎯 Nach dem Setup

1. **Teste den Chat**:
   - Öffne https://finflowapp.ch/support
   - Klicke auf "Chat öffnen"
   - Schreibe eine Test-Nachricht

2. **Konfiguriere Antworten**:
   - Gehe zu Crisp → Chatbot
   - Füge 5-10 häufige Fragen hinzu
   - Teste die automatischen Antworten

3. **Team hinzufügen** (optional):
   - Crisp → Settings → Team
   - Lade Kollegen ein (kostenlos für 2 Personen!)

## 💡 Profi-Tipps

- **Dark Mode**: Crisp erkennt automatisch dein Theme!
- **Offline-Modus**: Chatbot antwortet auch wenn du offline bist
- **Analytics**: Sieh genau welche Fragen am häufigsten gestellt werden
- **Knowledge Base**: Erstelle eine FAQ-Seite die im Chat durchsuchbar ist

## 🆘 Probleme?

Wenn der Chat nicht erscheint:
1. Checke, ob `NEXT_PUBLIC_CRISP_WEBSITE_ID` in Coolify gesetzt ist
2. Redeploy gemacht?
3. Cache gelöscht? (Strg+Shift+R)
4. Keine Browser-Extensions die Chat blocken? (AdBlock etc.)

## 🎉 Fertig!

Nach dem Setup hast du:
- ✅ Live Chat auf deiner Website
- ✅ AI Chatbot der automatisch antwortet
- ✅ Mobile App für unterwegs
- ✅ E-Mail Integration
- ✅ Alles KOSTENLOS! 🚀

**Support von Crisp**: https://help.crisp.chat/
**Finflow Support**: info@finflowapp.ch
