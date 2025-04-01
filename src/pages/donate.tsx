import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { utils } from 'near-api-js';

const DONATION_ADDRESS = 'open-web-academy.sputnik-dao.near';
const VALIDATOR_NODE = 'owa.poolv1.near';

const PRESET_AMOUNTS = [1, 5, 10, 30, 50];

export default function Donate() {
  const { selector, accounts, isLoading: isWalletLoading } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePresetAmount = (value: number) => {
    setAmount(value.toString());
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setAmount('');
  };

  const handleDonate = async () => {
    if (!selector || accounts.length === 0) {
      alert('Please connect your wallet first');
      return;
    }

    const donationAmount = amount || customAmount;
    if (!donationAmount || isNaN(Number(donationAmount))) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      const yoctoAmount = utils.format.parseNearAmount(donationAmount);
      
      if (!yoctoAmount) {
        throw new Error('Invalid amount format');
      }

      const wallet = await selector.wallet();
      const accountId = accounts[0].accountId;
      
      if (!accountId) {
        throw new Error('No account ID available');
      }

      await wallet.signAndSendTransaction({
        signerId: accountId as string,
        receiverId: DONATION_ADDRESS,
        actions: [{
          type: 'Transfer',
          params: {
            deposit: yoctoAmount
          }
        }]
      });

      alert('Thank you for your donation!');
      setAmount('');
      setCustomAmount('');
    } catch (error) {
      console.error('Donation error:', error);
      alert('Failed to process donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-terminal-green">Support Open Web Academy</h1>
        
        {/* Donation Section */}
        <div className="bg-black/50 border border-terminal-green/20 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-terminal-green">Make a Donation</h2>
          <p className="mb-6 text-terminal-green/80">
            Support Open Web Academy in developing more products and tools for the NEAR ecosystem.
            Your contribution helps us continue building valuable tools for the community.
          </p>

          {/* Preset Amounts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {PRESET_AMOUNTS.map((value) => (
              <button
                key={value}
                onClick={() => handlePresetAmount(value)}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  amount === value.toString()
                    ? 'bg-terminal-green/10 border-terminal-green text-terminal-green'
                    : 'border-terminal-green/30 hover:border-terminal-green/50 text-terminal-green/80 hover:text-terminal-green'
                }`}
              >
                {value} NEAR
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="block text-terminal-green/80 mb-2">Custom Amount (NEAR)</label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmount(e.target.value)}
              className="w-full p-3 rounded-lg bg-black/50 border border-terminal-green/30 text-terminal-green focus:border-terminal-green focus:outline-none"
              placeholder="Enter amount"
              min="0"
              step="0.1"
            />
          </div>

          {/* Donate Button */}
          <button
            onClick={handleDonate}
            disabled={isLoading || (!amount && !customAmount) || accounts.length === 0}
            className={`w-full p-4 rounded-lg font-semibold transition-all duration-200 ${
              isLoading || (!amount && !customAmount) || accounts.length === 0
                ? 'bg-terminal-green/20 text-terminal-green/50 cursor-not-allowed'
                : 'bg-terminal-green/10 hover:bg-terminal-green/20 text-terminal-green'
            }`}
          >
            {isLoading ? 'Processing...' : accounts.length === 0 ? 'Connect Wallet to Donate' : 'Donate NEAR'}
          </button>
        </div>

        {/* Alternative Staking Option */}
        <div className="bg-black/50 border border-terminal-green/20 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-terminal-green">Alternative: Stake with Our Validator</h2>
          <p className="mb-4 text-terminal-green/80">
            Another way to support Open Web Academy is by staking your NEAR tokens with our validator node.
            This helps secure the network and provides you with staking rewards.
          </p>
          <div className="bg-black/30 p-4 rounded-lg border border-terminal-green/20">
            <p className="font-mono text-terminal-green">
              <span className="text-terminal-green/80">Validator Node:</span>{' '}
              <span className="font-bold">{VALIDATOR_NODE}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 