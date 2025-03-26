import { WalletSelector } from "@near-wallet-selector/core";

/**
 * Execute a transaction using the appropriate wallet flow
 * Handles both popup wallets (Meteor) and redirect wallets (MyNEAR)
 */
export async function executeTransaction({
  selector,
  receiverId,
  actions,
  accountId,
  callbackUrl = window.location.href
}: {
  selector: WalletSelector;
  receiverId: string;
  actions: any[];
  accountId: string;
  callbackUrl?: string;
}) {
  const wallet = await selector.wallet();
  const walletId = wallet.id;
  
  try {
    // Sign and send transaction 
    const outcome = await wallet.signAndSendTransaction({
      signerId: accountId,
      receiverId,
      actions,
      callbackUrl
    });
    
    // Meteor wallet returns the result immediately
    if (walletId === "meteor-wallet" && outcome) {
      return {
        success: true,
        walletType: "meteor", 
        transactionHash: outcome.transaction?.hash || null
      };
    }
    
    // MyNEAR wallet will redirect, no immediate result
    return {
      success: true,
      walletType: "redirect",
      transactionHash: null // Will be available after redirect
    };
  } catch (error) {
    return {
      success: false,
      walletType: walletId,
      error: error instanceof Error ? error.message : "Transaction failed"
    };
  }
}