"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service, type UserInfo } from "@/src/lib/web3";
import { Modal } from "@/src/components/ui/modal";
import { KeyValue } from "@/src/components/ui/key-value";
import { Spinner } from "@/src/components/ui/spinner";

type TokenDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tokenId: number;
};

export function TokenDetailModal({ isOpen, onClose, tokenId }: TokenDetailModalProps) {
  const { isConnected, account, provider } = useWallet();
  const [meta, setMeta] = useState<{
    id: bigint;
    creator: string;
    name: string;
    totalSupply: bigint;
    features: string;
    parentId: bigint;
    dateCreated: bigint;
  } | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [tree, setTree] = useState<Array<{ id: bigint; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const svc = useMemo(() => new Web3Service(provider), [provider]);

  useEffect(() => {
    if (!isOpen || !isConnected) return;

    const run = async () => {
      setLoading(true);
      try {
        // Load user role to conditionally show lineage for non-producers
        if (account) {
          try {
            const info: UserInfo = await svc.getUserInfo(account);
            setUserRole(info.role || "");
          } catch {
            setUserRole("");
          }
        }

        // Fetch token metadata (public getter excludes balances mapping)
        const raw = await svc.getToken(tokenId);
        const m = {
          id: raw.id as bigint,
          creator: raw.creator as string,
          name: raw.name as string,
          totalSupply: raw.totalSupply as bigint,
          features: raw.features as string,
          parentId: raw.parentId as bigint,
          dateCreated: raw.dateCreated as bigint,
        };
        setMeta(m);

        if (account) {
          const b = await svc.getTokenBalance(tokenId, account);
          setBalance(b);
        }

        // Build parent lineage by following parentId until root
        const nodes: Array<{ id: bigint; name: string }> = [];
        let currentParent = m.parentId;
        while (currentParent !== BigInt(0)) {
          const pRaw = await svc.getToken(Number(currentParent));
          nodes.push({ id: pRaw.id as bigint, name: pRaw.name as string });
          currentParent = pRaw.parentId as bigint;
        }
        setTree(nodes);
      } catch {
        // ignore load errors
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isOpen, isConnected, account, svc, tokenId]);

  const isProducer = userRole.toLowerCase() === "producer";
  const formatDate = (timestamp: bigint) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(timestamp);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Token #${tokenId}`}>
      {!isConnected ? (
        <p className="text-sm text-slate-600">Conecta tu wallet para ver los detalles.</p>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      ) : !meta ? (
        <p className="text-sm text-slate-500">No se pudo cargar la información del token.</p>
      ) : (
        <div className="space-y-6">
          {/* Detalles del token */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Detalles del token</h3>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <KeyValue label="ID" value={`#${meta.id.toString()}`} />
              <KeyValue label="Nombre" value={meta.name} />
              <KeyValue label="Creator" value={<span className="break-all font-mono text-xs">{meta.creator}</span>} />
              <KeyValue label="Total Supply" value={String(meta.totalSupply)} />
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-600">Features:</div>
                <pre className="max-h-40 overflow-auto rounded bg-slate-100 p-3 text-xs font-mono text-slate-700">
                  {meta.features}
                </pre>
              </div>
              <KeyValue label="Fecha de creación" value={formatDate(meta.dateCreated)} />
            </div>
          </section>

          {/* Balance del usuario */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Tu balance</h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-2xl font-bold text-slate-900">
                {balance !== null ? `${String(balance)} / ${String(meta.totalSupply)}` : "-"}
              </div>
            </div>
          </section>

          {/* Parent Tree - solo si no es Producer y tiene parents */}
          {!isProducer && tree.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Árbol de origen</h3>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <ul className="space-y-2">
                  {tree.map((n, idx) => (
                    <li key={n.id.toString()} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-slate-400">{"→".repeat(idx + 1)}</span>
                      <span className="font-medium text-slate-900">#{n.id.toString()}</span>
                      <span>{n.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

