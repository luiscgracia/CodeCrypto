"use client";

import { useMemo } from "react";
import { useWeb3 } from "@/src/contexts/Web3Context";

export function useWallet() {
  const { account, chainId, provider, connect, disconnect } = useWeb3();

  const isConnected = !!account;

  // Memoize a simple facade for wallet-dependent code across the app
  return useMemo(
    () => ({ account, chainId, provider, isConnected, connect, disconnect }),
    [account, chainId, provider, isConnected, connect, disconnect]
  );
}
