"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service, type UserInfo } from "@/src/lib/web3";
import { CONTRACT_CONFIG } from "@/src/contracts/config";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { userStatusLabel, userStatusVariant } from "@/src/lib/status";
import { useToast } from "@/src/components/ui/toast";
import { Spinner } from "@/src/components/ui/spinner";
import { extractErrorMessage } from "@/src/lib/errors";

function normalizeStatus(n: number | null): number | null {
  if (n === null) return null;
  return n >= 0 && n <= 3 ? n : null;
}

export default function Home() {
  const { isConnected, account, connect, disconnect, provider } = useWallet();
  const { show } = useToast();
  const [role, setRole] = useState<string>("Producer");
  const [message, setMessage] = useState<string>("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [pendingAddrs, setPendingAddrs] = useState<string[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserInfo[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [requestedRole, setRequestedRole] = useState<string | null>(null);

  const isAdmin = !!account && account.toLowerCase() === CONTRACT_CONFIG.adminAddress.toLowerCase();

  const refreshUserInfo = async () => {
    console.log("refreshUserInfo called", { account, hasProvider: !!provider, contractAddress: CONTRACT_CONFIG.address });
    if (!account || CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000") {
      console.log("Early return: no account or contract not configured");
      setUserInfo(null);
      return;
    }
    if (!provider) {
      console.log("Early return: no provider");
      setUserInfo(null);
      return;
    }
    try {
      setLoadingInfo(true);
      console.log("Calling getUserInfo for account:", account);
      const svc = new Web3Service(provider);
      const info = await svc.getUserInfo(account);
      console.log("getUserInfo response:", info);
      setUserInfo(info);
      // Fallback: if not registered (id==0) try to infer Pending from latest events
      // This allows reflecting an in-flight request before storage is updated, based on emitted logs
      if (!info || info.id === BigInt(0) || !info.userAddress || info.userAddress === "0x0000000000000000000000000000000000000000") {
        console.log("User not found in contract, checking events...");
        try {
          const last = await svc.getLastUserStatusChange(account);
          if (last && Number(last.status) === 0) {
            const logs = await svc.getRecentRoleRequests(4000);
            const myLast = logs.filter((l) => l.user.toLowerCase() === account.toLowerCase()).pop();
            if (myLast) setRequestedRole(myLast.role);
          }
        } catch (e) {
          console.error("Error checking events:", e);
        }
      }
    } catch (e) {
      console.error("Error in refreshUserInfo:", e);
      setUserInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    void refreshUserInfo();
    setRequestedRole(null);
  }, [account, provider]);

  useEffect(() => {
    if (!provider || CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000") return;
    let c: any;
    (async () => {
      try {
        const { ethers } = await import("ethers");
        const signer = await provider.getSigner();
        c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
        const onRoleReq = (user: string, roleReq: string) => {
          if (account && user && user.toLowerCase() === account.toLowerCase()) {
            setRequestedRole(roleReq || "");
            void refreshUserInfo();
          }
        };
        const onStatus = (user: string) => {
          if (account && user && user.toLowerCase() === account.toLowerCase()) {
            void refreshUserInfo();
          }
        };
        c.on("UserRoleRequested", onRoleReq);
        c.on("UserStatusChanged", onStatus);
      } catch {}
    })();
    return () => {
      try {
        c?.removeAllListeners?.("UserRoleRequested");
        c?.removeAllListeners?.("UserStatusChanged");
      } catch {}
    };
  }, [provider, account]);

  useEffect(() => {
    const loadPending = async () => {
      if (!isAdmin || !provider) {
        setPendingAddrs([]);
        setPendingUsers([]);
        return;
      }
      try {
        setLoadingPending(true);
        const svc = new Web3Service(provider);
        const addrs = await svc.getPendingUsers();
        setPendingAddrs(addrs);
        const infos: UserInfo[] = [];
        for (const a of addrs) {
          try {
            const info = await svc.getUserInfo(a);
            infos.push(info);
          } catch {}
        }
        setPendingUsers(infos);
      } catch (e) {
        show(extractErrorMessage(e), "error");
      } finally {
        setLoadingPending(false);
      }
    };
    void loadPending();
  }, [isAdmin, provider]);

  const status = normalizeStatus(userInfo ? Number(userInfo.status) : null);
  const hasRegistration = !!userInfo && userInfo.userAddress && userInfo.userAddress !== "0x0000000000000000000000000000000000000000";
  const isPending = status === 0;
  const isApproved = status === 1;
  const isRejected = status === 2;
  const isCanceled = status === 3;

  const canRequest = !hasRegistration || isRejected || isCanceled;

  return (
    <main className="page-shell space-y-12">
      <section className="surface p-8 md:p-12">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Plataforma web3
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Supply Chain Tracker
              </h1>
              <p className="text-base leading-relaxed text-slate-600 md:text-lg">
                Gestiona roles, tokens y transferencias con una experiencia moderna y consistente para todo tu equipo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isConnected ? (
                <>
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
                    {account}
                  </span>
                  <Button onClick={disconnect} className="bg-slate-900 text-white hover:bg-slate-800">
                    Desconectar
                  </Button>
                </>
              ) : (
                <Button
                  onClick={async () => {
                    try {
                      await connect();
                      show("Wallet connected", "success");
                    } catch (e) {
                      show(extractErrorMessage(e), "error");
                    }
                  }}
                  className="inline-flex items-center gap-2"
                >
                  <Spinner className="text-indigo-500" /> Conectar con MetaMask
                </Button>
              )}
            </div>
          </div>
          {!isAdmin && (
          <div className="surface-muted space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Estado de registro</p>
              <p className="muted">Consulta tu rol y estado actual en el contrato.</p>
            </div>
            {!isConnected ? (
              <p className="text-sm text-slate-500">Conecta tu wallet para solicitar un rol.</p>
            ) : CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000" ? (
              <p className="text-xs text-amber-600">Configura la dirección del contrato en src/contracts/config.ts.</p>
            ) : loadingInfo ? (
              <p className="text-sm text-slate-500">Cargando...</p>
            ) : isPending || requestedRole ? (
              <div className="flex items-center gap-2 text-sm">
                <span>Estado:</span>
                <Badge variant={userStatusVariant(0)}>Pending</Badge>
                {(userInfo?.role || requestedRole) && (
                  <span className="text-xs text-slate-500">Solicitud: {userInfo?.role || requestedRole}</span>
                )}
              </div>
            ) : !hasRegistration ? (
              <div className="flex items-center gap-2 text-sm">
                <span>No tienes un rol asignado aún.</span>
                <Badge variant="gray">Sin registro</Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span>Estado:</span>
                <Badge variant={userStatusVariant(status ?? 0)}>{userStatusLabel(status ?? 0)}</Badge>
                {isApproved && userInfo?.role && (
                  <span className="text-xs text-slate-500">({userInfo.role})</span>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </section>
      {!isAdmin && (
      <section className="surface space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Solicita tu rol</h2>
          <p className="text-sm text-slate-600">Selecciona el rol deseado y envía la solicitud para su aprobación.</p>
        </div>
        {!isConnected ? (
          <p className="text-sm text-slate-500">Conecta tu wallet para realizar solicitudes.</p>
        ) : CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000" ? (
          <p className="text-xs text-amber-600">
            Configura la dirección del contrato en src/contracts/config.ts para habilitar las solicitudes de rol.
          </p>
        ) : isPending || requestedRole ? (
          <div className="text-sm text-slate-600">Ya has enviado una solicitud para el rol <span className="font-medium">{userInfo?.role || requestedRole}</span>. Espera la aprobación del administrador.</div>
        ) : isApproved ? (
          isAdmin ? (
            <div className="text-sm text-slate-600">Eres el administrador. Gestiona usuarios desde Admin.</div>
          ) : (
            <div className="text-sm text-slate-600">Tu rol actual es <span className="font-medium">{userInfo?.role}</span>.</div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="role" className="text-sm text-slate-600">
                Rol
              </label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-48">
                <option>Producer</option>
                <option>Factory</option>
                <option>Retailer</option>
                <option>Consumer</option>
              </Select>
              <Button
                onClick={async () => {
                  try {
                    setMessage("Enviando solicitud...");
                    const svc = new Web3Service(provider);
                    await svc.requestUserRole(role);
                    setRequestedRole(role);
                    setMessage("Solicitud enviada. Espera la aprobación del administrador.");
                    // Poll user info after sending to reflect Pending
                    let info: UserInfo | null = null;
                    for (let i = 0; i < 5; i++) {
                      try {
                        info = await new Web3Service(provider).getUserInfo(account!);
                        if (info && Number(info.status) === 0) break;
                      } catch {}
                      await new Promise((res) => setTimeout(res, 400));
                    }
                    if (info) setUserInfo(info);
                    show("Role request sent", "success");
                  } catch (err) {
                    const msg = extractErrorMessage(err);
                    setMessage(msg);
                    show(msg, "error");
                  }
                }}
                disabled={isAdmin}
              >
                Solicitar rol
              </Button>
            </div>
            {message && <p className="text-xs text-slate-500">{message}</p>}
          </div>
        )}
      </section>
      )}
      {(isConnected && isApproved && !isAdmin) && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/tokens"
            className="surface flex flex-col gap-2 transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            <h3 className="text-base font-semibold text-slate-900">Tokens</h3>
            <p className="text-sm text-slate-600">Crea y gestiona los activos que representan tu inventario.</p>
          </Link>
          <Link
            href="/transfers"
            className="surface flex flex-col gap-2 transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            <h3 className="text-base font-semibold text-slate-900">Transferencias</h3>
            <p className="text-sm text-slate-600">Acepta, rechaza y sigue el estado de tus transferencias.</p>
          </Link>
        </section>
      )}
      {(isConnected && isAdmin) && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/admin/users"
            className="surface flex flex-col gap-2 transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            <h3 className="text-base font-semibold text-slate-900">Gestión de usuarios</h3>
            <p className="text-sm text-slate-600">Aprueba o rechaza solicitudes de rol de los usuarios.</p>
          </Link>
          <Link
            href="/admin"
            className="surface flex flex-col gap-2 transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            <h3 className="text-base font-semibold text-slate-900">Métricas</h3>
            <p className="text-sm text-slate-600">Proximamente</p>
          </Link>
        </section>
      )}
    </main>
  );
}
