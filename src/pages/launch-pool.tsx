import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { executeTransaction } from '../utils/walletUtils';
import TransactionResult from '../components/TransactionResult';

export default function LaunchPool() {
  const { selector, accounts } = useWallet();
  const [poolId, setPoolId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [stakePublicKey, setStakePublicKey] = useState('');
  const [numerator, setNumerator] = useState('5');
  const [denominator, setDenominator] = useState('100');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult('');

    if (!selector || accounts.length === 0) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      // Format the pool ID correctly
      const formattedPoolId = poolId.endsWith('.poolv1.near') ? poolId : `${poolId}.poolv1.near`;
      
      const args = {
        staking_pool_id: formattedPoolId,
        owner_id: ownerId,
        stake_public_key: stakePublicKey,
        reward_fee_fraction: {
          numerator: parseInt(numerator, 10),
          denominator: parseInt(denominator, 10)
        }
      };

      const result = await executeTransaction({
        selector,
        accountId: accounts[0].accountId,
        receiverId: 'poolv1.near',
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: 'create_staking_pool',
              args,
              gas: '300000000000000',
              deposit: '30000000000000000000000000' // 30 NEAR
            }
          }
        ]
      });

      if (result.walletType === "meteor" && result.success) {
        setResult(`Pool launch successful! Transaction hash: ${result.transactionHash}`);
        setIsLoading(false);
      }
      
    } catch (err) {
      console.error('Error launching pool:', err);
      setError(err instanceof Error ? err.message : 'Failed to launch pool');
      setIsLoading(false);
    }
  };

  return (
    <div className="text-green-400 font-mono">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-wide">
        Create Staking Pool
      </h1>
      
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
      
      <TransactionResult
        onSuccess={(hash) => setResult(`Pool launch successful! Transaction hash: ${hash}`)}
        onError={(error) => setError(`Failed to launch pool: ${error}`)}
      />
      
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
  );
}