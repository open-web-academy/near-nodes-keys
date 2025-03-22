import { useState, useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { addMinutes, formatISO } from 'date-fns';
import type { WalletSelector, AccountState } from "@near-wallet-selector/core";
import styles from '../styles/SignTransaction.module.css';
import "@near-wallet-selector/modal-ui/styles.css";
import { Buffer } from 'buffer';

interface TransactionForm {
  zcashAddress: string;
  amount: string;
}

export default function SignTransaction() {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [formData, setFormData] = useState<TransactionForm>({
    zcashAddress: '',
    amount: '4070876',
  });
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setupWalletSelector({
      network: "mainnet",
      modules: [setupMeteorWallet()]
    }).then((selector) => {
      setSelector(selector);
      setModal(setupModal(selector, { contractId: "intents.near" }));

      // Get accounts if already signed in
      selector.store.observable.subscribe((state) => {
        setAccounts(state.accounts);
      });
    });
  }, []);

  const handleSignIn = () => {
    modal?.show();
  };

  const handleSignOut = async () => {
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
      const deadline = formatISO(addMinutes(new Date(), 2));
      
      // Create a 32-byte nonce using Web Crypto API
      const nonceArray = window.crypto.getRandomValues(new Uint8Array(32));
      // Convert Uint8Array to regular array before creating Buffer
      const nonceBuffer = Buffer.from(Array.from(nonceArray));
      
      console.log('Nonce array:', Array.from(nonceArray));
      console.log('Nonce array length:', nonceArray.length);
      console.log('Nonce buffer:', nonceBuffer);
      console.log('Nonce buffer length:', nonceBuffer.length);
      console.log('Nonce base64:', nonceBuffer.toString('base64'));
      
      const payload = {
        callbackUrl: "http://localhost:3000/my-near-wallet-gateway/?channelId=16840a22-1c5e-42e2-a8ac-0f3db5cdbd13",
        message: JSON.stringify({
          deadline,
          intents: [{
            intent: "ft_withdraw",
            token: "zec.omft.near",
            receiver_id: "zec.omft.near",
            amount: formData.amount,
            memo: `WITHDRAW_TO:${formData.zcashAddress}`
          }],
          signer_id: accounts[0].accountId
        }),
        nonce: nonceBuffer.toString('base64'),
        recipient: "intents.near"
      };

      const payloadString = JSON.stringify(payload);
      
      console.log('Payload:', payload);
      console.log('Payload String:', payloadString);

      const signature = await wallet.signMessage({
        message: payloadString,
        recipient: "intents.near",
        nonce: nonceBuffer, // Pass the Buffer directly
      });

      console.log('Signature:', signature);

      const signedPayload = {
        payload,
        standard: "nep413",
        public_key: accounts[0].publicKey,
        signature: `ed25519:${Buffer.from(signature).toString('base64')}`
      };

      console.log('Signed Payload:', signedPayload);

      // Sign and execute the transaction
      const transaction = {
        signerId: accounts[0].accountId,
        receiverId: "intents.near",
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "execute_intents",
            args: {
              signed: [signedPayload]
            },
            gas: "300000000000000",
            deposit: "0"
          }
        }]
      };

      console.log('Transaction:', transaction);

      try {
        const outcome = await wallet.signAndSendTransaction(transaction);
        setResult(`Transaction submitted! Transaction hash: ${outcome.transaction.hash}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit transaction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Sign ZEC Withdrawal Transaction</h1>

      <div className={styles.wallet}>
        {accounts.length === 0 ? (
          <button onClick={handleSignIn}>Connect Wallet</button>
        ) : (
          <div>
            <span>Connected: {accounts[0].accountId}</span>
            <button onClick={handleSignOut}>Disconnect</button>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <label htmlFor="zcashAddress">Zcash Address:</label>
          <input
            id="zcashAddress"
            type="text"
            value={formData.zcashAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, zcashAddress: e.target.value }))}
            required
            placeholder="zs1..."
          />
        </div>

        <div>
          <label htmlFor="amount">Amount (in smallest unit):</label>
          <input
            id="amount"
            type="text"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>

        <button type="submit" disabled={accounts.length === 0}>
          Submit Transaction
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
      
      {result && (
        <div className={styles.result}>
          <h2>Transaction Result:</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}