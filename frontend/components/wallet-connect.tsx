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
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { connectWallet, disconnectWallet } from "@/blockchain/sui-client"
import { useBlockchain } from "@/blockchain/provider"

export function WalletConnect() {
  const { isConnected, walletAddress } = useBlockchain()
  const [shortAddress, setShortAddress] = useState<string>("0x0000...0000")
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (walletAddress) {
      setShortAddress(formatAddress(walletAddress))
    }
  }, [walletAddress])

  const formatAddress = (address: string): string => {
    if (!address) return "0x0000...0000";
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      // First check if any wallet extension exists
      if (typeof window !== 'undefined' && 
          !(window as any).wallet && 
          !(window as any).suiWallet && 
          !(window as any).slush && 
          !(window as any).sui &&
          !((window as any).ethereum?.isEthos)) {
        toast({
          title: "Wallet Extension Missing",
          description: "Please install a compatible Sui wallet extension (Sui Wallet, Slush, Ethos) and refresh the page",
          variant: "destructive"
        });
        return;
      }
      
      setIsConnecting(true);
      const address = await connectWallet();
      setIsConnecting(false);
      
      if (!address) {
        toast({
          title: "Connection Failed",
          description: "Could not connect to wallet. Please approve the connection request in your wallet extension.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to wallet",
        });
      }
    } catch (error) {
      setIsConnecting(false);
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to your wallet",
        variant: "destructive"
      });
    }
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleExplorer = () => {
    if (walletAddress) {
      // Open Sui Explorer with the address
      window.open(`https://suiexplorer.com/address/${walletAddress}?network=testnet`, '_blank');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected wallet",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Disconnect Error",
        description: "An error occurred while disconnecting your wallet",
        variant: "destructive"
      });
    }
  };

  if (!isConnected) {
    return (
      <GlowingButton 
        onClick={handleConnect} 
        className="gap-2" 
        glowColor="rgba(59, 130, 246, 0.7)"
        disabled={isConnecting}
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
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
            {shortAddress}
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
        <DropdownMenuItem onClick={handleExplorer} className="hover:bg-blue-500/10 cursor-pointer">
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View on Explorer</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="hover:bg-blue-500/10 cursor-pointer">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
