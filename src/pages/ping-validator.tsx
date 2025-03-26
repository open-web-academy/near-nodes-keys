import { useState, useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'; // Add this import
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import Layout from '../components/Layout';
import "@near-wallet-selector/modal-ui/styles.css";
import { useTransactionResult } from '../hooks/useTransactionResult';
import { executeTransaction } from '../utils/walletUtils';

export default function PingValidator() {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPingSuccess, setIsPingSuccess] = useState<boolean | null>(null);
  
  // Form fields
  const [poolId, setPoolId] = useState('');

  // Use the transaction result hook
  const { transactionHash, transactionError, clearTransactionResult } = useTransactionResult();
  
  // Handle transaction results
  useEffect(() => {
    if (transactionHash) {
      setResult(`PING successful! Transaction hash: ${transactionHash}`);
      setIsPingSuccess(true);
      setIsLoading(false); // Ensure loading state is reset
      clearTransactionResult();
    }
    
    if (transactionError) {
      setError(`Failed to ping validator: ${transactionError}`);
      setIsPingSuccess(false);
      setIsLoading(false);
      clearTransactionResult();
    }
  }, [transactionHash, transactionError, clearTransactionResult]);

  useEffect(() => {
    setupWalletSelector({
      network: 'mainnet',
      modules: [
        setupMeteorWallet(),
        setupMyNearWallet() // Add MyNEAR Wallet support
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

  const sendPing = async () => {
    if (!poolId || !selector || accounts.length === 0) {
      setError('Please connect your wallet and enter a pool ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');
    setIsPingSuccess(null);

    try {
      const formattedPoolId = poolId.endsWith('.poolv1.near') 
        ? poolId 
        : `${poolId}.poolv1.near`;
      
      const result = await executeTransaction({
        selector,
        accountId: accounts[0].accountId,
        receiverId: formattedPoolId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: 'ping',
              args: {},
              gas: '100000000000000',
              deposit: '0'
            }
          }
        ]
      });

      // For Meteor Wallet, handle result immediately
      if (result.walletType === "meteor" && result.success) {
        setResult(`PING successful! Transaction hash: ${result.transactionHash}`);
        setIsPingSuccess(true);
        setIsLoading(false);
      }
      // For MyNEAR Wallet, results will be handled by the useTransactionResult hook
      
    } catch (err) {
      console.error('Ping error:', err);
      setIsPingSuccess(false);
      setError(err instanceof Error ? err.message : 'Failed to ping validator');
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="text-green-400 font-mono">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-wide">
          PING Validator
        </h1>
        
        <div className="mb-6 text-center">
          {accounts.length === 0 ? (
            <button
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
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
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md transition-colors text-sm sm:text-base"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 border border-green-400 border-dotted rounded-lg p-4 sm:p-6 shadow-md mb-6">
          <div className="mb-4 sm:mb-5">
            <label htmlFor="poolId" className="block text-base sm:text-lg font-medium mb-1 sm:mb-2">
              Validator Pool ID:
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <input
                id="poolId"
                type="text"
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                placeholder="e.g. mypool"
                required
                className="w-full sm:flex-1 p-2 sm:p-3 bg-gray-900 border border-green-400 rounded-md sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
              />
              <span className="mt-1 sm:mt-0 inline-flex items-center px-3 py-2 sm:py-3 bg-gray-900 border border-green-400 sm:border-l-0 rounded-md sm:rounded-l-none text-sm sm:text-base">
                .poolv1.near
              </span>
            </div>
          </div>
          
          <button
            onClick={sendPing}
            disabled={!poolId || !accounts.length || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 rounded-md transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending PING...' : 'Send PING'}
          </button>
          
          {isPingSuccess !== null && (
            <div className={`p-3 rounded-md text-center mt-4 ${
              isPingSuccess ? "bg-green-900 border border-green-500" : "bg-red-900 border border-red-500"
            }`}>
              <p className={`text-lg ${isPingSuccess ? "text-green-300" : "text-red-300"}`}>
                {isPingSuccess ? 'PING Successful ✓' : 'PING Failed ✗'}
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-red-500 text-center mb-4 font-medium text-sm sm:text-base">
            {error}
          </p>
        )}
        
        {result && (
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-green-400 border-dotted">
            <pre className="text-green-400 text-center font-medium text-sm sm:text-base whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        <div className="bg-gray-800 border border-yellow-500 border-dotted rounded-lg p-4 mt-6 text-yellow-400">
          <h3 className="text-lg font-bold mb-2">About PING</h3>
          <p className="text-sm">
            The 'ping' method is used to update the staking pool contract state and distribute rewards. 
            It ensures the validator information is kept up to date and helps check if the validator 
            is operational. Regular pinging can help maintain validator health.
          </p>
        </div>
      </div>
    </Layout>
  );
}