import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export function useTransactionResult() {
  const router = useRouter();
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for transaction hashes in URL when the component mounts or route changes
    if (typeof router.query.transactionHashes === 'string') {
      const txHash = router.query.transactionHashes;
      setTransactionHash(txHash);
      
      // Clean URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('transactionHashes');
      url.searchParams.delete('errorCode');
      window.history.replaceState({}, document.title, url.toString());
    }
    
    if (typeof router.query.errorCode === 'string') {
      setTransactionError(router.query.errorMessage as string || 'Transaction failed');
      
      // Clean URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('transactionHashes');
      url.searchParams.delete('errorCode');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [router.query]);
  
  return {
    transactionHash,
    transactionError,
    clearTransactionResult: () => {
      setTransactionHash(null);
      setTransactionError(null);
    }
  };
}