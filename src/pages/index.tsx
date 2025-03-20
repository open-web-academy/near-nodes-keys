import { useState } from 'react';
import { generateValidatorKey, KeyPair } from '../utils/keyGenerator';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [accountId, setAccountId] = useState('');
  const [generatedKey, setGeneratedKey] = useState<KeyPair | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const keyData = generateValidatorKey(accountId);
      setGeneratedKey(keyData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDownload = () => {
    if (!generatedKey) return;
    
    const blob = new Blob([JSON.stringify(generatedKey, null, 2)], {
      type: 'application/json'
    });
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
    <div className={styles.container}>
      <h1>NEAR Validator Key Generator</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <label htmlFor="accountId">Staking Pool Account ID:</label>
          <input
            id="accountId"
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="e.g. pool.poolv1.near"
            required
          />
        </div>
        <button type="submit">Generate Key</button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {generatedKey && (
        <div className={styles.result}>
          <h2>Generated Key</h2>
          <div className={styles.keyData}>
            <p><strong>Account ID:</strong> {generatedKey.account_id}</p>
            <p><strong>Public Key:</strong> {generatedKey.public_key}</p>
            <p><strong>Secret Key:</strong> {generatedKey.secret_key}</p>
          </div>
          <button onClick={handleDownload}>Download Key File</button>
        </div>
      )}
    </div>
  );
}