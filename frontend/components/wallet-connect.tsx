"use client"

import { GlowingButton } from "@/components/glowing-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Copy, ExternalLink, Wallet } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

export function WalletConnect() {
  const [connected, setConnected] = useState(false)
  const walletAddress = "0x7a16ff...3a91"

  const handleConnect = () => {
    // Simulate wallet connection
    setConnected(true)
    toast({
      title: "Wallet Connected",
      description: "Successfully connected to Sui wallet",
    })
  }

  const handleCopy = () => {
    // Simulate copying address
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    })
  }

  if (!connected) {
    return (
      <GlowingButton onClick={handleConnect} className="gap-2" glowColor="rgba(59, 130, 246, 0.7)">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </GlowingButton>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <GlowingButton variant="outline" className="gap-2 neon-border" isAnimated={false}>
            <motion.div
              className="h-2 w-2 rounded-full bg-green-500"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(34, 197, 94, 0.7)",
                  "0 0 10px rgba(34, 197, 94, 0.7)",
                  "0 0 0px rgba(34, 197, 94, 0.7)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
            {walletAddress}
          </GlowingButton>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-blue-500/30">
        <DropdownMenuLabel className="gradient-text">Sui Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopy} className="hover:bg-blue-500/10 cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-blue-500/10 cursor-pointer">
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View on Explorer</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setConnected(false)} className="hover:bg-blue-500/10 cursor-pointer">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
