'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ArrowLeft, Mail, MapPin, Globe, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ImpressumPage() {
  const { language } = useLanguage();
  const router = useRouter();

  const content = {
    en: {
      title: 'Legal Notice',
      subtitle: 'Information according to § 5 TMG (German Telemedia Act)',
      company: {
        title: 'Company Information',
        name: 'FinFlow',
        type: 'Financial Technology Application',
        description: 'Personal finance management and portfolio tracking software'
      },
      contact: {
        title: 'Contact',
        email: 'contact@finflowapp.ch',
        support: 'support@finflowapp.ch',
        privacy: 'privacy@finflowapp.ch'
      },
      address: {
        title: 'Address',
        line1: 'FinFlow',
        line2: 'Switzerland'
      },
      responsible: {
        title: 'Responsible for Content',
        text: 'According to § 55 Abs. 2 RStV (German Interstate Broadcasting Treaty)'
      },
      disclaimer: {
        title: 'Disclaimer',
        liability: {
          title: 'Liability for Content',
          text: 'The contents of our pages have been created with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content. As a service provider, we are responsible for our own content on these pages according to general laws. However, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.'
        },
        links: {
          title: 'Liability for Links',
          text: 'Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the contents of the linked pages.'
        },
        copyright: {
          title: 'Copyright',
          text: 'The content and works on these pages created by the site operators are subject to copyright. Duplication, processing, distribution, or any form of commercialization of such material beyond the scope of copyright law requires the prior written consent of the respective author or creator.'
        }
      },
      financial: {
        title: 'Financial Disclaimer',
        text: 'FinFlow is a tool for personal financial management and does NOT provide investment advice, tax advice, or legal advice. All information is provided for informational purposes only. Trading cryptocurrencies and stocks involves significant risk. Past performance is not indicative of future results. Always consult with qualified professionals before making financial decisions.'
      },
      dispute: {
        title: 'Dispute Resolution',
        text: 'The European Commission provides a platform for online dispute resolution (OS): https://ec.europa.eu/consumers/odr. We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.'
      }
    },
    de: {
      title: 'Impressum',
      subtitle: 'Angaben gemäß § 5 TMG',
      company: {
        title: 'Unternehmensangaben',
        name: 'FinFlow',
        type: 'Finanztechnologie-Anwendung',
        description: 'Software zur persönlichen Finanzverwaltung und Portfolio-Tracking'
      },
      contact: {
        title: 'Kontakt',
        email: 'contact@finflowapp.ch',
        support: 'support@finflowapp.ch',
        privacy: 'privacy@finflowapp.ch'
      },
      address: {
        title: 'Adresse',
        line1: 'FinFlow',
        line2: 'Schweiz'
      },
      responsible: {
        title: 'Verantwortlich für den Inhalt',
        text: 'Gemäß § 55 Abs. 2 RStV'
      },
      disclaimer: {
        title: 'Haftungsausschluss',
        liability: {
          title: 'Haftung für Inhalte',
          text: 'Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.'
        },
        links: {
          title: 'Haftung für Links',
          text: 'Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.'
        },
        copyright: {
          title: 'Urheberrecht',
          text: 'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.'
        }
      },
      financial: {
        title: 'Finanzrechtlicher Hinweis',
        text: 'FinFlow ist ein Tool zur persönlichen Finanzverwaltung und bietet KEINE Anlageberatung, Steuerberatung oder Rechtsberatung. Alle Informationen dienen nur zu Informationszwecken. Der Handel mit Kryptowährungen und Aktien birgt erhebliche Risiken. Die Wertentwicklung in der Vergangenheit ist kein Indikator für zukünftige Ergebnisse. Konsultieren Sie immer qualifizierte Fachleute, bevor Sie finanzielle Entscheidungen treffen.'
      },
      dispute: {
        title: 'Streitschlichtung',
        text: 'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.'
      }
    },
    fr: {
      title: 'Mentions Légales',
      subtitle: 'Informations conformément à la législation',
      company: {
        title: 'Informations sur l\'entreprise',
        name: 'FinFlow',
        type: 'Application de technologie financière',
        description: 'Logiciel de gestion financière personnelle et de suivi de portefeuille'
      },
      contact: {
        title: 'Contact',
        email: 'contact@finflowapp.ch',
        support: 'support@finflowapp.ch',
        privacy: 'privacy@finflowapp.ch'
      },
      address: {
        title: 'Adresse',
        line1: 'FinFlow',
        line2: 'Suisse'
      },
      responsible: {
        title: 'Responsable du contenu',
        text: 'Conformément à la réglementation en vigueur'
      },
      disclaimer: {
        title: 'Avertissement',
        liability: {
          title: 'Responsabilité du contenu',
          text: 'Le contenu de nos pages a été créé avec le plus grand soin. Cependant, nous ne pouvons garantir l\'exactitude, l\'exhaustivité ou l\'actualité du contenu.'
        },
        links: {
          title: 'Responsabilité des liens',
          text: 'Notre offre contient des liens vers des sites web externes de tiers sur le contenu desquels nous n\'avons aucune influence. Par conséquent, nous ne pouvons assumer aucune responsabilité pour ces contenus externes.'
        },
        copyright: {
          title: 'Droits d\'auteur',
          text: 'Le contenu et les œuvres créés par les opérateurs du site sont soumis au droit d\'auteur. La reproduction, le traitement, la distribution ou toute forme de commercialisation nécessite le consentement écrit préalable de l\'auteur.'
        }
      },
      financial: {
        title: 'Avertissement financier',
        text: 'FinFlow est un outil de gestion financière personnelle et NE fournit PAS de conseils en investissement, conseils fiscaux ou conseils juridiques. Le trading de cryptomonnaies et d\'actions comporte des risques importants.'
      },
      dispute: {
        title: 'Résolution des litiges',
        text: 'La Commission européenne fournit une plateforme de règlement des litiges en ligne: https://ec.europa.eu/consumers/odr'
      }
    },
    ar: {
      title: 'الإشعار القانوني',
      subtitle: 'معلومات وفقًا للتشريعات',
      company: {
        title: 'معلومات الشركة',
        name: 'FinFlow',
        type: 'تطبيق التكنولوجيا المالية',
        description: 'برنامج إدارة التمويل الشخصي وتتبع المحفظة'
      },
      contact: {
        title: 'اتصل بنا',
        email: 'contact@finflowapp.ch',
        support: 'support@finflowapp.ch',
        privacy: 'privacy@finflowapp.ch'
      },
      address: {
        title: 'العنوان',
        line1: 'FinFlow',
        line2: 'سويسرا'
      },
      responsible: {
        title: 'المسؤول عن المحتوى',
        text: 'وفقًا للأنظمة المعمول بها'
      },
      disclaimer: {
        title: 'إخلاء المسؤولية',
        liability: {
          title: 'المسؤولية عن المحتوى',
          text: 'تم إنشاء محتوى صفحاتنا بأقصى قدر من العناية. ومع ذلك، لا يمكننا ضمان دقة أو اكتمال أو حداثة المحتوى.'
        },
        links: {
          title: 'المسؤولية عن الروابط',
          text: 'يحتوي عرضنا على روابط لمواقع خارجية لأطراف ثالثة، لا نملك أي تأثير على محتواها.'
        },
        copyright: {
          title: 'حقوق النشر',
          text: 'المحتوى والأعمال التي أنشأها مشغلو الموقع تخضع لحقوق النشر.'
        }
      },
      financial: {
        title: 'إخلاء المسؤولية المالية',
        text: 'FinFlow هو أداة لإدارة التمويل الشخصي ولا يقدم نصائح استثمارية. ينطوي التداول على مخاطر كبيرة.'
      },
      dispute: {
        title: 'حل النزاعات',
        text: 'توفر المفوضية الأوروبية منصة لحل النزاعات عبر الإنترنت'
      }
    }
  };

  const currentContent = content[language as keyof typeof content] || content.de;

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
          {currentContent.subtitle}
        </p>

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white dark:bg-[#1a1f26] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentContent.company.title}
              </h2>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white text-lg">{currentContent.company.name}</p>
              <p>{currentContent.company.type}</p>
              <p>{currentContent.company.description}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white dark:bg-[#1a1f26] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentContent.contact.title}
              </h2>
            </div>
            <div className="space-y-2 text-sm">
              <a href={`mailto:${currentContent.contact.email}`} className="block text-blue-600 dark:text-blue-400 hover:underline">
                📧 {currentContent.contact.email}
              </a>
              <a href={`mailto:${currentContent.contact.support}`} className="block text-blue-600 dark:text-blue-400 hover:underline">
                🛟 {currentContent.contact.support}
              </a>
              <a href={`mailto:${currentContent.contact.privacy}`} className="block text-blue-600 dark:text-blue-400 hover:underline">
                🔒 {currentContent.contact.privacy}
              </a>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-[#1a1f26] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentContent.address.title}
              </h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{currentContent.address.line1}</p>
              <p>{currentContent.address.line2}</p>
            </div>
          </div>

          {/* Responsible for Content */}
          <div className="bg-white dark:bg-[#1a1f26] rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {currentContent.responsible.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentContent.responsible.text}
            </p>
          </div>

          {/* Financial Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
              ⚠️ {currentContent.financial.title}
            </h2>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {currentContent.financial.text}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="bg-white dark:bg-[#1a1f26] rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {currentContent.disclaimer.title}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {currentContent.disclaimer.liability.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentContent.disclaimer.liability.text}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {currentContent.disclaimer.links.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentContent.disclaimer.links.text}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {currentContent.disclaimer.copyright.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentContent.disclaimer.copyright.text}
                </p>
              </div>
            </div>
          </div>

          {/* Dispute Resolution */}
          <div className="bg-white dark:bg-[#1a1f26] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentContent.dispute.title}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentContent.dispute.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
