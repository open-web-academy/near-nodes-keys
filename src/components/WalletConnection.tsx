import { useWallet } from '../contexts/WalletContext';

export default function WalletConnection() {
  const { accounts, connect, disconnect, isLoading } = useWallet();

  return (
    <div className="text-center">
      {accounts.length === 0 ? (
        <button
          onClick={connect}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
          <span className="text-green-400 font-medium text-sm sm:text-base">
            Connected: {accounts[0].accountId}
          </span>
          <button
            onClick={disconnect}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md transition-colors text-sm sm:text-base"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
} 