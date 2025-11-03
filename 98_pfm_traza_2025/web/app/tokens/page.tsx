"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service } from "@/src/lib/web3";
import { CONTRACT_CONFIG } from "@/src/contracts/config";
import { EmptyState } from "@/src/components/ui/empty-state";
import { TokenCard } from "@/src/components/TokenCard";
import { Modal } from "@/src/components/ui/modal";
import { CreateTokenForm } from "@/src/components/CreateTokenForm";
import { TokenDetailModal } from "@/src/components/TokenDetailModal";
import { TransferTokenModal } from "@/src/components/TransferTokenModal";
import { Button } from "@/src/components/ui/button";

type TokenData = {
  id: bigint;
  name: string;
  balance: bigint;
  totalSupply: bigint;
  parentId: bigint;
  parentName?: string;
  creator: string;
};

export default function Page() {
  const { isConnected, account, provider } = useWallet();
  const svc = useMemo(() => new Web3Service(provider), [provider]);
  const router = useRouter();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTokenId, setTransferTokenId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const loadTokens = useCallback(async () => {
    if (!isConnected || !account) return;
    if (!CONTRACT_CONFIG.address || CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000") return;
    setLoading(true);
    try {
      const tids = await svc.getUserTokens(account);
      const tokenData: TokenData[] = [];
      for (const tid of tids) {
        try {
          const tokenInfo = await svc.getToken(Number(tid));
          const balance = await svc.getTokenBalance(Number(tid), account);
          let parentName: string | undefined = undefined;
          const pId = tokenInfo.parentId as bigint;
          if (pId && pId !== BigInt(0)) {
            try {
              const parentInfo = await svc.getToken(Number(pId));
              parentName = (parentInfo as any).name as string;
            } catch {
              parentName = undefined;
            }
          }
          tokenData.push({
            id: tid,
            name: tokenInfo.name || `Token #${tid.toString()}`,
            balance,
            totalSupply: tokenInfo.totalSupply,
            parentId: tokenInfo.parentId,
            parentName,
            creator: tokenInfo.creator as string,
          });
        } catch {
          // If token fetch fails, add with minimal data
          tokenData.push({
            id: tid,
            name: `Token #${tid.toString()}`,
            balance: BigInt(0),
            totalSupply: BigInt(0),
            parentId: BigInt(0),
            parentName: undefined,
            creator: "0x0000000000000000000000000000000000000000",
          });
        }
      }
      setTokens(tokenData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isConnected, account, svc]);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  // Load user role
  useEffect(() => {
    const run = async () => {
      if (!isConnected || !account) {
        setUserRole("");
        return;
      }
      try {
        const info = await svc.getUserInfo(account);
        setUserRole(info.role || "");
      } catch {
        setUserRole("");
      }
    };
    void run();
  }, [isConnected, account, svc]);

  // Redirect to home if current account is not registered in the contract
  useEffect(() => {
    const checkRegistration = async () => {
      if (!isConnected || !account) return;
      if (!CONTRACT_CONFIG.address || CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000") return;
      try {
        const info = await svc.getUserInfo(account);
        if (!info || info.id === BigInt(0)) {
          router.push("/");
        }
      } catch {
        // On error assume not registered to be safe
        router.push("/");
      }
    };
    void checkRegistration();
  }, [isConnected, account, svc, router]);

  const handleTokenCreated = () => {
    setIsModalOpen(false);
    void loadTokens();
  };

  const handleTransferSuccess = () => {
    setIsTransferModalOpen(false);
    setTransferTokenId(null);
    void loadTokens();
  };

  const openTransferModal = (tokenId: number) => {
    setTransferTokenId(tokenId);
    setIsTransferModalOpen(true);
  };

  const isConsumer = userRole.toLowerCase() === "consumer";

  return (
    <main className="page-shell space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tokens</h1>
          <p className="text-sm text-slate-600">Gestiona los tokens asociados a tu organización.</p>
        </div>
        {!isConsumer && (
          <Button onClick={() => setIsModalOpen(true)}>
            Crear token
          </Button>
        )}
      </div>
      {!isConnected ? (
        <div className="surface text-center text-sm text-slate-500">Conecta tu wallet.</div>
      ) : loading ? (
        <div className="surface text-center text-sm text-slate-500">Cargando...</div>
      ) : tokens.length === 0 ? (
        <EmptyState
          icon={(props) => (
            <svg {...props} viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
            </svg>
          )}
          title="Sin tokens"
          subtitle="Crea tu primer token para empezar"
          action={!isConsumer ? (
            <Button onClick={() => setIsModalOpen(true)}>
              Crear token
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => {
            const canTransfer = !isConsumer && (token.creator && account ? token.creator.toLowerCase() === account.toLowerCase() : false);
            return (
              <TokenCard 
                key={token.id.toString()} 
                token={token}
                canTransfer={canTransfer}
                showTransfer={!isConsumer}
                onViewDetails={() => setSelectedTokenId(Number(token.id))}
                onTransfer={() => openTransferModal(Number(token.id))}
              />
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Token">
        <CreateTokenForm onSuccess={handleTokenCreated} />
      </Modal>

      {selectedTokenId !== null && (
        <TokenDetailModal
          isOpen={selectedTokenId !== null}
          onClose={() => setSelectedTokenId(null)}
          tokenId={selectedTokenId}
        />
      )}

      <TransferTokenModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferTokenId(null);
        }}
        preSelectedTokenId={transferTokenId || undefined}
        onSuccess={handleTransferSuccess}
      />
    </main>
  );
}
