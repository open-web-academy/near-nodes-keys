import { useState, useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import Layout from '../components/Layout';
import "@near-wallet-selector/modal-ui/styles.css";

export default function LaunchPool() {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  
  // Form fields
  const [poolId, setPoolId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [stakePublicKey, setStakePublicKey] = useState('');
  const [numerator, setNumerator] = useState('5');
  const [denominator, setDenominator] = useState('100');

  useEffect(() => {
    setupWalletSelector({
      network: 'mainnet',
      modules: [setupMeteorWallet()]
    }).then((selector) => {
      setSelector(selector);
      setModal(setupModal(selector, { contractId: 'poolv1.near' }));
      selector.store.observable.subscribe((state) => {
        setAccounts(state.accounts);
        if (state.accounts.length > 0 && !ownerId) {
          setOwnerId(state.accounts[0].accountId);
        }
      });
    });
  }, [ownerId]);

  const handleSignIn = () => {
    modal?.show();
  };

  const handleDisconnect = async () => {
    const wallet = await selector?.wallet();
    await wallet?.signOut();
    setAccounts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult('');

    if (!selector || accounts.length === 0) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      const wallet = await selector.wallet();
      
      const args = {
        staking_pool_id: poolId,
        owner_id: ownerId,
        stake_public_key: stakePublicKey,
        reward_fee_fraction: {
          numerator: parseInt(numerator, 10),
          denominator: parseInt(denominator, 10)
        }
      };

      const transaction = {
        signerId: accounts[0].accountId,
        receiverId: 'poolv1.near',
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: 'create_staking_pool',
              args,
              gas: '300000000000000',
              deposit: '30000000000000000000000000' // 30 NEAR
            }
          }
        ]
      };

      const outcome = await wallet.signAndSendTransaction(transaction);
      setResult(
        `Transaction submitted! Hash: ${outcome?.transaction?.hash || "N/A"}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  return (
    <Layout>
      <div className="text-green-400 font-mono">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-wide">
          Create Staking Pool
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
          <form onSubmit={handleSubmit}>
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

            <div className="mb-4 sm:mb-5">
              <label htmlFor="ownerId" className="block text-base sm:text-lg font-medium mb-1 sm:mb-2">
                Owner ID:
              </label>
              <input
                id="ownerId"
                type="text"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                placeholder="e.g. your.near"
                required
                className="w-full p-2 sm:p-3 bg-gray-900 border border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
              />
            </div>

            <div className="mb-4 sm:mb-5">
              <label htmlFor="stakePublicKey" className="block text-base sm:text-lg font-medium mb-1 sm:mb-2">
                Stake Public Key:
              </label>
              <input
                id="stakePublicKey"
                type="text"
                value={stakePublicKey}
                onChange={(e) => setStakePublicKey(e.target.value)}
                placeholder="e.g. ed25519:Gx..."
                required
                className="w-full p-2 sm:p-3 bg-gray-900 border border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
              />
              <p className="text-green-400 text-xs sm:text-sm mt-1">
                Your validator public key (from validator_key.json)
              </p>
            </div>

            <div className="mb-4 sm:mb-5">
              <label className="block text-base sm:text-lg font-medium mb-1 sm:mb-2">
                Reward Fee Fraction:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={numerator}
                  onChange={(e) => setNumerator(e.target.value)}
                  min="0"
                  className="w-20 p-2 sm:p-3 bg-gray-900 border border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
                />
                <span>/</span>
                <input
                  type="number"
                  value={denominator}
                  onChange={(e) => setDenominator(e.target.value)}
                  min="1"
                  className="w-20 p-2 sm:p-3 bg-gray-900 border border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
                />
                <span className="ml-2 text-green-400 text-sm">
                  ({(parseInt(numerator) / parseInt(denominator) * 100).toFixed(2)}%)
                </span>
              </div>
              <p className="text-green-400 text-xs sm:text-sm mt-1">
                The fee the pool will charge on rewards (e.g. 5/100 = 5%)
              </p>
            </div>

            <div className="mb-4 sm:mb-5 p-3 bg-gray-900 border border-green-400 border-dotted rounded-md">
              <p className="text-sm text-yellow-400 mb-1">
                <span className="font-bold">Note:</span> This transaction will cost exactly 30 NEAR
              </p>
              <p className="text-xs text-gray-400">
                This is the minimum required balance to create a staking pool
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 rounded-md transition-colors"
              disabled={!accounts.length}
            >
              Create Staking Pool
            </button>
          </form>
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