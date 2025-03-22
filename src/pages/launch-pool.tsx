import { useState, useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import "@near-wallet-selector/modal-ui/styles.css";

export default function LaunchPool() {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [poolName, setPoolName] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setupWalletSelector({
      network: 'mainnet', // or 'testnet' if needed
      modules: [setupMeteorWallet()]
    }).then((selector) => {
      setSelector(selector);
      setModal(setupModal(selector, { contractId: 'poolfactory.near' })); // Replace with your actual contract ID
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
      const transaction = {
        signerId: accounts[0].accountId,
        receiverId: 'poolfactory.near', // update with the appropriate contract id
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'launch_pool',
              args: {
                // Final pool ID: append a suffix to the entered poolName
                pool_id: poolName.endsWith('.poolfactory.near')
                  ? poolName
                  : `${poolName}.poolfactory.near`,
                // initial deposit provided in yoctoNEAR
                initial_deposit: initialDeposit,
              },
              gas: '30000000000000', // 30 TGas (adjust as needed)
              deposit: initialDeposit,
            },
          },
        ],
      };

      const outcome = await wallet.signAndSendTransaction(transaction);
      setResult(`Transaction submitted! Hash: ${outcome.transaction.hash}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono flex items-center">
      <div className="w-full max-w-3xl mx-auto p-6 border border-green-400 border-dotted rounded-lg shadow-md">
        <h1 className="text-4xl font-extrabold text-center mb-8 tracking-wide">
          Launch New Pool
        </h1>
        <div className="mb-4 text-center">
          {accounts.length === 0 ? (
            <button
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex justify-center items-center gap-4">
              <span className="text-green-400 font-medium">
                Connected: {accounts[0].accountId}
              </span>
              <button
                onClick={handleDisconnect}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 mb-8 rounded-lg shadow border border-green-400 border-dotted">
          <div className="mb-5">
            <label htmlFor="poolName" className="block text-lg font-medium mb-2">
              Pool Name (without suffix):
            </label>
            <input
              id="poolName"
              type="text"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              placeholder="e.g. mynewpool"
              required
              className="w-full p-3 bg-gray-900 border border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <p className="text-green-400 text-sm mt-1">
              The final pool ID will be <span className="font-medium">{poolName}.poolfactory.near</span>
            </p>
          </div>
          <div className="mb-5">
            <label htmlFor="initialDeposit" className="block text-lg font-medium mb-2">
              Initial Deposit (in yoctoNEAR):
            </label>
            <input
              id="initialDeposit"
              type="text"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
              placeholder="e.g. 1000000000000000000000000"
              required
              className="w-full p-3 bg-gray-900 border border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-md transition-colors"
          >
            Launch Pool
          </button>
        </form>
        {error && (
          <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
        )}
        {result && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-green-400 border-dotted">
            <p className="text-green-400 text-center font-medium">
              {result}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}