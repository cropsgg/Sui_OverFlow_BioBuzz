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
import { BlockchainProvider } from "@/blockchain/provider"
import { AuthProvider } from "@/lib/auth-context"

import Script from "next/script"

// Configure Inter font with proper display settings
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
})

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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Remove the custom font preload that was causing errors */}
      </head>
      <body suppressHydrationWarning className={inter.className}>
        {/* Script to detect wallet provider and console log it */}
        <Script id="detect-wallet" strategy="afterInteractive">
          {`
            function checkWallets() {
              const providers = {
                slush: window.slush,
                wallet: window.wallet,
                suiWallet: window.suiWallet,
                sui: window.sui,
                ethos: window.ethereum?.isEthos ? window.ethereum : null
              };
              
              console.log('Detected wallet providers:', 
                Object.entries(providers)
                  .filter(([name, provider]) => provider)
                  .map(([name]) => name)
              );
            }
            
            // Run immediately and after a delay in case wallet injects later
            checkWallets();
            setTimeout(checkWallets, 1000);
          `}
        </Script>
        
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ClientLoadingScreen />
          <AuthProvider>
            <BlockchainProvider>
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
            </BlockchainProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
