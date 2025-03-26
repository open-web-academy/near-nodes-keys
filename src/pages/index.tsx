import { useState, useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import { generateValidatorKey, KeyPair } from '../utils/keyGenerator';
import Layout from '../components/Layout';
import "@near-wallet-selector/modal-ui/styles.css";
import { useTransactionResult } from '../hooks/useTransactionResult';

export default function Home() {
  const [accountId, setAccountId] = useState('');
  const [generatedKey, setGeneratedKey] = useState<KeyPair | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  
  // Use the transaction result hook
  const { transactionHash, transactionError, clearTransactionResult } = useTransactionResult();

  // Setup wallet selector
  useEffect(() => {
    setupWalletSelector({
      network: 'mainnet',
      modules: [
        setupMeteorWallet(),
        setupMyNearWallet()
      ]
    }).then((selector) => {
      setSelector(selector);
      setModal(setupModal(selector, { contractId: 'poolv1.near' }));
      selector.store.observable.subscribe((state) => {
        setAccounts(state.accounts);
      });
    });
  }, []);

  const handleSignIn = () => {
    modal?.show();
  };

  const handleDisconnect = async () => {
    const wallet = await selector?.wallet();
    await wallet?.signOut();
    setAccounts([]);
  };

  // Handle transaction results (not needed for key generation but kept for consistency)
  useEffect(() => {
    if (transactionHash) {
      setResult(`Transaction successful! Transaction hash: ${transactionHash}`);
      clearTransactionResult();
    }

    if (transactionError) {
      setError(`Transaction failed: ${transactionError}`);
      clearTransactionResult();
    }
  }, [transactionHash, transactionError, clearTransactionResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const poolId = accountId.endsWith('.poolv1.near')
      ? accountId
      : `${accountId}.poolv1.near`;

    try {
      const keyData = generateValidatorKey(poolId);
      setGeneratedKey(keyData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDownload = () => {
    if (!generatedKey) return;
    const blob = new Blob([JSON.stringify(generatedKey, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedKey.account_id}.validator_key.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="text-green-400 font-mono">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-widest">
          NEAR Validator Key Generator
        </h1>
        
        {/* Wallet Connection - Optional for this page */}
        <div className="mb-6 text-center">
          {accounts.length === 0 ? (
            <button
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
              <span className="text-green-400 font-medium text-sm sm:text-base">
                Connected: {accounts[0].accountId}
              </span>
              <button
                onClick={handleDisconnect}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md transition-colors text-sm"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 border border-green-400 border-dotted rounded-lg p-4 sm:p-6 shadow-md mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="accountId" className="block text-base sm:text-lg font-medium mb-2">
                Staking Pool ID:
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <input
                  id="accountId"
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="e.g. pool"
                  required
                  className="w-full sm:flex-1 p-2 sm:p-3 bg-gray-900 border border-green-400 rounded-md sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
                />
                <span className="mt-1 sm:mt-0 inline-flex items-center px-3 py-2 sm:py-3 bg-gray-900 border border-green-400 sm:border-l-0 rounded-md sm:rounded-l-none text-sm sm:text-base">
                  .poolv1.near
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 rounded-md transition-colors"
            >
              Generate Key
            </button>
          </form>
        </div>
        
        {error && (
          <p className="text-red-500 text-center mb-4 text-sm sm:text-base">
            {error}
          </p>
        )}
        
        {result && (
          <p className="text-green-400 text-center mb-4 text-sm sm:text-base">
            {result}
          </p>
        )}
        
        {generatedKey && (
          <div className="bg-gray-800 border border-green-400 border-dotted rounded-lg p-4 sm:p-6 shadow-md">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">
              Generated Key
            </h2>
            <textarea
              readOnly
              className="w-full p-3 sm:p-4 bg-gray-900 border border-green-400 rounded-md text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
              value={JSON.stringify(generatedKey, null, 2)}
              rows={10}
            />
            <button
              onClick={handleDownload}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-3 rounded-md transition-colors"
            >
              Download Key File
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}