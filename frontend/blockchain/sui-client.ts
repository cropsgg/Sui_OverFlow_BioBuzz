import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Constants for our deployed contract
export const NETWORK = 'testnet';
export const PACKAGE_ID = '0xf991deaaa879a5bd1279d679be9f8e950b86228b4273b5d03d85ddbebc4b342e';
export const DAO_MODULE = 'labshare_dao';
export const DAO_OBJECT_ID = '0x6a5fecd3debe0255b830e2bf21da7777b7898929ef22eb71cc33c723c2178eae';

// Connection configurations
const connections = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000',
};

// Initialize the provider
export const getProvider = () => {
  return new SuiClient({ url: connections[NETWORK] });
};

// Helper to create a transaction block
export const createTxBlock = () => {
  return new TransactionBlock();
};

// Check all possible wallet types in priority order
const getWalletProviders = () => {
  if (typeof window === 'undefined') return null;
  
  const providers = {
    // Slush wallet (formerly Sui Wallet + Stashed merger)
    slush: (window as any).slush,
    // Standard wallet interface
    standardWallet: (window as any).wallet,
    // Legacy Sui wallet
    suiWallet: (window as any).suiWallet, 
    // Ethos wallet
    ethos: (window as any).ethereum?.isEthos ? (window as any).ethereum : null,
    // Sui wallet
    sui: (window as any).sui
  };
  
  // Return the first available wallet provider
  for (const [name, provider] of Object.entries(providers)) {
    if (provider) {
      console.log(`Found wallet provider: ${name}`);
      return { provider, name };
    }
  }
  
  return null;
};

// Helper to connect wallet
export async function connectWallet() {
  if (typeof window === 'undefined') return null;
  
  try {
    const walletInfo = getWalletProviders();
    
    if (!walletInfo) {
      console.error('No Sui wallet extension found');
      return null;
    }
    
    const { provider, name } = walletInfo;
    let account: string | null = null;
    
    // Special handling for Slush wallet
    if (name === 'slush') {
      try {
        await provider.connect({ appName: 'LabShareDAO' });
        const accounts = await provider.getAccounts();
        account = accounts[0] || null;
      } catch (error) {
        console.error('Error connecting to Slush wallet:', error);
        return null;
      }
    } else if (name === 'standardWallet') {
      try {
        await provider.connect();
        const accounts = await provider.getAccounts();
        account = accounts[0] || null;
      } catch (error) {
        console.error('Error connecting to standard wallet:', error);
        return null;
      }
    } else if (name === 'suiWallet') {
      try {
        const response = await provider.requestPermissions();
        if (response) {
          const accounts = await provider.getAccounts();
          account = accounts[0] || null;
        }
      } catch (error) {
        console.error('Error connecting to legacy Sui wallet:', error);
        return null;
      }
    } else if (name === 'ethos' || name === 'sui') {
      try {
        await provider.connect();
        const accounts = await provider.getAccounts();
        account = accounts[0] || null;
      } catch (error) {
        console.error(`Error connecting to ${name} wallet:`, error);
        return null;
      }
    }
    
    // Dispatch custom event for other components (e.g., BlockchainProvider)
    if (account) {
      window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address: account } }));
    }
    
    return account;
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    return null;
  }
}

// Helper to disconnect wallet (optional)
export async function disconnectWallet() {
  if (typeof window === 'undefined') return;
  const walletInfo = getWalletProviders();
  if (!walletInfo) return;
  const { provider, name } = walletInfo;
  try {
    if (provider.disconnect) {
      await provider.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
  window.dispatchEvent(new CustomEvent('walletDisconnected'));
}

// Execute a transaction using the wallet
export async function executeTransaction(txb: TransactionBlock): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const walletInfo = getWalletProviders();
    
    if (!walletInfo) {
      console.error('No Sui wallet extension found');
      return null;
    }
    
    const { provider, name } = walletInfo;
    
    // Special handling for Slush wallet
    if (name === 'slush') {
      try {
        // Prepare transaction for Slush wallet
        const txbBytes = await txb.build({ 
          client: getProvider() 
        });
        
        // Sign and execute with Slush wallet
        const result = await provider.signAndExecuteTransactionBlock({
          transactionBlock: txbBytes,
          options: {
            showEvents: true,
            showEffects: true,
          }
        });
        
        return result.digest;
      } catch (error) {
        console.error('Error executing transaction with Slush wallet:', error);
        return null;
      }
    }
    
    // Handle transaction for other wallet types
    if (name === 'standardWallet' || name === 'ethos' || name === 'sui') {
      try {
        // Serialize the transaction block for modern wallets
        const txbBytes = await txb.build({ 
          client: getProvider() 
        });
        
        // Sign and execute the transaction
        const result = await provider.signAndExecuteTransactionBlock({
          transactionBlock: txbBytes,
        });
        
        return result.digest;
      } catch (error) {
        console.error(`Error executing transaction with ${name} wallet:`, error);
        return null;
      }
    }
    
    if (name === 'suiWallet') {
      try {
        // Sign and execute with legacy wallet
        const result = await provider.signAndExecuteTransactionBlock({
          transactionBlock: txb,
        });
        
        return result.digest;
      } catch (error) {
        console.error('Error executing transaction with legacy Sui wallet:', error);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error executing transaction:', error);
    return null;
  }
} 