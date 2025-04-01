import { useEffect } from 'react';
import { useTransactionResult } from '../hooks/useTransactionResult';

interface TransactionResultProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export default function TransactionResult({
  onSuccess,
  onError,
  successMessage = 'Transaction successful!',
  errorMessage = 'Transaction failed:'
}: TransactionResultProps) {
  const { transactionHash, transactionError, clearTransactionResult } = useTransactionResult();

  useEffect(() => {
    if (transactionHash) {
      onSuccess?.(transactionHash);
      clearTransactionResult();
    }
    
    if (transactionError) {
      onError?.(transactionError);
      clearTransactionResult();
    }
  }, [transactionHash, transactionError, clearTransactionResult, onSuccess, onError]);

  return null;
} 