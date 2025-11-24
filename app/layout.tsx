import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ReactQueryProvider from "@/lib/react-query-provider"
import { Metadata } from "next"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "finflow Dashboard",
  description: "A modern dashboard with theme switching",
  icons: {
    icon: '/favicon.ico',
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
