"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service } from "@/src/lib/web3";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { TransferTokenModal } from "@/src/components/TransferTokenModal";
import { transferStatusLabel, transferStatusVariant } from "@/src/lib/status";
import { useToast } from "@/src/components/ui/toast";
import { Spinner } from "@/src/components/ui/spinner";
import { extractErrorMessage } from "@/src/lib/errors";

export default function Page() {
  const { isConnected, account, provider } = useWallet();
  const router = useRouter();
  const [ids, setIds] = useState<bigint[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  type TransferDetails = {
    id: bigint;
    from: string;
    to: string;
    tokenId: bigint;
    tokenName: string;
    dateCreated: bigint;
    amount: bigint;
    status: number;
  };
  const [details, setDetails] = useState<Record<string, TransferDetails>>({});
  // Inline messages removed; errors will be shown only via Toast
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const { show } = useToast();

  const load = useCallback(async () => {
    if (!isConnected || !account) return;
    try {
      const svc = new Web3Service(provider);
      // Fetch all transfer ids involving the current account
      const res = await svc.getUserTransfers(account);
      setIds(res);
      const next: Record<string, TransferDetails> = {};
      for (const id of res) {
        try {
          const raw = await svc.getTransfer(Number(id));
          let tokenName = `Token #${raw.tokenId}`;
          try {
            const tokenInfo = await svc.getToken(Number(raw.tokenId));
            tokenName = tokenInfo.name || tokenName;
          } catch {
            // Keep default name
          }
          next[id.toString()] = {
            id: raw.id as bigint,
            from: raw.from as string,
            to: raw.to as string,
            tokenId: raw.tokenId as bigint,
            tokenName,
            dateCreated: raw.dateCreated as bigint,
            amount: raw.amount as bigint,
            status: Number(raw.status) // 0 Pending, 1 Accepted, 2 Rejected, 3 Canceled
          };
        } catch {
          // ignore individual failures
        }
      }
      setDetails(next);
    } catch {
      // ignore
    }
  }, [isConnected, account, provider]);

  useEffect(() => {
    void load();
  }, [load]);

  // Redirect to home if current account is not registered in the contract
  useEffect(() => {
    const checkRegistration = async () => {
      if (!isConnected || !account) return;
      try {
        const svc = new Web3Service(provider);
        const info = await svc.getUserInfo(account);
        if (!info || info.id === BigInt(0)) {
          router.push("/");
        }
      } catch {
        router.push("/");
      }
    };
    void checkRegistration();
  }, [isConnected, account, provider, router]);

  // Load user role
  useEffect(() => {
    const run = async () => {
      if (!isConnected || !account) {
        setUserRole("");
        return;
      }
      try {
        const svc = new Web3Service(provider);
        const info = await svc.getUserInfo(account);
        setUserRole(info.role || "");
      } catch {
        setUserRole("");
      }
    };
    void run();
  }, [isConnected, account, provider]);

  const act = async (id: bigint, type: "accept" | "reject" | "cancel") => {
    try {
      setLoadingId(id.toString());
      // no inline status message
      const svc = new Web3Service(provider);
      if (type === "accept") {
        // Only recipient can accept
        await svc.acceptTransfer(Number(id));
        show("Transferencia aceptada", "success");
      } else if (type === "reject") {
        // Recipient or admin can reject
        await svc.rejectTransfer(Number(id));
        show("Transferencia rechazada", "success");
      } else if (type === "cancel") {
        // Sender can cancel a pending transfer
        await svc.cancelTransfer(Number(id));
        show("Transferencia cancelada", "success");
      }
      // no inline status message
      await load();
    } catch (e) {
      const m = extractErrorMessage(e);
      show(m, "error");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <main className="page-shell space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Transferencias</h1>
          <p className="text-sm text-slate-600">Gestiona solicitudes pendientes y revisa tu historial reciente.</p>
        </div>
        {isConnected && userRole.toLowerCase() !== "consumer" && (
          <Button onClick={() => setIsTransferModalOpen(true)}>
            Nueva transferencia
          </Button>
        )}
      </div>
      {!isConnected ? (
        <p className="text-sm text-slate-500">Conecta tu wallet para ver transferencias.</p>
      ) : (
        <div className="space-y-6">
          {/* Transferencias enviadas pendientes (oculto para Consumer) */}
          {userRole.toLowerCase() !== "consumer" && (
            <section className="surface space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Transferencias enviadas</h2>
                  <p className="text-sm text-slate-600">Pendientes de aprobación por el destinatario</p>
                </div>
                <Badge variant="yellow">
                  {ids.filter((i) => {
                    const d = details[i.toString()];
                    return d?.status === 0 && d?.from.toLowerCase() === account?.toLowerCase();
                  }).length} pendientes
                </Badge>
              </div>
              <div className="space-y-3">
                {ids.filter((i) => {
                  const d = details[i.toString()];
                  return d?.status === 0 && d?.from.toLowerCase() === account?.toLowerCase();
                }).length === 0 ? (
                  <p className="text-sm text-slate-500">No tienes transferencias enviadas pendientes.</p>
                ) : (
                  ids
                    .filter((i) => {
                      const d = details[i.toString()];
                      return d?.status === 0 && d?.from.toLowerCase() === account?.toLowerCase();
                    })
                    .map((id) => {
                      const d = details[id.toString()];
                      return (
                        <div
                          key={id.toString()}
                          className="surface-muted flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">{d?.tokenName}</span>
                              <Badge variant="gray">Transfer #{id.toString()}</Badge>
                            </div>
                            <div className="text-xs text-slate-600">
                              <div><span className="text-slate-500">Para:</span> {d?.to}</div>
                              <div><span className="text-slate-500">Cantidad:</span> {String(d?.amount ?? "?")}</div>
                              <div><span className="text-slate-500">Fecha:</span> {d ? new Date(Number(d.dateCreated) * 1000).toLocaleString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              }) : "?"}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              onClick={() => act(id, "cancel")}
                              className="bg-slate-600 hover:bg-slate-500"
                              disabled={loadingId === id.toString()}
                            >
                              {loadingId === id.toString() ? (
                                <span className="inline-flex items-center gap-2">
                                  <Spinner /> Cancelando
                                </span>
                              ) : (
                                "Cancelar"
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </section>
          )}

          {/* Transferencias recibidas pendientes */}
          <section className="surface space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Transferencias recibidas</h2>
                <p className="text-sm text-slate-600">Solicitudes pendientes de tu aprobación</p>
              </div>
              <Badge variant="yellow">
                {ids.filter((i) => {
                  const d = details[i.toString()];
                  return d?.status === 0 && d?.to.toLowerCase() === account?.toLowerCase();
                }).length} pendientes
              </Badge>
            </div>
            <div className="space-y-3">
              {ids.filter((i) => {
                const d = details[i.toString()];
                return d?.status === 0 && d?.to.toLowerCase() === account?.toLowerCase();
              }).length === 0 ? (
                <p className="text-sm text-slate-500">No tienes transferencias recibidas pendientes.</p>
              ) : (
                ids
                  .filter((i) => {
                    const d = details[i.toString()];
                    return d?.status === 0 && d?.to.toLowerCase() === account?.toLowerCase();
                  })
                  .map((id) => {
                    const d = details[id.toString()];
                    return (
                      <div
                        key={id.toString()}
                        className="surface-muted flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{d?.tokenName}</span>
                            <Badge variant="gray">Transfer #{id.toString()}</Badge>
                          </div>
                          <div className="text-xs text-slate-600">
                            <div><span className="text-slate-500">De:</span> {d?.from}</div>
                            <div><span className="text-slate-500">Cantidad:</span> {String(d?.amount ?? "?")}</div>
                            <div><span className="text-slate-500">Fecha:</span> {d ? new Date(Number(d.dateCreated) * 1000).toLocaleString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "?"}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={() => act(id, "accept")}
                            className="bg-emerald-600 hover:bg-emerald-500"
                            disabled={loadingId === id.toString()}
                          >
                            {loadingId === id.toString() ? (
                              <span className="inline-flex items-center gap-2">
                                <Spinner /> Aceptando
                              </span>
                            ) : (
                              "Aceptar"
                            )}
                          </Button>
                          <Button
                            onClick={() => act(id, "reject")}
                            className="bg-rose-500 hover:bg-rose-400"
                            disabled={loadingId === id.toString()}
                          >
                            {loadingId === id.toString() ? (
                              <span className="inline-flex items-center gap-2">
                                <Spinner /> Rechazando
                              </span>
                            ) : (
                              "Rechazar"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </section>

          {/* Historial */}
          <section className="surface space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Historial</h2>
              <Badge variant="gray">Actividad</Badge>
            </div>
            <div className="space-y-3">
              {ids.filter((i) => [1, 2, 3].includes(details[i.toString()]?.status ?? -1)).length === 0 ? (
                <p className="text-sm text-slate-500">No hay transferencias completadas.</p>
              ) : (
                ids
                  .filter((i) => [1, 2, 3].includes(details[i.toString()]?.status ?? -1))
                  .map((id) => {
                    const d = details[id.toString()];
                    const statusLabel = transferStatusLabel(d?.status ?? -1);
                    const isSender = d?.from.toLowerCase() === account?.toLowerCase();
                    return (
                      <div key={id.toString()} className="surface-muted space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{d?.tokenName}</span>
                            <Badge variant="gray">#{id.toString()}</Badge>
                          </div>
                          <Badge variant={transferStatusVariant(d?.status ?? -1)}>{statusLabel}</Badge>
                        </div>
                        <div className="text-xs text-slate-600">
                          <div><span className="text-slate-500">{isSender ? "Para:" : "De:"}</span> {isSender ? d?.to : d?.from}</div>
                          <div><span className="text-slate-500">Cantidad:</span> {String(d?.amount ?? "?")}</div>
                          <div><span className="text-slate-500">Fecha:</span> {d ? new Date(Number(d.dateCreated) * 1000).toLocaleString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "?"}</div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        </div>
      )}

      <TransferTokenModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          setIsTransferModalOpen(false);
          void load();
        }}
      />
    </main>
  );
}
