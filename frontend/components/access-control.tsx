"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useBlockchain } from "@/blockchain/provider"
import { WalletConnect } from "./wallet-connect"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"

export function AccessControl({ children }: { children: React.ReactNode }) {
  const { isConnected, walletAddress } = useBlockchain()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything during SSR
  if (!mounted) return null

  // If wallet is connected, render the children
  if (isConnected && walletAddress) {
    return <>{children}</>
  }

  // If wallet is not connected, show access denied message
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[70vh] py-12">
      <Card className="max-w-md w-full glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl">Wallet Connection Required</CardTitle>
          <CardDescription>
            You need to connect your wallet to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-center text-muted-foreground mb-4">
            This page contains DAO governance features that require a connected wallet for access.
            Please connect your wallet to continue.
          </p>
          <WalletConnect />
        </CardContent>
      </Card>
    </div>
  )
} 