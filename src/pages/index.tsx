import { useState } from 'react';
import { generateValidatorKey, KeyPair } from '../utils/keyGenerator';

export default function Home() {
  const [accountId, setAccountId] = useState('');
  const [generatedKey, setGeneratedKey] = useState<KeyPair | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const poolId = accountId.endsWith('.poolv1.near')
      ? accountId
      : `${accountId}.poolv1.near`;

    try {
      const keyData = generateValidatorKey(poolId);
      setGeneratedKey(keyData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDownload = () => {
    if (!generatedKey) return;
    const blob = new Blob([JSON.stringify(generatedKey, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedKey.account_id}.validator_key.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-900 text-green-400 font-mono rounded-lg border border-green-400 border-dotted shadow-md">
      <h1 className="text-4xl font-extrabold text-center mb-6 tracking-widest">
        NEAR Validator Key Generator
      </h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="accountId" className="block text-lg font-medium mb-2">
            Staking Pool ID:
          </label>
          <div className="flex">
            <input
              id="accountId"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. pool"
              required
              className="flex-1 p-3 bg-gray-800 border border-green-400 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <span className="inline-flex items-center px-4 bg-gray-800 border border-l-0 border-green-400 rounded-r-md">
              .poolv1.near
            </span>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-md transition-colors"
        >
          Generate Key
        </button>
      </form>
      {error && (
        <p className="text-red-500 text-center mb-4">
          {error}
        </p>
      )}
      {generatedKey && (
        <div className="p-4 border border-green-400 border-dotted rounded-lg">
          <h2 className="text-2xl font-bold text-center mb-4">
            Generated Key
          </h2>
          <textarea
            readOnly
            className="w-full p-4 bg-gray-800 border border-green-400 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            value={JSON.stringify(generatedKey, null, 2)}
            rows={10}
          />
          <button
            onClick={handleDownload}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors"
          >
            Download Key File
          </button>
        </div>
      )}
    </div>
  );
}