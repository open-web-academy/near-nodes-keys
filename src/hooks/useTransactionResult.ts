import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
export function useTransactionResult() {
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Handle redirect response from MyNEAR wallet
    if (router.query.transactionHashes) {
      const txHash = Array.isArray(router.query.transactionHashes) 
        ? router.query.transactionHashes[0] 
        : router.query.transactionHashes;
      
      setTransactionHash(txHash);
      
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('transactionHashes');
      url.searchParams.delete('errorCode');
      url.searchParams.delete('errorMessage');
      window.history.replaceState({}, document.title, url.toString());
    }
    
    if (router.query.errorCode) {
      const errorMessage = router.query.errorMessage 
        ? (Array.isArray(router.query.errorMessage) 
            ? router.query.errorMessage[0] 
            : router.query.errorMessage)
        : 'Unknown error';
      
      setTransactionError(errorMessage);
      
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('transactionHashes');
      url.searchParams.delete('errorCode');
      url.searchParams.delete('errorMessage');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [router.query]);

  const clearTransactionResult = () => {
    setTransactionHash(null);
    setTransactionError(null);
  };

  return { transactionHash, transactionError, clearTransactionResult };
}