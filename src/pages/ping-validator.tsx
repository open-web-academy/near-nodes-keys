import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { executeTransaction } from '../utils/walletUtils';
import TransactionResult from '../components/TransactionResult';

export default function PingValidator() {
  const { selector, accounts } = useWallet();
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPingSuccess, setIsPingSuccess] = useState<boolean | null>(null);
  
  // Form fields
  const [poolId, setPoolId] = useState('');

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

      if (result.walletType === "meteor" && result.success) {
        setResult(`PING successful! Transaction hash: ${result.transactionHash}`);
        setIsPingSuccess(true);
        setIsLoading(false);
      }
      
    } catch (err) {
      console.error('Ping error:', err);
      setIsPingSuccess(false);
      setError(err instanceof Error ? err.message : 'Failed to ping validator');
      setIsLoading(false);
    }
  };

  return (
    <div className="text-green-400 font-mono">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-wide">
        PING Validator
      </h1>
      
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
      
      <TransactionResult
        onSuccess={(hash) => {
          setResult(`PING successful! Transaction hash: ${hash}`);
          setIsPingSuccess(true);
        }}
        onError={(error) => {
          setError(`Failed to ping validator: ${error}`);
          setIsPingSuccess(false);
        }}
      />
      
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
  );
}