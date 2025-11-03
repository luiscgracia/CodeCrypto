"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Button } from "@/src/components/ui/button";
import { Web3Service } from "@/src/lib/web3";
import { CONTRACT_CONFIG } from "@/src/contracts/config";

export default function Header() {
  const { account, isConnected, connect, disconnect, provider } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        // Simple local admin check against configured admin address
        setIsAdmin(!!account && account.toLowerCase() === CONTRACT_CONFIG.adminAddress.toLowerCase());
        if (provider && account) {
          const svc = new Web3Service(provider);
          const info = await svc.getUserInfo(account);
          // status: 0 Pending, 1 Approved, 2 Rejected, 3 Canceled
          setIsApproved(Number(info.status) === 1);
        } else {
          setIsApproved(false);
        }
      } catch {
        setIsApproved(false);
      }
    };
    void run();
  }, [account, provider]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Supply Chain Tracker
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-slate-600 sm:flex">
          <Link className="transition-colors hover:text-slate-900" href="/">
            Home
          </Link>
          {!isAdmin && isApproved && (
            <>
              <Link className="transition-colors hover:text-slate-900" href="/tokens">
                Tokens
              </Link>
              <Link className="transition-colors hover:text-slate-900" href="/transfers">
                Transfers
              </Link>
            </>
          )}
          {isAdmin && (
            <Link className="transition-colors hover:text-slate-900" href="/admin">
              Admin
            </Link>
          )}
          {!isAdmin && (
            <Link className="transition-colors hover:text-slate-900" href="/profile">
              Profile
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Button
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 text-xs font-medium"
              onClick={disconnect}
            >
              Desconectar
            </Button>
          ) : (
            <Button onClick={() => void connect()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 text-xs font-medium">
              Conectar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
