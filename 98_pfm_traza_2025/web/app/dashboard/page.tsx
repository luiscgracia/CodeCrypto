"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service } from "@/src/lib/web3";
import { CONTRACT_CONFIG } from "@/src/contracts/config";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { RolePill } from "@/src/components/ui/role-pill";

export default function Page() {
  const { isConnected, account, provider } = useWallet();
  const svc = useMemo(() => new Web3Service(provider), [provider]);
  const [pendingTransfers, setPendingTransfers] = useState<number>(0);
  const [tokensCount, setTokensCount] = useState<number>(0);
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
      try {
        const ids = await svc.getUserTransfers(account);
        // We don't fetch each status here for perf; leave as total pending unknown unless detail loaded elsewhere.
        // Rough pending count by fetching first few
        let pending = 0;
        for (const id of ids.slice(0, 10)) {
          const t = await svc.getTransfer(Number(id));
          if (Number(t.status) === 0) pending++;
        }
        setPendingTransfers(pending);
      } catch {}
      try {
        const tids = await svc.getUserTokens(account);
        setTokensCount(tids.length);
      } catch {}
    };
    void run();
  }, [isConnected, account, svc]);

  return (
    <main className="page-shell space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Resumen rápido de tu actividad dentro de la red.</p>
      </div>
      {!isConnected ? (
        <p className="text-sm text-slate-500">Conecta tu wallet para ver tu resumen.</p>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="surface space-y-2">
              <div className="text-sm text-slate-500">Tus tokens</div>
              <div className="text-3xl font-semibold text-slate-900">{tokensCount}</div>
            </div>
            <div className="surface space-y-2">
              <div className="text-sm text-slate-500">Pendientes de aceptar</div>
              <div className="text-3xl font-semibold text-slate-900">{pendingTransfers}</div>
            </div>
            <div className="surface space-y-2">
              <div className="text-sm text-slate-500">Tu estado</div>
              <div className="flex items-center gap-2">
                {status !== null && (
                  <StatusBadge status={status === 0 ? "pending" : status === 1 ? "approved" : status === 2 ? "rejected" : "canceled"} />
                )}
                {role && <RolePill role={role} />}
              </div>
            </div>
          </section>
          <section className="surface space-y-3">
            <div className="text-sm font-medium text-slate-700">Siguientes pasos</div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Crea un token si tu rol lo permite.</li>
              <li>Revisa transferencias pendientes para mantener el flujo.</li>
              <li>Actualiza tu perfil con la información más reciente.</li>
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
