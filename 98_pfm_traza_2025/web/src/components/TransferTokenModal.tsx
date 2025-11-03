"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service } from "@/src/lib/web3";
import { Modal } from "@/src/components/ui/modal";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { useToast } from "@/src/components/ui/toast";
import { Spinner } from "@/src/components/ui/spinner";
import { extractErrorMessage } from "@/src/lib/errors";
import { CONTRACT_CONFIG } from "@/src/contracts/config";

type TokenOption = {
  id: bigint;
  name: string;
  balance: bigint;
};

type TransferTokenModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preSelectedTokenId?: number;
  onSuccess?: () => void;
};

export function TransferTokenModal({ 
  isOpen, 
  onClose, 
  preSelectedTokenId,
  onSuccess 
}: TransferTokenModalProps) {
  const { isConnected, account, provider } = useWallet();
  const svc = useMemo(() => new Web3Service(provider), [provider]);
  const { show } = useToast();

  const [tokens, setTokens] = useState<TokenOption[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string>(preSelectedTokenId?.toString() || "");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const loadTokens = useCallback(async () => {
    if (!isConnected || !account) return;
    if (!CONTRACT_CONFIG.address || CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000") return;
    
    setLoadingTokens(true);
    try {
      const tids = await svc.getUserTokens(account);
      const tokenData: TokenOption[] = [];
      
      for (const tid of tids) {
        try {
          const tokenInfo = await svc.getToken(Number(tid));
          const balance = await svc.getTokenBalance(Number(tid), account);
          
          // Only allow transfers of tokens with positive balance that were created by the user
          if (balance > BigInt(0) && (tokenInfo.creator as string)?.toLowerCase() === account.toLowerCase()) {
            tokenData.push({
              id: tid,
              name: tokenInfo.name || `Token #${tid.toString()}`,
              balance,
            });
          }
        } catch {
          // Ignorar errores individuales
        }
      }
      
      setTokens(tokenData);
    } catch {
      // ignore
    } finally {
      setLoadingTokens(false);
    }
  }, [isConnected, account, svc]);

  useEffect(() => {
    if (isOpen) {
      void loadTokens();
      if (preSelectedTokenId) {
        setSelectedTokenId(preSelectedTokenId.toString());
      }
    }
  }, [isOpen, preSelectedTokenId, loadTokens]);

  const handleClose = () => {
    setSelectedTokenId(preSelectedTokenId?.toString() || "");
    setTo("");
    setAmount("");
    onClose();
  };

  const handleSubmit = async () => {
    // Client-side validations to avoid obvious reverts
    if (!selectedTokenId) {
      show("Selecciona un token", "error");
      return;
    }

    if (!to.trim() || !to.startsWith("0x")) {
      show("Dirección de destino inválida", "error");
      return;
    }

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      show("La cantidad debe ser un número entero positivo", "error");
      return;
    }

    // Check local balance before sending transaction
    const selectedToken = tokens.find(t => t.id.toString() === selectedTokenId);
    if (selectedToken && BigInt(amountNum) > selectedToken.balance) {
      show("Balance insuficiente", "error");
      return;
    }

    try {
      setLoading(true);
      await svc.transfer(to, Number(selectedTokenId), amountNum);
      show("Transferencia solicitada correctamente", "success");
      onSuccess?.();
      handleClose();
    } catch (e) {
      const m = extractErrorMessage(e);
      show(m, "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedToken = tokens.find(t => t.id.toString() === selectedTokenId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Transferir Token">
      {!isConnected ? (
        <p className="text-sm text-slate-600">Conecta tu wallet para realizar transferencias.</p>
      ) : CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000" ? (
        <p className="text-sm text-amber-600">
          Dirección del contrato no configurada. Establécela en src/contracts/config.ts.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Selector de Token */}
          <div className="space-y-2">
            <Label htmlFor="transfer-token">Token</Label>
            {loadingTokens ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner className="h-4 w-4" />
                Cargando tokens...
              </div>
            ) : (
              <>
                <Select
                  id="transfer-token"
                  value={selectedTokenId}
                  onChange={(e) => setSelectedTokenId(e.target.value)}
                  disabled={!!preSelectedTokenId}
                  className="w-full"
                >
                  <option value="">Selecciona el token a transferir</option>
                  {tokens.map((token) => (
                    <option key={token.id.toString()} value={token.id.toString()}>
                      {token.name} (Balance: {token.balance.toString()})
                    </option>
                  ))}
                </Select>
                {tokens.length === 0 && !loadingTokens && (
                  <p className="text-xs text-slate-500">No tienes tokens con balance disponible</p>
                )}
              </>
            )}
          </div>

          {/* Balance disponible */}
          {selectedToken && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-600">Balance disponible</div>
              <div className="text-lg font-semibold text-slate-900">
                {selectedToken.balance.toString()}
              </div>
            </div>
          )}

          {/* Dirección de destino */}
          <div className="space-y-2">
            <Label htmlFor="transfer-to">Dirección de destino</Label>
            <input
              id="transfer-to"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Cantidad</Label>
            <input
              id="transfer-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500">Debe ser un número entero positivo</p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={handleClose}
              disabled={loading}
              className="bg-slate-600 hover:bg-slate-500"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || tokens.length === 0}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Enviando...
                </span>
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

