"use client"

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { labShareDAO } from './sui-contracts'
import { labShareDAOClient } from './labshare-dao'
import { DAO_OBJECT_ID, PACKAGE_ID } from './sui-client'

// Create a context for the blockchain
type BlockchainContextType = {
  daoClient: typeof labShareDAO
  isConnected: boolean
  walletAddress: string | null
  packageId: string
  daoObjectId: string
  transactions: string[]
  addTransaction: (txId: string) => void
  walletProvider: any | null 
}

const defaultContext: BlockchainContextType = {
  daoClient: labShareDAO, // Start with mock implementation
  isConnected: false,
  walletAddress: null,
  packageId: PACKAGE_ID,
  daoObjectId: DAO_OBJECT_ID,
  transactions: [],
  addTransaction: () => {},
  walletProvider: null
}

const BlockchainContext = createContext<BlockchainContextType>(defaultContext)

// Hook to use the blockchain context
export const useBlockchain = () => useContext(BlockchainContext)

export const BlockchainProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<string[]>([])
  const [walletProvider, setWalletProvider] = useState<any | null>(null)
  
  // Always use the real implementation connected to testnet for all environments
  const daoClient = labShareDAOClient // Real contract implementation

  // Check all available wallet providers
  const checkAvailableWallets = () => {
    if (typeof window === 'undefined') return null;
    
    // Check for multiple wallet types in priority order
    const wallets = [
      { name: 'slush', provider: (window as any).slush },
      { name: 'standard', provider: (window as any).wallet },
      { name: 'sui', provider: (window as any).sui },
      { name: 'legacy', provider: (window as any).suiWallet },
      { name: 'ethos', provider: (window as any).ethereum?.isEthos ? (window as any).ethereum : null }
    ];
    
    // Return the first available provider
    for (const wallet of wallets) {
      if (wallet.provider) {
        console.log(`Detected wallet: ${wallet.name}`);
        return wallet.provider;
      }
    }
    
    return null;
  };

  useEffect(() => {
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined') {
        // Get the first available wallet provider
        const provider = checkAvailableWallets();
        if (provider) {
          setWalletProvider(provider);
          
          try {
            // Check if already connected
            const accounts = await provider.getAccounts();
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              setIsConnected(true);
            }
          } catch (e) {
            console.log('Wallet not connected yet');
          }
        }
      }
    }

    checkWalletConnection();
    
    // Setup event listener for wallet changes if provider supports it
    const setupWalletListeners = () => {
      if (typeof window !== 'undefined') {
        // Slush wallet events
        const slushWallet = (window as any).slush;
        if (slushWallet && slushWallet.on) {
          slushWallet.on('accountChanged', (accounts: string[]) => {
            console.log('Slush wallet account changed', accounts);
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              setIsConnected(true);
            } else {
              setWalletAddress(null);
              setIsConnected(false);
            }
          });
        }
        
        // Standard wallet events
        const standardWallet = (window as any).wallet;
        if (standardWallet && standardWallet.on) {
          standardWallet.on('accountChanged', (accounts: string[]) => {
            console.log('Standard wallet account changed', accounts);
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              setIsConnected(true);
            } else {
              setWalletAddress(null);
              setIsConnected(false);
            }
          });
        }
      }
    };
    
    // Setup wallet event listeners
    setupWalletListeners();
    
    // Cleanup event listeners
    return () => {
      if (typeof window !== 'undefined') {
        const slushWallet = (window as any).slush;
        if (slushWallet && slushWallet.off) {
          slushWallet.off('accountChanged');
        }
        
        const standardWallet = (window as any).wallet;
        if (standardWallet && standardWallet.off) {
          standardWallet.off('accountChanged');
        }
      }
    };
  }, [])

  useEffect(() => {
    // handler functions
    const onWalletConnected = (e: any) => {
      const address = e.detail?.address;
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
      }
    };
    const onWalletDisconnected = () => {
      setWalletAddress(null);
      setIsConnected(false);
    };
    
    window.addEventListener('walletConnected', onWalletConnected as any);
    window.addEventListener('walletDisconnected', onWalletDisconnected);
    
    return () => {
      window.removeEventListener('walletConnected', onWalletConnected as any);
      window.removeEventListener('walletDisconnected', onWalletDisconnected);
    };
  }, []);

  // Function to add a transaction to history
  const addTransaction = (txId: string) => {
    setTransactions((prev) => [txId, ...prev])
  }

  return (
    <BlockchainContext.Provider 
      value={{ 
        daoClient, 
        isConnected, 
        walletAddress, 
        packageId: PACKAGE_ID, 
        daoObjectId: DAO_OBJECT_ID,
        transactions,
        addTransaction,
        walletProvider
      }}
    >
      {children}
    </BlockchainContext.Provider>
  )
} 