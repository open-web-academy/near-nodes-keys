import { useState, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { executeTransaction } from '../utils/walletUtils';
import TransactionResult from '../components/TransactionResult';

export default function WithdrawRewards() {
  const { selector, accounts } = useWallet();
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Balances and Pool Info
  const [poolId, setPoolId] = useState('');
  const [poolFormat, setPoolFormat] = useState('poolv1.near');
  const [stakedBalance, setStakedBalance] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState<string | null>(null);
  const [accountId, setAccountId] = useState('');

  // Track the last action performed
  const lastAction = useRef('Transaction');

  // Update accountId when accounts change
  if (accounts.length > 0 && !accountId) {
    setAccountId(accounts[0].accountId);
  }

  // Update the fetchBalances function to use the correct API
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
      const formattedPoolId = poolId.endsWith(`.${poolFormat}`) 
        ? poolId 
        : `${poolId}.${poolFormat}`;
      
      // Use provider for view calls instead of wallet
      const { network } = selector.options;
      const provider = new JsonRpcProvider({ url: network.nodeUrl });
      
      // Get staked balance - correct typing for query response
      const stakedBalanceResponse = await provider.query({
        request_type: 'call_function',
        account_id: formattedPoolId,
        method_name: 'get_account_staked_balance',
        args_base64: btoa(JSON.stringify({ account_id: accountId })),
        finality: 'optimistic',
      }) as any;
      
      // Get unstaked balance
      const unstackedBalanceResponse = await provider.query({
        request_type: 'call_function',
        account_id: formattedPoolId,
        method_name: 'get_account_unstaked_balance',
        args_base64: btoa(JSON.stringify({ account_id: accountId })),
        finality: 'optimistic',
      }) as any;
      
      // Check if we have a valid response
      if (!stakedBalanceResponse || !unstackedBalanceResponse) {
        throw new Error('Failed to get balance from contract');
      }
      
      // Extract the result data - need to handle response.result properly based on actual structure
      let stakedBalanceString, unstackedBalanceString;
      
      if (stakedBalanceResponse.result) {
        const resultBytes = Uint8Array.from(stakedBalanceResponse.result);
        stakedBalanceString = Buffer.from(resultBytes).toString('utf8');
        try {
          stakedBalanceString = JSON.parse(stakedBalanceString);
        } catch (e) {
          // If it's not valid JSON, use the string value directly
        }
      } else {
        throw new Error('Invalid staked balance response');
      }
      
      if (unstackedBalanceResponse.result) {
        const resultBytes = Uint8Array.from(unstackedBalanceResponse.result);
        unstackedBalanceString = Buffer.from(resultBytes).toString('utf8');
        try {
          unstackedBalanceString = JSON.parse(unstackedBalanceString);
        } catch (e) {
          // If it's not valid JSON, use the string value directly
        }
      } else {
        throw new Error('Invalid unstaked balance response');
      }
      
      // Convert from yoctoNEAR to NEAR for display
      const stakedInNear = parseFloat(stakedBalanceString) / 1e24;
      const unstackedInNear = parseFloat(unstackedBalanceString) / 1e24;
      
      setStakedBalance(stakedInNear.toFixed(5));
      setAvailableBalance(unstackedInNear.toFixed(5));
      
    } catch (err) {
      console.error('Error fetching balances:', err);
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
    lastAction.current = 'Unstake';

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
              methodName: 'unstake_all',
              args: {},
              gas: '300000000000000',
              deposit: '0'
            }
          }
        ]
      });

      if (result.walletType === "meteor" && result.success) {
        setResult(`Unstake successful! Transaction hash: ${result.transactionHash}`);
        setIsLoading(false);
        
        // Refresh balances after a short delay
        setTimeout(() => fetchBalances(), 2000);
      }
      
    } catch (err) {
      console.error('Error unstaking:', err);
      setError(err instanceof Error ? err.message : 'Failed to unstake');
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
    lastAction.current = 'Withdraw';

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
              methodName: 'withdraw_all',
              args: {},
              gas: '300000000000000',
              deposit: '0'
            }
          }
        ]
      });

      if (result.walletType === "meteor" && result.success) {
        setResult(`Withdrawal successful! Transaction hash: ${result.transactionHash}`);
        setIsLoading(false);
        
        // Refresh balances after a short delay
        setTimeout(() => fetchBalances(), 2000);
      }
      
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
      setIsLoading(false);
    }
  };

  return (
    <div className="text-green-400 font-mono">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-wide">
        Withdraw Staking Rewards
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
      
      <TransactionResult
        onSuccess={(hash) => setResult(`${lastAction.current} successful! Transaction hash: ${hash}`)}
        onError={(error) => setError(`Failed to ${lastAction.current.toLowerCase()}: ${error}`)}
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