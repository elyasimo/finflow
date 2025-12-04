'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsOfServicePage() {
  const { language } = useLanguage();
  const router = useRouter();

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: December 4, 2025',
      sections: [
        {
          title: '1. Acceptance of Terms',
          content: `By accessing or using FinFlow ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.`
        },
        {
          title: '2. Description of Service',
          content: `FinFlow is a personal finance management application that allows users to:
          
• Track income and expenses
• Manage multiple accounts and budgets
• View cryptocurrency portfolios
• Connect to banking services via Open Banking
• Use automated trading features (at your own risk)

The Service is provided "as is" and "as available" without warranties of any kind.`
        },
        {
          title: '3. User Accounts',
          content: `To use FinFlow, you must:
          
• Be at least 16 years old
• Provide accurate registration information
• Keep your login credentials secure
• Notify us immediately of any unauthorized access

You are responsible for all activities under your account.`
        },
        {
          title: '4. Acceptable Use',
          content: `You agree NOT to:
          
• Use the Service for illegal purposes
• Attempt to gain unauthorized access to our systems
• Upload malicious code or content
• Misrepresent your identity
• Use the Service to harm others
• Reverse engineer or copy our software`
        },
        {
          title: '5. Financial Information Disclaimer',
          content: `IMPORTANT: FinFlow is a tool for personal finance tracking and does NOT provide:
          
• Financial advice
• Investment recommendations
• Tax advice
• Legal advice

All financial decisions are your sole responsibility. Consult qualified professionals for financial advice.`
        },
        {
          title: '6. Trading Features',
          content: `If you use our trading agent or cryptocurrency features:
          
• Trading involves significant risk of loss
• Past performance does not guarantee future results
• You are solely responsible for your trading decisions
• We do not guarantee profits or prevent losses
• Automated trading may execute trades without manual confirmation

USE TRADING FEATURES AT YOUR OWN RISK.`
        },
        {
          title: '7. Third-Party Services',
          content: `FinFlow may integrate with third-party services:
          
• Binance (cryptocurrency)
• Alpaca (stock trading)
• Open Banking providers
• Other financial APIs

We are not responsible for third-party services. Review their terms separately.`
        },
        {
          title: '8. API Keys and Security',
          content: `When you provide API keys:
          
• You authorize us to access your accounts via those APIs
• You are responsible for managing API permissions
• We recommend using read-only keys where possible
• We encrypt and store keys securely, but cannot guarantee absolute security`
        },
        {
          title: '9. Intellectual Property',
          content: `FinFlow and its content are protected by copyright and other laws. You may not:
          
• Copy or distribute our software
• Use our trademarks without permission
• Create derivative works

Your data remains your property.`
        },
        {
          title: '10. Limitation of Liability',
          content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:
          
• We are not liable for any indirect, incidental, or consequential damages
• We are not liable for financial losses from trading features
• Our total liability is limited to the amount you paid us (if any)
• We are not responsible for third-party service failures`
        },
        {
          title: '11. Indemnification',
          content: `You agree to indemnify and hold harmless FinFlow from any claims arising from:
          
• Your use of the Service
• Your violation of these Terms
• Your violation of any third-party rights`
        },
        {
          title: '12. Termination',
          content: `We may suspend or terminate your account if you:
          
• Violate these Terms
• Engage in fraudulent activity
• Abuse the Service

You may delete your account at any time through the app settings.`
        },
        {
          title: '13. Changes to Terms',
          content: `We may modify these Terms at any time. We will notify you of significant changes. Continued use after changes constitutes acceptance of new terms.`
        },
        {
          title: '14. Governing Law',
          content: `These Terms are governed by the laws of Switzerland. Any disputes shall be resolved in the courts of Zurich, Switzerland.`
        },
        {
          title: '15. Contact',
          content: `For questions about these Terms:
          
Email: legal@finflowapp.ch
Address: FinFlow, Switzerland`
        }
      ]
    },
    de: {
      title: 'Nutzungsbedingungen',
      lastUpdated: 'Zuletzt aktualisiert: 4. Dezember 2025',
      sections: [
        {
          title: '1. Annahme der Bedingungen',
          content: `Durch den Zugriff auf oder die Nutzung von FinFlow ("der Dienst") erklären Sie sich mit diesen Nutzungsbedingungen einverstanden. Wenn Sie diesen Bedingungen nicht zustimmen, nutzen Sie den Dienst bitte nicht.`
        },
        {
          title: '2. Beschreibung des Dienstes',
          content: `FinFlow ist eine App zur persönlichen Finanzverwaltung, mit der Benutzer:
          
• Einnahmen und Ausgaben verfolgen
• Mehrere Konten und Budgets verwalten
• Kryptowährungs-Portfolios anzeigen
• Bankdienste über Open Banking verbinden
• Automatisierte Trading-Funktionen nutzen (auf eigenes Risiko)

Der Dienst wird "wie besehen" und "wie verfügbar" ohne jegliche Garantien bereitgestellt.`
        },
        {
          title: '3. Benutzerkonten',
          content: `Um FinFlow zu nutzen, müssen Sie:
          
• Mindestens 16 Jahre alt sein
• Korrekte Registrierungsinformationen angeben
• Ihre Zugangsdaten sicher aufbewahren
• Uns sofort über unbefugten Zugriff informieren

Sie sind für alle Aktivitäten unter Ihrem Konto verantwortlich.`
        },
        {
          title: '4. Zulässige Nutzung',
          content: `Sie verpflichten sich, NICHT:
          
• Den Dienst für illegale Zwecke zu nutzen
• Unbefugten Zugriff auf unsere Systeme zu versuchen
• Schädlichen Code oder Inhalte hochzuladen
• Ihre Identität falsch darzustellen
• Den Dienst zu nutzen, um anderen zu schaden
• Unsere Software zurückzuentwickeln oder zu kopieren`
        },
        {
          title: '5. Haftungsausschluss für Finanzinformationen',
          content: `WICHTIG: FinFlow ist ein Tool zur persönlichen Finanzverfolgung und bietet KEINE:
          
• Finanzberatung
• Anlageempfehlungen
• Steuerberatung
• Rechtsberatung

Alle Finanzentscheidungen liegen in Ihrer alleinigen Verantwortung. Konsultieren Sie qualifizierte Fachleute für Finanzberatung.`
        },
        {
          title: '6. Trading-Funktionen',
          content: `Wenn Sie unseren Trading-Agent oder Kryptowährungsfunktionen nutzen:
          
• Trading birgt erhebliche Verlustrisiken
• Vergangene Performance garantiert keine zukünftigen Ergebnisse
• Sie sind allein für Ihre Trading-Entscheidungen verantwortlich
• Wir garantieren keine Gewinne und verhindern keine Verluste
• Automatisiertes Trading kann Trades ohne manuelle Bestätigung ausführen

NUTZUNG DER TRADING-FUNKTIONEN AUF EIGENES RISIKO.`
        },
        {
          title: '7. Drittanbieter-Dienste',
          content: `FinFlow kann mit Drittanbieter-Diensten integrieren:
          
• Binance (Kryptowährung)
• Alpaca (Aktienhandel)
• Open Banking-Anbieter
• Andere Finanz-APIs

Wir sind nicht verantwortlich für Drittanbieter-Dienste.`
        },
        {
          title: '8. API-Schlüssel und Sicherheit',
          content: `Wenn Sie API-Schlüssel bereitstellen:
          
• Autorisieren Sie uns, über diese APIs auf Ihre Konten zuzugreifen
• Sie sind für die Verwaltung der API-Berechtigungen verantwortlich
• Wir empfehlen, wo möglich schreibgeschützte Schlüssel zu verwenden
• Wir verschlüsseln und speichern Schlüssel sicher`
        },
        {
          title: '9. Geistiges Eigentum',
          content: `FinFlow und seine Inhalte sind durch Urheberrecht geschützt. Sie dürfen nicht:
          
• Unsere Software kopieren oder verteilen
• Unsere Marken ohne Erlaubnis verwenden
• Abgeleitete Werke erstellen

Ihre Daten bleiben Ihr Eigentum.`
        },
        {
          title: '10. Haftungsbeschränkung',
          content: `IM GESETZLICH ZULÄSSIGEN UMFANG:
          
• Wir haften nicht für indirekte oder Folgeschäden
• Wir haften nicht für finanzielle Verluste aus Trading-Funktionen
• Unsere Gesamthaftung ist auf den von Ihnen gezahlten Betrag beschränkt
• Wir sind nicht verantwortlich für Ausfälle von Drittanbieter-Diensten`
        },
        {
          title: '11. Kündigung',
          content: `Wir können Ihr Konto sperren oder kündigen, wenn Sie:
          
• Diese Bedingungen verletzen
• Betrügerische Aktivitäten durchführen
• Den Dienst missbrauchen

Sie können Ihr Konto jederzeit über die App-Einstellungen löschen.`
        },
        {
          title: '12. Änderungen der Bedingungen',
          content: `Wir können diese Bedingungen jederzeit ändern. Wir werden Sie über wesentliche Änderungen informieren. Die fortgesetzte Nutzung nach Änderungen gilt als Annahme der neuen Bedingungen.`
        },
        {
          title: '13. Anwendbares Recht',
          content: `Diese Bedingungen unterliegen dem Recht der Schweiz. Streitigkeiten werden vor den Gerichten in Zürich, Schweiz, beigelegt.`
        },
        {
          title: '14. Kontakt',
          content: `Bei Fragen zu diesen Bedingungen:
          
E-Mail: legal@finflowapp.ch
Adresse: FinFlow, Schweiz`
        }
      ]
    },
    fr: {
      title: 'Conditions d\'Utilisation',
      lastUpdated: 'Dernière mise à jour: 4 décembre 2025',
      sections: [
        {
          title: '1. Acceptation des Conditions',
          content: `En accédant ou en utilisant FinFlow ("le Service"), vous acceptez d'être lié par ces Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Service.`
        },
        {
          title: '2. Description du Service',
          content: `FinFlow est une application de gestion financière personnelle permettant aux utilisateurs de:
          
• Suivre les revenus et dépenses
• Gérer plusieurs comptes et budgets
• Consulter les portefeuilles de cryptomonnaies
• Se connecter aux services bancaires via l'Open Banking
• Utiliser des fonctionnalités de trading automatisé (à vos risques)

Le Service est fourni "tel quel" sans garanties d'aucune sorte.`
        },
        {
          title: '3. Comptes Utilisateurs',
          content: `Pour utiliser FinFlow, vous devez:
          
• Avoir au moins 16 ans
• Fournir des informations d'inscription exactes
• Garder vos identifiants de connexion sécurisés
• Nous notifier immédiatement de tout accès non autorisé

Vous êtes responsable de toutes les activités sous votre compte.`
        },
        {
          title: '4. Utilisation Acceptable',
          content: `Vous acceptez de NE PAS:
          
• Utiliser le Service à des fins illégales
• Tenter d'accéder sans autorisation à nos systèmes
• Télécharger du code ou contenu malveillant
• Usurper votre identité
• Utiliser le Service pour nuire à autrui`
        },
        {
          title: '5. Avertissement sur les Informations Financières',
          content: `IMPORTANT: FinFlow est un outil de suivi financier personnel et NE fournit PAS:
          
• Conseils financiers
• Recommandations d'investissement
• Conseils fiscaux
• Conseils juridiques

Toutes les décisions financières sont sous votre seule responsabilité.`
        },
        {
          title: '6. Fonctionnalités de Trading',
          content: `Si vous utilisez nos fonctionnalités de trading:
          
• Le trading comporte un risque significatif de perte
• Les performances passées ne garantissent pas les résultats futurs
• Vous êtes seul responsable de vos décisions de trading
• Nous ne garantissons pas les profits

UTILISEZ LES FONCTIONNALITÉS DE TRADING À VOS PROPRES RISQUES.`
        },
        {
          title: '7. Limitation de Responsabilité',
          content: `DANS LES LIMITES PERMISES PAR LA LOI:
          
• Nous ne sommes pas responsables des dommages indirects
• Nous ne sommes pas responsables des pertes financières liées au trading
• Notre responsabilité totale est limitée au montant que vous nous avez payé`
        },
        {
          title: '8. Droit Applicable',
          content: `Ces Conditions sont régies par le droit suisse. Tout litige sera résolu devant les tribunaux de Zurich, Suisse.`
        },
        {
          title: '9. Contact',
          content: `Pour toute question concernant ces Conditions:
          
Email: legal@finflowapp.ch`
        }
      ]
    },
    ar: {
      title: 'شروط الخدمة',
      lastUpdated: 'آخر تحديث: 4 ديسمبر 2025',
      sections: [
        {
          title: '1. قبول الشروط',
          content: `بالوصول إلى أو استخدام FinFlow ("الخدمة")، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الخدمة.`
        },
        {
          title: '2. وصف الخدمة',
          content: `FinFlow هو تطبيق لإدارة التمويل الشخصي يتيح للمستخدمين:
          
• تتبع الدخل والمصروفات
• إدارة حسابات وميزانيات متعددة
• عرض محافظ العملات المشفرة
• الاتصال بالخدمات المصرفية عبر Open Banking

يتم تقديم الخدمة "كما هي" دون أي ضمانات.`
        },
        {
          title: '3. حسابات المستخدمين',
          content: `لاستخدام FinFlow، يجب عليك:
          
• أن تكون بعمر 16 عامًا على الأقل
• تقديم معلومات تسجيل دقيقة
• الحفاظ على بيانات تسجيل الدخول آمنة

أنت مسؤول عن جميع الأنشطة تحت حسابك.`
        },
        {
          title: '4. إخلاء المسؤولية المالية',
          content: `هام: FinFlow هو أداة لتتبع التمويل الشخصي ولا يقدم:
          
• نصائح مالية
• توصيات استثمارية
• استشارات ضريبية

جميع القرارات المالية هي مسؤوليتك وحدك.`
        },
        {
          title: '5. ميزات التداول',
          content: `إذا كنت تستخدم ميزات التداول:
          
• ينطوي التداول على مخاطر كبيرة للخسارة
• الأداء السابق لا يضمن النتائج المستقبلية
• أنت وحدك المسؤول عن قرارات التداول الخاصة بك

استخدم ميزات التداول على مسؤوليتك الخاصة.`
        },
        {
          title: '6. تحديد المسؤولية',
          content: `إلى أقصى حد يسمح به القانون:
          
• نحن غير مسؤولين عن أي أضرار غير مباشرة
• نحن غير مسؤولين عن الخسائر المالية من ميزات التداول`
        },
        {
          title: '7. اتصل بنا',
          content: `للأسئلة حول هذه الشروط:
          
البريد الإلكتروني: legal@finflowapp.ch`
        }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a1f26]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentContent.title}
          </h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {currentContent.lastUpdated}
        </p>

        <div className="space-y-6">
          {currentContent.sections.map((section, index) => (
            <div key={index} className="bg-white dark:bg-[#1a1f26] rounded-xl p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
