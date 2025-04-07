import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { executeTransaction } from '../utils/walletUtils';
import TransactionResult from '../components/TransactionResult';

export default function EditPool() {
  const { selector, accounts } = useWallet();
  const [poolId, setPoolId] = useState('');
  const [poolFormat, setPoolFormat] = useState('poolv1.near');
  const [poolOwner, setPoolOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [stakePublicKey, setStakePublicKey] = useState('');
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateStakeKey = async () => {
    if (!selector || accounts.length === 0 || !isOwner) {
      setError('Please connect your wallet and verify pool ownership');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const formattedPoolId = poolId.endsWith(`.${poolFormat}`) ? poolId : `${poolId}.${poolFormat}`;
      
      const result = await executeTransaction({
        selector,
        accountId: accounts[0].accountId,
        receiverId: formattedPoolId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: 'update_staking_key',
              args: { stake_public_key: stakePublicKey },
              gas: '300000000000000',
              deposit: '0'
            }
          }
        ]
      });

      if (result.walletType === "meteor" && result.success) {
        setResult(`Stake key updated successfully! Transaction hash: ${result.transactionHash}`);
        setIsLoading(false);
      }
      
    } catch (err) {
      console.error('Error updating stake key:', err);
      setError(err instanceof Error ? err.message : 'Failed to update stake key');
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
      const formattedPoolId = poolId.endsWith(`.${poolFormat}`) ? poolId : `${poolId}.${poolFormat}`;
      
      const result = await executeTransaction({
        selector,
        accountId: accounts[0].accountId,
        receiverId: formattedPoolId,
        actions: [
          {
            type: "FunctionCall",
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
        ]
      });

      if (result.walletType === "meteor" && result.success) {
        setResult(`Reward fee updated successfully! Transaction hash: ${result.transactionHash}`);
        setIsLoading(false);
      }
      
    } catch (err) {
      console.error('Error updating reward fee:', err);
      setError(err instanceof Error ? err.message : 'Failed to update reward fee');
      setIsLoading(false);
    }
  };

  const checkPoolOwnership = async () => {
    if (!poolId || !selector || accounts.length === 0) {
      setError('Please connect your wallet and enter a pool ID');
      return;
    }
  
    setIsLoading(true);
    setError('');
    setResult('');
    setIsOwner(false);
    setPoolOwner(null);
  
    try {
      const formattedPoolId = poolId.endsWith(`.${poolFormat}`) 
        ? poolId 
        : `${poolId}.${poolFormat}`;
      
      const { network } = selector.options;
      const provider = new JsonRpcProvider({ url: network.nodeUrl });
      
      const ownerResponse = await provider.query({
        request_type: 'call_function',
        account_id: formattedPoolId,
        method_name: 'get_owner_id',
        args_base64: btoa(JSON.stringify({})),
        finality: 'optimistic',
      }) as any;
      
      if (!ownerResponse || ownerResponse.error) {
        throw new Error(ownerResponse?.error?.message || 'Failed to retrieve pool information');
      }
      
      let ownerIdBytes, ownerIdString;
      
      if (ownerResponse.result) {
        ownerIdBytes = Uint8Array.from(ownerResponse.result);
        ownerIdString = new TextDecoder().decode(ownerIdBytes);
        
        try {
          const parsed = JSON.parse(ownerIdString);
          ownerIdString = typeof parsed === 'string' ? parsed : ownerIdString;
        } catch (e) {
          // If not JSON, use string directly
        }
      } else {
        throw new Error('Invalid response from pool contract');
      }
      
      setPoolOwner(ownerIdString);
      
      const currentUser = accounts[0].accountId;
      const isCurrentUserOwner = ownerIdString === currentUser;
      
      setIsOwner(isCurrentUserOwner);
      
      if (isCurrentUserOwner) {
        await fetchPoolSettings(formattedPoolId, provider);
      } else {
        setError(`You are not the owner of this pool. Only ${ownerIdString} can modify these settings.`);
      }
    } catch (err) {
      console.error('Error checking pool ownership:', err);
      setError(err instanceof Error ? err.message : 'Failed to check pool ownership');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPoolSettings = async (poolId: string, provider: JsonRpcProvider) => {
    try {
      const stakeKeyResponse = await provider.query({
        request_type: 'call_function',
        account_id: poolId,
        method_name: 'get_staking_key',
        args_base64: btoa(JSON.stringify({})),
        finality: 'optimistic',
      }) as any;
      
      if (stakeKeyResponse && stakeKeyResponse.result) {
        const bytes = Uint8Array.from(stakeKeyResponse.result);
        const rawResult = new TextDecoder().decode(bytes);
        try {
          const parsedKey = JSON.parse(rawResult);
          setStakePublicKey(parsedKey);
        } catch (e) {
          setStakePublicKey(rawResult.replace(/"/g, ''));
        }
      }
      
      const rewardFeeResponse = await provider.query({
        request_type: 'call_function',
        account_id: poolId,
        method_name: 'get_reward_fee_fraction',
        args_base64: btoa(JSON.stringify({})),
        finality: 'optimistic',
      }) as any;
      
      if (rewardFeeResponse && rewardFeeResponse.result) {
        const bytes = Uint8Array.from(rewardFeeResponse.result);
        const rawResult = new TextDecoder().decode(bytes);
        try {
          const parsedFee = JSON.parse(rawResult);
          setNumerator(parsedFee.numerator.toString());
          setDenominator(parsedFee.denominator.toString());
        } catch (e) {
          console.error("Failed to parse reward fee:", e);
        }
      }
    } catch (err) {
      console.error('Error fetching pool settings:', err);
    }
  };

  return (
    <div className="text-green-400 font-mono">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-wide">
        Edit Staking Pool
      </h1>
      
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
            <select
              value={poolFormat}
              onChange={(e) => setPoolFormat(e.target.value)}
              className="mt-1 sm:mt-0 p-2 sm:p-3 bg-gray-900 border border-green-400 sm:border-l-0 rounded-md sm:rounded-l-none text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="poolv1.near">.poolv1.near</option>
              <option value="pool.near">.pool.near</option>
            </select>
          </div>
        </div>

        <button
          onClick={checkPoolOwnership}
          disabled={!accounts.length || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 rounded-md transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Checking...' : 'Check Pool Ownership'}
        </button>

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
      
      <TransactionResult
        onSuccess={(hash) => setResult(`Pool update successful! Transaction hash: ${hash}`)}
        onError={(error) => setError(`Failed to update pool: ${error}`)}
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