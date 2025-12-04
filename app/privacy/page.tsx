'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const router = useRouter();

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: December 4, 2025',
      sections: [
        {
          title: '1. Introduction',
          content: `Welcome to FinFlow ("we", "our", "us"). We are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our financial management application.`
        },
        {
          title: '2. Data Controller',
          content: `FinFlow is the data controller responsible for your personal data. If you have any questions about this Privacy Policy, please contact us at: privacy@finflowapp.ch`
        },
        {
          title: '3. Data We Collect',
          content: `We collect the following types of data:
          
• Account Information: Email address, name, password (encrypted)
• Financial Data: Transaction records, account balances, budget information, categories
• Technical Data: Device information, IP address, app usage statistics
• API Keys: If you connect external services (Binance, Alpaca), your API keys are stored encrypted
• Bank Connections: If you use Open Banking features, we store connection tokens (not your bank credentials)`
        },
        {
          title: '4. How We Use Your Data',
          content: `We use your data to:
          
• Provide and maintain our financial management services
• Sync your financial data across devices
• Generate reports and analytics about your finances
• Send important notifications about your accounts
• Improve our services and user experience
• Ensure security and prevent fraud`
        },
        {
          title: '5. Data Storage and Security',
          content: `Your data is stored securely on servers located in Switzerland/EU. We implement industry-standard security measures including:
          
• AES-256 encryption for sensitive data (API keys)
• TLS/HTTPS for all data transmission
• Bcrypt hashing for passwords
• Regular security audits`
        },
        {
          title: '6. Data Sharing',
          content: `We do not sell your personal data. We may share data with:
          
• Third-party service providers who assist in operating our services (hosting, analytics)
• Financial institutions when you use Open Banking features (with your explicit consent)
• Law enforcement when legally required`
        },
        {
          title: '7. Your Rights (GDPR)',
          content: `Under GDPR, you have the right to:
          
• Access: Request a copy of your personal data
• Rectification: Correct inaccurate data
• Erasure: Request deletion of your data ("right to be forgotten")
• Data Portability: Export your data in a machine-readable format
• Object: Object to certain processing of your data
• Withdraw Consent: Withdraw consent at any time

To exercise these rights, contact us at privacy@finflowapp.ch or use the in-app settings.`
        },
        {
          title: '8. Data Retention',
          content: `We retain your data for as long as your account is active. After account deletion:
          
• Your data is anonymized within 30 days
• Backup data is purged within 90 days
• Legal/compliance records may be retained longer as required by law`
        },
        {
          title: '9. Cookies and Tracking',
          content: `Our web application uses minimal cookies:
          
• Essential cookies for authentication (session tokens)
• We do not use advertising cookies or trackers
• No third-party analytics on the mobile app`
        },
        {
          title: '10. Children\'s Privacy',
          content: `FinFlow is not intended for users under 16 years of age. We do not knowingly collect data from children.`
        },
        {
          title: '11. Changes to This Policy',
          content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.`
        },
        {
          title: '12. Contact Us',
          content: `For privacy-related inquiries:
          
Email: privacy@finflowapp.ch
Address: FinFlow, Switzerland`
        }
      ]
    },
    de: {
      title: 'Datenschutzerklärung',
      lastUpdated: 'Zuletzt aktualisiert: 4. Dezember 2025',
      sections: [
        {
          title: '1. Einleitung',
          content: `Willkommen bei FinFlow ("wir", "uns", "unser"). Wir verpflichten uns, Ihre persönlichen Daten zu schützen und Ihre Privatsphäre zu respektieren. Diese Datenschutzerklärung erklärt, wie wir Ihre Informationen sammeln, verwenden und schützen, wenn Sie unsere Finanzverwaltungs-App nutzen.`
        },
        {
          title: '2. Verantwortlicher',
          content: `FinFlow ist der für Ihre personenbezogenen Daten verantwortliche Datencontroller. Bei Fragen zu dieser Datenschutzerklärung kontaktieren Sie uns unter: privacy@finflowapp.ch`
        },
        {
          title: '3. Daten, die wir erheben',
          content: `Wir erheben folgende Datentypen:
          
• Kontoinformationen: E-Mail-Adresse, Name, Passwort (verschlüsselt)
• Finanzdaten: Transaktionen, Kontostände, Budget-Informationen, Kategorien
• Technische Daten: Geräteinformationen, IP-Adresse, App-Nutzungsstatistiken
• API-Schlüssel: Bei Verbindung externer Dienste (Binance, Alpaca) werden Ihre API-Schlüssel verschlüsselt gespeichert
• Bankverbindungen: Bei Nutzung von Open Banking speichern wir Verbindungs-Tokens (nicht Ihre Bankzugangsdaten)`
        },
        {
          title: '4. Verwendung Ihrer Daten',
          content: `Wir verwenden Ihre Daten um:
          
• Unsere Finanzverwaltungsdienste bereitzustellen
• Ihre Finanzdaten geräteübergreifend zu synchronisieren
• Berichte und Analysen über Ihre Finanzen zu erstellen
• Wichtige Benachrichtigungen zu Ihren Konten zu senden
• Unsere Dienste und Benutzererfahrung zu verbessern
• Sicherheit zu gewährleisten und Betrug zu verhindern`
        },
        {
          title: '5. Datenspeicherung und Sicherheit',
          content: `Ihre Daten werden sicher auf Servern in der Schweiz/EU gespeichert. Wir setzen branchenübliche Sicherheitsmaßnahmen ein:
          
• AES-256-Verschlüsselung für sensible Daten (API-Schlüssel)
• TLS/HTTPS für alle Datenübertragungen
• Bcrypt-Hashing für Passwörter
• Regelmäßige Sicherheitsaudits`
        },
        {
          title: '6. Datenweitergabe',
          content: `Wir verkaufen Ihre persönlichen Daten nicht. Wir können Daten teilen mit:
          
• Drittanbieter-Dienstleister, die uns beim Betrieb unterstützen (Hosting, Analyse)
• Finanzinstitute bei Nutzung von Open Banking (mit Ihrer ausdrücklichen Zustimmung)
• Strafverfolgungsbehörden, wenn gesetzlich vorgeschrieben`
        },
        {
          title: '7. Ihre Rechte (DSGVO)',
          content: `Nach der DSGVO haben Sie das Recht auf:
          
• Auskunft: Eine Kopie Ihrer personenbezogenen Daten anfordern
• Berichtigung: Unrichtige Daten korrigieren
• Löschung: Löschung Ihrer Daten verlangen ("Recht auf Vergessenwerden")
• Datenübertragbarkeit: Ihre Daten in maschinenlesbarem Format exportieren
• Widerspruch: Der Verarbeitung Ihrer Daten widersprechen
• Widerruf der Einwilligung: Ihre Einwilligung jederzeit widerrufen

Um diese Rechte auszuüben, kontaktieren Sie uns unter privacy@finflowapp.ch oder nutzen Sie die In-App-Einstellungen.`
        },
        {
          title: '8. Datenaufbewahrung',
          content: `Wir bewahren Ihre Daten auf, solange Ihr Konto aktiv ist. Nach Kontolöschung:
          
• Ihre Daten werden innerhalb von 30 Tagen anonymisiert
• Backup-Daten werden innerhalb von 90 Tagen gelöscht
• Rechtliche/Compliance-Aufzeichnungen können länger aufbewahrt werden`
        },
        {
          title: '9. Cookies und Tracking',
          content: `Unsere Web-Anwendung verwendet minimale Cookies:
          
• Essentielle Cookies für Authentifizierung (Session-Tokens)
• Wir verwenden keine Werbe-Cookies oder Tracker
• Keine Drittanbieter-Analytics in der mobilen App`
        },
        {
          title: '10. Datenschutz für Kinder',
          content: `FinFlow ist nicht für Nutzer unter 16 Jahren bestimmt. Wir sammeln wissentlich keine Daten von Kindern.`
        },
        {
          title: '11. Änderungen dieser Richtlinie',
          content: `Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren. Wir werden Sie über wesentliche Änderungen per E-Mail oder In-App-Benachrichtigung informieren.`
        },
        {
          title: '12. Kontakt',
          content: `Für datenschutzbezogene Anfragen:
          
E-Mail: privacy@finflowapp.ch
Adresse: FinFlow, Schweiz`
        }
      ]
    },
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdated: 'Dernière mise à jour: 4 décembre 2025',
      sections: [
        {
          title: '1. Introduction',
          content: `Bienvenue sur FinFlow ("nous", "notre"). Nous nous engageons à protéger vos données personnelles et à respecter votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre application de gestion financière.`
        },
        {
          title: '2. Responsable du traitement',
          content: `FinFlow est le responsable du traitement de vos données personnelles. Pour toute question concernant cette politique, contactez-nous à: privacy@finflowapp.ch`
        },
        {
          title: '3. Données collectées',
          content: `Nous collectons les types de données suivants:
          
• Informations de compte: Adresse e-mail, nom, mot de passe (crypté)
• Données financières: Transactions, soldes, informations budgétaires, catégories
• Données techniques: Informations sur l'appareil, adresse IP, statistiques d'utilisation
• Clés API: Si vous connectez des services externes (Binance, Alpaca), vos clés API sont stockées de manière cryptée
• Connexions bancaires: Si vous utilisez l'Open Banking, nous stockons les tokens de connexion (pas vos identifiants bancaires)`
        },
        {
          title: '4. Utilisation des données',
          content: `Nous utilisons vos données pour:
          
• Fournir et maintenir nos services de gestion financière
• Synchroniser vos données financières entre appareils
• Générer des rapports et analyses sur vos finances
• Envoyer des notifications importantes sur vos comptes
• Améliorer nos services et l'expérience utilisateur
• Assurer la sécurité et prévenir la fraude`
        },
        {
          title: '5. Stockage et sécurité',
          content: `Vos données sont stockées de manière sécurisée sur des serveurs en Suisse/UE. Nous mettons en œuvre des mesures de sécurité standard:
          
• Cryptage AES-256 pour les données sensibles
• TLS/HTTPS pour toutes les transmissions
• Hachage Bcrypt pour les mots de passe
• Audits de sécurité réguliers`
        },
        {
          title: '6. Partage des données',
          content: `Nous ne vendons pas vos données personnelles. Nous pouvons partager des données avec:
          
• Prestataires tiers qui nous aident à exploiter nos services
• Institutions financières lors de l'utilisation de l'Open Banking (avec votre consentement)
• Forces de l'ordre lorsque la loi l'exige`
        },
        {
          title: '7. Vos droits (RGPD)',
          content: `En vertu du RGPD, vous avez le droit de:
          
• Accès: Demander une copie de vos données personnelles
• Rectification: Corriger les données inexactes
• Effacement: Demander la suppression de vos données
• Portabilité: Exporter vos données dans un format lisible
• Opposition: Vous opposer à certains traitements
• Retrait du consentement: Retirer votre consentement à tout moment

Pour exercer ces droits, contactez-nous à privacy@finflowapp.ch.`
        },
        {
          title: '8. Conservation des données',
          content: `Nous conservons vos données tant que votre compte est actif. Après suppression:
          
• Vos données sont anonymisées sous 30 jours
• Les sauvegardes sont purgées sous 90 jours`
        },
        {
          title: '9. Cookies',
          content: `Notre application web utilise des cookies minimaux:
          
• Cookies essentiels pour l'authentification
• Pas de cookies publicitaires ni de traceurs`
        },
        {
          title: '10. Contact',
          content: `Pour les demandes relatives à la confidentialité:
          
E-mail: privacy@finflowapp.ch`
        }
      ]
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 4 ديسمبر 2025',
      sections: [
        {
          title: '1. مقدمة',
          content: `مرحبًا بك في FinFlow. نحن ملتزمون بحماية بياناتك الشخصية واحترام خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك عند استخدام تطبيقنا للإدارة المالية.`
        },
        {
          title: '2. مراقب البيانات',
          content: `FinFlow هو المتحكم في البيانات المسؤول عن بياناتك الشخصية. للاستفسارات، تواصل معنا على: privacy@finflowapp.ch`
        },
        {
          title: '3. البيانات التي نجمعها',
          content: `نجمع الأنواع التالية من البيانات:
          
• معلومات الحساب: البريد الإلكتروني، الاسم، كلمة المرور (مشفرة)
• البيانات المالية: سجلات المعاملات، أرصدة الحسابات، معلومات الميزانية
• البيانات التقنية: معلومات الجهاز، عنوان IP
• مفاتيح API: يتم تخزين مفاتيح API المشفرة للخدمات الخارجية`
        },
        {
          title: '4. كيف نستخدم بياناتك',
          content: `نستخدم بياناتك من أجل:
          
• تقديم وصيانة خدمات الإدارة المالية
• مزامنة بياناتك المالية عبر الأجهزة
• إنشاء تقارير وتحليلات حول أموالك
• إرسال إشعارات مهمة
• تحسين خدماتنا`
        },
        {
          title: '5. الأمان',
          content: `يتم تخزين بياناتك بشكل آمن مع:
          
• تشفير AES-256 للبيانات الحساسة
• TLS/HTTPS لجميع عمليات نقل البيانات
• تدقيقات أمنية منتظمة`
        },
        {
          title: '6. حقوقك',
          content: `لديك الحق في:
          
• الوصول إلى بياناتك الشخصية
• تصحيح البيانات غير الدقيقة
• طلب حذف بياناتك
• تصدير بياناتك
• سحب موافقتك في أي وقت

لممارسة هذه الحقوق، اتصل بنا على privacy@finflowapp.ch`
        },
        {
          title: '7. اتصل بنا',
          content: `للاستفسارات المتعلقة بالخصوصية:
          
البريد الإلكتروني: privacy@finflowapp.ch`
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
