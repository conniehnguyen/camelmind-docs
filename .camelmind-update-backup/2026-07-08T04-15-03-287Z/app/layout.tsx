import type { Metadata } from "next"
import { Alegreya, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { SearchModal } from "@/components/Search/SearchModal"
import { ThemeProvider } from "next-themes"
import { getConfig } from "@/lib/config"

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

const config = getConfig()

export const metadata: Metadata = {
  title: config.title,
  description: config.tagline,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${alegreya.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[var(--cm-bg-primary)] text-[var(--cm-text-primary)]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <SearchModal />
        </ThemeProvider>
      </body>
    </html>
  )
}
