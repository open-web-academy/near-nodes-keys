import { useState, useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import Layout from '../components/Layout';
import "@near-wallet-selector/modal-ui/styles.css";

export default function WithdrawRewards() {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Balances and Pool Info
  const [poolId, setPoolId] = useState('');
  const [stakedBalance, setStakedBalance] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState<string | null>(null);
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    setupWalletSelector({
      network: 'mainnet',
      modules: [setupMeteorWallet()]
    }).then((selector) => {
      setSelector(selector);
      setModal(setupModal(selector, { contractId: 'poolv1.near' }));
      selector.store.observable.subscribe((state) => {
        setAccounts(state.accounts);
        if (state.accounts.length > 0) {
          setAccountId(state.accounts[0].accountId);
        }
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

  const fetchBalances = async () => {
    if (!poolId || !selector || accounts.length === 0) {
      setError('Please connect your wallet and enter a pool ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');
    setStakedBalance(null);
    setAvailableBalance(null);

    try {
      const formattedPoolId = poolId.endsWith('.poolv1.near') 
        ? poolId 
        : `${poolId}.poolv1.near`;
      
      const wallet = await selector.wallet();
      
      // This is a simplified version of how you would get the balances
      // In a real app, you'd need to properly parse the return values
      
      // Get staked balance
      const stakedBalanceResult = await wallet.viewMethod({
        contractId: formattedPoolId,
        method: 'get_account_staked_balance',
        args: { account_id: accountId }
      });
      
      // Get unstaked balance
      const unstackedBalanceResult = await wallet.viewMethod({
        contractId: formattedPoolId,
        method: 'get_account_unstaked_balance',
        args: { account_id: accountId }
      });
      
      // Convert from yoctoNEAR to NEAR for display
      const stakedInNear = parseFloat(stakedBalanceResult) / 1e24;
      const unstackedInNear = parseFloat(unstackedBalanceResult) / 1e24;
      
      setStakedBalance(stakedInNear.toFixed(5));
      setAvailableBalance(unstackedInNear.toFixed(5));
      
      // Also check if unstaked balance is available for withdrawal
      // This would require another contract call to check if funds are unlocked
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstakeAll = async () => {
    if (!poolId || !selector || accounts.length === 0) {
      setError('Please connect your wallet and enter a pool ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const formattedPoolId = poolId.endsWith('.poolv1.near') 
        ? poolId 
        : `${poolId}.poolv1.near`;
      
      const wallet = await selector.wallet();
      
      const outcome = await wallet.signAndSendTransaction({
        signerId: accounts[0].accountId,
        receiverId: formattedPoolId,
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: 'unstake_all',
              args: {},
              gas: '300000000000000',
              deposit: '0'
            }
          }
        ]
      });
      
      setResult(`Unstake initiated! Transaction hash: ${outcome?.transaction?.hash || "N/A"}`);
      // After unstaking, we should update the balances
      setTimeout(() => fetchBalances(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unstake');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!poolId || !selector || accounts.length === 0) {
      setError('Please connect your wallet and enter a pool ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const formattedPoolId = poolId.endsWith('.poolv1.near') 
        ? poolId 
        : `${poolId}.poolv1.near`;
      
      const wallet = await selector.wallet();
      
      const outcome = await wallet.signAndSendTransaction({
        signerId: accounts[0].accountId,
        receiverId: formattedPoolId,
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: 'withdraw_all',
              args: {},
              gas: '300000000000000',
              deposit: '0'
            }
          }
        ]
      });
      
      setResult(`Withdraw successful! Transaction hash: ${outcome?.transaction?.hash || "N/A"}`);
      // After withdrawal, we should update the balances
      setTimeout(() => fetchBalances(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="text-green-400 font-mono">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-wide">
          Withdraw Staking Rewards
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
              Pool ID:
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
            onClick={fetchBalances}
            disabled={!accounts.length || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 rounded-md transition-colors mb-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Check Balances'}
          </button>
          
          {stakedBalance !== null && availableBalance !== null && (
            <div className="space-y-6">
              {/* Balances Display */}
              <div className="bg-gray-900 p-4 rounded-md border border-dotted border-green-400">
                <h2 className="text-xl font-bold mb-4">Your Balances</h2>
                
                <div className="flex justify-between items-center mb-2">
                  <span>Staked Balance:</span>
                  <span className="text-xl font-mono">{stakedBalance} NEAR</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Available to Withdraw:</span>
                  <span className="text-xl font-mono">{availableBalance} NEAR</span>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-gray-900 p-4 rounded-md border border-dotted border-yellow-400 text-yellow-400 text-sm">
                <p className="mb-2"><span className="font-bold">Note:</span> Withdrawing rewards is a two-step process:</p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>First, unstake your tokens (takes 2-3 days to unlock)</li>
                  <li>Then, withdraw the unlocked tokens to your wallet</li>
                </ol>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleUnstakeAll}
                  disabled={isLoading || parseFloat(stakedBalance) <= 0}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Step 1: Unstake All
                </button>
                
                <button
                  onClick={handleWithdrawAll}
                  disabled={isLoading || parseFloat(availableBalance) <= 0}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Step 2: Withdraw All
                </button>
              </div>
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
            <p className="text-green-400 text-center font-medium text-sm sm:text-base">
              {result}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}