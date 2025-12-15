import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ReactQueryProvider from "@/lib/react-query-provider"
import { Metadata, Viewport } from "next"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://finflowapp.ch'),
  title: "FinFlow - Smart Finance Manager",
  description: "Manage your finances, track investments, and monitor crypto portfolios with AI-powered insights",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinFlow',
    startupImage: [
      {
        url: '/splash/splash-1170x2532.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  applicationName: 'FinFlow',
  keywords: ['finance', 'budget', 'crypto', 'investment', 'money management', 'trading'],
  authors: [{ name: 'FinFlow Team' }],
  creator: 'FinFlow',
  publisher: 'FinFlow',
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'de_CH',
    url: 'https://finflowapp.ch',
    siteName: 'FinFlow',
    title: 'FinFlow - Smart Finance Manager',
    description: 'Manage your finances, track investments, and monitor crypto portfolios with AI-powered insights',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FinFlow - Smart Finance Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinFlow - Smart Finance Manager',
    description: 'Manage your finances, track investments, and monitor crypto portfolios',
    images: ['/og-image.png'],
  },
  generator: 'Next.js'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinFlow" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash/splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
      </head>
      <body className={inter.className} style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', margin: 0, padding: 0 }}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
          </ThemeProvider>
        </Providers>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
