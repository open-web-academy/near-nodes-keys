import { useState, useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'; // Add this import
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import Layout from '../components/Layout';
import "@near-wallet-selector/modal-ui/styles.css";
import { useTransactionResult } from '../hooks/useTransactionResult';

export default function EditPool() {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  
  // Form fields
  const [poolId, setPoolId] = useState('');
  const [stakePublicKey, setStakePublicKey] = useState('');
  const [numerator, setNumerator] = useState('5');
  const [denominator, setDenominator] = useState('100');
  const [poolInfo, setPoolInfo] = useState<any>(null);

  // Use the transaction result hook
  const { transactionHash, transactionError, clearTransactionResult } = useTransactionResult();
  
  // Handle transaction results
  useEffect(() => {
    if (transactionHash) {
      setResult(`Pool update successful! Transaction hash: ${transactionHash}`);
      setIsLoading(false);
      clearTransactionResult();
    }
    
    if (transactionError) {
      setError(`Failed to update pool: ${transactionError}`);
      setIsLoading(false);
      clearTransactionResult();
    }
  }, [transactionHash, transactionError]);

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

  const checkPoolOwnership = async () => {
    if (!poolId || !selector || accounts.length === 0) {
      setError('Please connect your wallet and enter a pool ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');
    setIsOwner(null);
    setPoolInfo(null);

    try {
      const formattedPoolId = poolId.endsWith('.poolv1.near') 
        ? poolId 
        : `${poolId}.poolv1.near`;
      
      const wallet = await selector.wallet();
      
      // Query the pool info to get the owner
      const poolInfoResult = await wallet.signAndSendTransaction({
        signerId: accounts[0].accountId,
        receiverId: formattedPoolId,
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: 'get_owner_id',
              args: {},
              gas: '100000000000000',
              deposit: '0'
            }
          }
        ]
      });

      // This is a simplification - in reality, you would parse the result
      // from the transaction outcome
      // For demo purposes, let's assume we got the owner ID
      const ownerId = accounts[0].accountId; // This would normally come from the result
      
      // Check if current user is the owner
      const isOwnerResult = ownerId === accounts[0].accountId;
      setIsOwner(isOwnerResult);
      
      if (isOwnerResult) {
        // If owner, also get current stake public key and reward fee
        setPoolInfo({
          stakePublicKey: "ed25519:example....", // Placeholder - would come from contract
          rewardFeeFraction: {
            numerator: 5,
            denominator: 100
          }
        });
        
        // Update form with current values
        setStakePublicKey(poolInfo?.stakePublicKey || "");
        setNumerator(String(poolInfo?.rewardFeeFraction?.numerator || 5));
        setDenominator(String(poolInfo?.rewardFeeFraction?.denominator || 100));
      } else {
        setError('You are not the owner of this pool');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check pool ownership');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStakeKey = async () => {
    if (!selector || accounts.length === 0 || !isOwner) {
      setError('Please connect your wallet and verify pool ownership');
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
      
      await wallet.signAndSendTransaction({
        signerId: accounts[0].accountId,
        receiverId: formattedPoolId,
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: 'update_staking_key',
              args: { stake_public_key: stakePublicKey },
              gas: '300000000000000',
              deposit: '0'
            }
          }
        ],
        callbackUrl: window.location.href // Add callback URL
      });
      
      // Don't update state here as we'll be redirected
    } catch (err) {
      // Only handle errors that occur before redirect
      console.error('Error before redirect:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate transaction');
      setIsLoading(false);
    }
  };

  const handleUpdateRewardFee = async () => {
    if (!selector || accounts.length === 0 || !isOwner) {
      setError('Please connect your wallet and verify pool ownership');
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
      
      await wallet.signAndSendTransaction({
        signerId: accounts[0].accountId,
        receiverId: formattedPoolId,
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: 'update_reward_fee_fraction',
              args: { 
                reward_fee_fraction: {
                  numerator: parseInt(numerator, 10),
                  denominator: parseInt(denominator, 10)
                }
              },
              gas: '300000000000000',
              deposit: '0'
            }
          }
        ],
        callbackUrl: window.location.href
      });
      
      // Don't update state here
    } catch (err) {
      // Handle pre-redirect errors
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to initiate transaction');
    }
  };

  return (
    <Layout>
      <div className="text-green-400 font-mono">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-wide">
          Edit Staking Pool
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
            onClick={checkPoolOwnership}
            disabled={!accounts.length || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 rounded-md transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed mb-4"
          >
            {isLoading ? 'Checking...' : 'Check Pool Ownership'}
          </button>

          {isOwner === false && (
            <div className="bg-red-900 border border-red-500 p-3 rounded-md my-4 text-center">
              You are not the owner of this pool. Only the pool owner can modify these settings.
            </div>
          )}

          {isOwner && (
            <>
              <div className="border-t border-dotted border-green-400 my-6 pt-6">
                <h2 className="text-xl font-bold mb-4">Update Stake Public Key</h2>
                
                <div className="mb-4">
                  <label htmlFor="stakePublicKey" className="block text-base font-medium mb-1">
                    New Stake Public Key:
                  </label>
                  <input
                    id="stakePublicKey"
                    type="text"
                    value={stakePublicKey}
                    onChange={(e) => setStakePublicKey(e.target.value)}
                    placeholder="e.g. ed25519:Gx..."
                    className="w-full p-2 sm:p-3 bg-gray-900 border border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
                  />
                  <p className="text-green-400 text-xs sm:text-sm mt-1">
                    Your new validator public key
                  </p>
                </div>

                <button
                  onClick={handleUpdateStakeKey}
                  disabled={isLoading || !stakePublicKey}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition-colors disabled:bg-green-400 disabled:cursor-not-allowed mb-6"
                >
                  {isLoading ? 'Updating...' : 'Update Staking Key'}
                </button>

                <h2 className="text-xl font-bold mb-4">Update Reward Fee</h2>
                
                <div className="mb-4">
                  <label className="block text-base font-medium mb-1">
                    New Reward Fee Fraction:
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

                <button
                  onClick={handleUpdateRewardFee}
                  disabled={isLoading || !numerator || !denominator}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating...' : 'Update Reward Fee'}
                </button>
              </div>
            </>
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