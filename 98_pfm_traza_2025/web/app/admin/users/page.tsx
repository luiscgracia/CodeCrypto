"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service, type UserInfo } from "@/src/lib/web3";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/toast";
import { Spinner } from "@/src/components/ui/spinner";
import { extractErrorMessage } from "@/src/lib/errors";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { Card } from "@/src/components/ui/card";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { RolePill } from "@/src/components/ui/role-pill";
import { CONTRACT_CONFIG } from "@/src/contracts/config";

const statusOptions = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Approved" },
  { value: 2, label: "Rejected" },
  { value: 3, label: "Canceled" },
];

function toStatusString(n: number): "pending" | "approved" | "rejected" | "canceled" {
  switch (n) {
    case 1:
      return "approved";
    case 2:
      return "rejected";
    case 3:
      return "canceled";
    case 0:
    default:
      return "pending";
  }
}

export default function AdminUsersPage() {
  const { isConnected, provider, account } = useWallet();
  const isAdmin = !!account && account.toLowerCase() === CONTRACT_CONFIG.adminAddress.toLowerCase();

  const [lookupAddr, setLookupAddr] = useState("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<number>(1);
  const { show } = useToast();

  const [pendingUsers, setPendingUsers] = useState<UserInfo[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  useEffect(() => {
    const loadPending = async () => {
      if (!provider || !isAdmin) return;
      try {
        setLoadingPending(true);
        const svc = new Web3Service(provider);
        // Pull pending addresses from contract and hydrate details per user
        const addrs = await svc.getPendingUsers();
        const infos: UserInfo[] = [];
        for (const a of addrs) {
          try {
            const info = await svc.getUserInfo(a);
            infos.push(info);
          } catch {}
        }
        setPendingUsers(infos);
      } catch (e) {
        // ignore
      } finally {
        setLoadingPending(false);
      }
    };
    void loadPending();
  }, [provider, isAdmin]);

  const act = async (status: number, addressOverride?: string) => {
    const address = addressOverride || lookupAddr;
    if (!address) {
      show("Enter a user address first", "info");
      return;
    }
    try {
      setActionLoading(true);
      const svc = new Web3Service(provider);
      // Submit admin status change transaction
      const receipt = await svc.changeStatusUser(address, status);
      if (receipt?.hash) {
        show(`Tx enviada: ${receipt.hash.slice(0, 10)}…`, "success");
      } else {
        show("Transacción enviada", "success");
      }

      let fresh: UserInfo | null = null;
      for (let i = 0; i < 3; i++) {
        try {
          const info = await svc.getUserInfo(address);
          fresh = info;
        } catch {}
        if (fresh && Number(fresh.status) === status) break;
        await new Promise((res) => setTimeout(res, 500));
      }

      if (!addressOverride) setUser(fresh);

      // Refresh pending list after action to reflect updated queue
      try {
        const addrs = await new Web3Service(provider).getPendingUsers();
        const infos: UserInfo[] = [];
        for (const a of addrs) {
          try {
            const info = await new Web3Service(provider).getUserInfo(a);
            infos.push(info);
          } catch {}
        }
        setPendingUsers(infos);
      } catch {}

      if (!fresh || Number(fresh.status) !== status) {
        show("El estado sigue en pendiente. Actualiza o verifica la cuenta/contrato.", "info");
      }
    } catch (e) {
      const m = extractErrorMessage(e);
      show(m, "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Usuarios y Roles</h1>
        <p className="text-sm text-slate-600">Aprobar, rechazar o cancelar solicitudes de usuarios.</p>
      </div>

      {!isConnected ? (
        <Card className="p-4">
          <p className="text-sm text-slate-600">Connect your wallet to continue.</p>
        </Card>
      ) : !isAdmin ? (
        <Card className="p-4">
          <p className="text-sm text-rose-700">
            Only the admin can manage users. Connected: <span className="font-mono">{account}</span>. Required admin: <span className="font-mono">{CONTRACT_CONFIG.adminAddress}</span>.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-4 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Buscar usuario</h2>
              <p className="text-sm text-slate-600">Introduce la dirección de un usuario para consultar y cambiar su estado.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={lookupAddr}
                onChange={(e) => setLookupAddr(e.target.value)}
                placeholder="0x..."
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button
                onClick={async () => {
                  if (!lookupAddr) {
                    show("Introduce una dirección", "info");
                    return;
                  }
                  try {
                    const svc = new Web3Service(provider);
                    const info = await svc.getUserInfo(lookupAddr);
                    setUser(info);
                  } catch (e) {
                    show(extractErrorMessage(e), "error");
                  }
                }}
                className="whitespace-nowrap"
              >
                Buscar
              </Button>
            </div>
          </Card>

          {user && (
            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-slate-900">Detalles de usuario</h2>
                  <p className="text-xs text-slate-500">ID: {user.id.toString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <RolePill role={user.role || "-"} />
                  <StatusBadge status={toStatusString(Number(user.status))} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-slate-500">Address</div>
                  <div className="font-mono text-sm">{user.userAddress}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-slate-500">Current status</div>
                  <div className="text-sm capitalize">{toStatusString(Number(user.status))}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="status">Change status</Label>
                  <Select
                    id="status"
                    value={selectedStatus as unknown as string}
                    onChange={(e) => setSelectedStatus(Number(e.target.value))}
                    className="w-full"
                  >
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Button onClick={() => act(selectedStatus)} disabled={actionLoading} className="w-full">
                    {actionLoading ? (
                      <span className="inline-flex items-center gap-2"><Spinner /> Actualizando</span>
                    ) : (
                      "Actualizar estado"
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Solicitudes de registro pendientes</h2>
              <Button
                onClick={async () => {
                  try {
                    setLoadingPending(true);
                    const addrs = await new Web3Service(provider).getPendingUsers();
                    const infos: UserInfo[] = [];
                    for (const a of addrs) {
                      try {
                        const info = await new Web3Service(provider).getUserInfo(a);
                        infos.push(info);
                      } catch {}
                    }
                    setPendingUsers(infos);
                  } catch (e) {
                    show(extractErrorMessage(e), "error");
                  } finally {
                    setLoadingPending(false);
                  }
                }}
                disabled={loadingPending}
                className="text-xs px-3 py-1.5"
              >
                {loadingPending ? <span className="inline-flex items-center gap-2"><Spinner /> Actualizando</span> : "Actualizar"}
              </Button>
            </div>
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-slate-600">No hay usuarios pendientes.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {pendingUsers.map((u) => (
                  <div key={u.userAddress} className="flex items-center justify-between p-2 text-sm">
                    <span className="font-mono">{u.userAddress}</span>
                    <div className="flex items-center gap-2">
                      <RolePill role={u.role || "-"} />
                      <StatusBadge status={toStatusString(Number(u.status))} />
                      <Button onClick={() => act(1, u.userAddress)} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs">Aprobar</Button>
                      <Button onClick={() => act(2, u.userAddress)} className="bg-rose-600 hover:bg-rose-500 px-3 py-1 text-xs">Rechazar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </main>
  );
}
