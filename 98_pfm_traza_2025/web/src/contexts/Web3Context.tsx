"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { ethers } from "ethers";

type Web3State = {
  account: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const Ctx = createContext<Web3State | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const prevAccount = useRef<string | null>(null);

  const disconnect = useCallback(() => {
    // Clear connection state and local persistence
    setProvider(null);
    setAccount(null);
    setChainId(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("web3.account");
    }
  }, []);

  const connect = useCallback(async () => {
    console.log("Web3Context.connect called");
    if (typeof window === "undefined") throw new Error("No window");
    const eth = window.ethereum;
    if (!eth) throw new Error("MetaMask not detected");
    // Use EIP-1193 provider via ethers v6 BrowserProvider
    const browserProvider = new ethers.BrowserProvider(eth as unknown as ethers.Eip1193Provider);
    const accs = (await browserProvider.send("eth_requestAccounts", [])) as string[];
    const network = await browserProvider.getNetwork();
    const addr = ethers.getAddress(accs[0]);
    console.log("Connected to account:", addr, "chainId:", Number(network.chainId));
    setProvider(browserProvider);
    setAccount(addr);
    setChainId(Number(network.chainId));
    window.localStorage.setItem("web3.account", addr);
    prevAccount.current = addr;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("web3.account");
    console.log("Web3Context mounted, saved account:", saved);
    if (saved) {
      console.log("Auto-reconnecting to saved account...");
      setTimeout(() => {
        void connect();
      }, 0);
    }
    const eth = window.ethereum;
    if (eth && eth.on) {
      // React to account changes and chain switches from the wallet
      const onAccountsChanged = (...args: unknown[]) => {
        const list = (args && (args[0] as string[])) || [];
        const next = list && list.length ? ethers.getAddress(list[0]) : null;
        if (!next) {
          disconnect();
          prevAccount.current = null;
          return;
        }
        // Update state and storage
        setAccount(next);
        window.localStorage.setItem("web3.account", next);
        // Reload app when actual account changes to ensure clean state across pages
        const before = prevAccount.current;
        prevAccount.current = next;
        if (before && before !== next) {
          try {
            window.location.reload();
          } catch {
            // noop
          }
        }
      };
      const onChainChanged = (...args: unknown[]) => {
        const cid = args ? args[0] : undefined;
        if (typeof cid === "string") setChainId(parseInt(cid, 16));
        else if (typeof cid === "number") setChainId(cid);
      };
      eth.on("accountsChanged", onAccountsChanged);
      eth.on("chainChanged", onChainChanged);
      return () => {
        eth.removeListener?.("accountsChanged", onAccountsChanged);
        eth.removeListener?.("chainChanged", onChainChanged);
      };
    }
  }, [connect, disconnect]);

  const value: Web3State = useMemo(
    () => ({ account, chainId, provider, connect, disconnect }),
    [account, chainId, provider, connect, disconnect]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}
