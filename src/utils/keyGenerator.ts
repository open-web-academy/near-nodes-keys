import nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface KeyPair {
  account_id: string;
  public_key: string;
  secret_key: string;
}

export function generateValidatorKey(accountId: string): KeyPair {
  const keypair = nacl.sign.keyPair(); // Generates a keypair with 32-byte publicKey and 64-byte secretKey
  const publicKeyStr = `ed25519:${bs58.encode(keypair.publicKey)}`;
  const secretKeyStr = `ed25519:${bs58.encode(keypair.secretKey)}`;
  return {
    account_id: accountId,
    public_key: publicKeyStr,
    secret_key: secretKeyStr,
  };
}