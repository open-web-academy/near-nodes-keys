import { createContext, useContext, useEffect, useState } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import "@near-wallet-selector/modal-ui/styles.css";

interface WalletContextType {
  selector: WalletSelector | null;
  modal: any;
  accounts: Array<AccountState>;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  selector: null,
  modal: null,
  accounts: [],
  isLoading: true,
  error: null,
  connect: () => {},
  disconnect: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const selector = await setupWalletSelector({
          network: 'mainnet',
          modules: [
            setupMeteorWallet(),
            setupMyNearWallet()
          ]
        });

        setSelector(selector);
        setModal(setupModal(selector, { contractId: 'poolv1.near' }));
        
        // Subscribe to account changes
        selector.store.observable.subscribe((state) => {
          setAccounts(state.accounts);
        });

        // Check if there's an existing wallet connection
        const wallet = await selector.wallet();
        if (wallet) {
          const walletAccounts = await wallet.getAccounts();
          // Convert wallet accounts to AccountState format
          const accountStates: AccountState[] = walletAccounts.map(account => ({
            accountId: account.accountId,
            active: true
          }));
          setAccounts(accountStates);
        }
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, []);

  const connect = () => {
    if (!modal) {
      setError('Wallet modal not initialized');
      return;
    }
    modal.show();
  };

  const disconnect = async () => {
    if (!selector) {
      setError('Wallet selector not initialized');
      return;
    }

    try {
      const wallet = await selector.wallet();
      if (wallet) {
        await wallet.signOut();
        setAccounts([]);
      }
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        selector,
        modal,
        accounts,
        isLoading,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 