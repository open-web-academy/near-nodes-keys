import crypto from 'crypto';
import bs58 from 'bs58';

export interface KeyPair {
  account_id: string;
  public_key: string;
  secret_key: string;
}

export function generateValidatorKey(accountId: string): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  const publicKeyBytes = publicKey.slice(12);
  const privateKeyBytes = privateKey.slice(16);

  const publicKeyStr = `ed25519:${bs58.encode(Buffer.from(publicKeyBytes))}`;
  const privateKeyStr = `ed25519:${bs58.encode(Buffer.from(privateKeyBytes))}`;

  return {
    account_id: accountId,
    public_key: publicKeyStr,
    secret_key: privateKeyStr
  };
}