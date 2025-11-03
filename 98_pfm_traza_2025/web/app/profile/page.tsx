"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service } from "@/src/lib/web3";
import { CONTRACT_CONFIG } from "@/src/contracts/config";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { RolePill } from "@/src/components/ui/role-pill";

export default function Page() {
  const { isConnected, account, chainId, provider } = useWallet();
  const svc = useMemo(() => new Web3Service(provider), [provider]);
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<number | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!isConnected || !account) return;
      if (!CONTRACT_CONFIG.address || CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000") return;
      try {
        const info = await svc.getUserInfo(account);
        setRole(info.role);
        setStatus(info.status);
      } catch {}
    };
    void run();
  }, [isConnected, account, svc]);

  return (
    <main className="page-shell space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Perfil</h1>
        <p className="text-sm text-slate-600">Consulta los detalles de tu conexión y estado en la red.</p>
      </div>
      {!isConnected ? (
        <p className="text-sm text-slate-500">Conecta tu wallet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="surface space-y-3">
            <div className="text-sm font-medium text-slate-700">Wallet</div>
            <div className="break-all text-sm text-slate-800">{account}</div>
            <div className="text-xs text-slate-500">Chain ID: {chainId ?? "-"}</div>
          </section>
          <section className="surface space-y-3">
            <div className="text-sm font-medium text-slate-700">Estado</div>
            <div className="flex items-center gap-2">
              {status !== null && (
                <StatusBadge status={status === 0 ? "pending" : status === 1 ? "approved" : status === 2 ? "rejected" : "canceled"} />
              )}
              {role && <RolePill role={role} />}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
