import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/sidebar-provider"
import { MainNav } from "@/components/main-nav"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { UserNav } from "@/components/user-nav"
import { WalletConnect } from "@/components/wallet-connect"
import { ParticlesBackground } from "@/components/particles-background"
import { AnimatedGradientBackground } from "@/components/animated-gradient-background"
import { ClientLoadingScreen } from "@/components/client-loading-screen"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LabShareDAO - Decentralized Research Collaboration",
  description: "A decentralized platform for research labs to securely share data and collaborate",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/inter.woff" as="font" type="font/woff" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ClientLoadingScreen />
          <SidebarProvider>
            <AnimatedGradientBackground />
            <ParticlesBackground />
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30">
                <div className="container flex h-16 items-center justify-between py-4">
                  <MainNav />
                  <div className="flex items-center gap-4">
                    <WalletConnect />
                    <UserNav />
                  </div>
                </div>
              </header>
              <MobileSidebar />
              <main className="flex-1">{children}</main>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
