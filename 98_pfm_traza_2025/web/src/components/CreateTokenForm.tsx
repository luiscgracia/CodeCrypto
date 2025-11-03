"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service, type UserInfo } from "@/src/lib/web3";
import { CONTRACT_CONFIG } from "@/src/contracts/config";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { useToast } from "@/src/components/ui/toast";
import { Spinner } from "@/src/components/ui/spinner";
import { extractErrorMessage } from "@/src/lib/errors";
import { Label } from "@/src/components/ui/label";

type CreateTokenFormProps = {
  onSuccess?: () => void;
};

export function CreateTokenForm({ onSuccess }: CreateTokenFormProps) {
  const { isConnected, provider, account } = useWallet();
  const [name, setName] = useState("");
  const [supply, setSupply] = useState<string>("");
  const [features, setFeatures] = useState("");
  const [parentId, setParentId] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [parentTokens, setParentTokens] = useState<Array<{ id: string; name: string }>>([]);
  const { show } = useToast();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!provider || !account) return;
      try {
        const svc = new Web3Service(provider);
        const info: UserInfo = await svc.getUserInfo(account);
        setUserRole(info.role || "");
      } catch {
        setUserRole("");
      }
    };
    void fetchUserRole();
  }, [provider, account]);

  const isProducer = userRole.toLowerCase() === "producer";

  useEffect(() => {
    const loadParentTokens = async () => {
      if (!provider || !account) return;
      if (isProducer) return; // Producers create roots; no parent selection needed
      try {
        const svc = new Web3Service(provider);
        const ids = await svc.getUserTokens(account);
        const options: Array<{ id: string; name: string }> = [];
        for (const tid of ids) {
          try {
            const tokenInfo = await svc.getToken(Number(tid));
            const creator = (tokenInfo as any).creator as string;
            if (creator && creator.toLowerCase() === account.toLowerCase()) continue; // Exclude own-created tokens as parents
            const name = (tokenInfo as any).name || `Token #${tid.toString()}`;
            options.push({ id: tid.toString(), name: `${name} (#${tid.toString()})` });
          } catch {
            // ignore token fetch errors
          }
        }
        setParentTokens(options);
      } catch {
        setParentTokens([]);
      }
    };
    void loadParentTokens();
  }, [provider, account, isProducer]);

  const create = async () => {
    // Client-side validations before sending the transaction
    if (!name.trim()) {
      show("El nombre es obligatorio", "error");
      return;
    }

    const supplyNum = parseInt(supply, 10);
    if (isNaN(supplyNum) || supplyNum <= 0) {
      show("Total Supply debe ser un número entero positivo", "error");
      return;
    }

    const parentIdNum = parseInt(parentId, 10);
    if (isNaN(parentIdNum) || parentIdNum < 0) {
      show("Parent ID debe ser un número entero no negativo", "error");
      return;
    }

    // Validate that features is valid JSON; default to empty object
    let featuresJson = features.trim();
    if (!featuresJson) {
      featuresJson = "{}";
    } else {
      try {
        JSON.parse(featuresJson);
      } catch {
        show("Features debe ser un JSON válido", "error");
        return;
      }
    }

    try {
      setLoading(true);
      const svc = new Web3Service(provider);
      await svc.createToken(name, supplyNum, featuresJson, isProducer ? 0 : parentIdNum);
      show("Token creado correctamente", "success");
      // Resetear formulario
      setName("");
      setSupply("");
      setFeatures("");
      setParentId("0");
      onSuccess?.();
    } catch (e) {
      const m = extractErrorMessage(e);
      show(m, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return <p className="text-sm text-slate-600">Conecta tu wallet para crear un token.</p>;
  }

  if (CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000") {
    return (
      <p className="text-sm text-amber-600">
        Dirección del contrato no configurada. Establécela en src/contracts/config.ts.
      </p>
    );
  }

  const exampleJson = `{
  "description": "Descripción del producto",
  "category": "Categoría",
  "origin": "País de origen",
  "certifications": ["Cert1", "Cert2"]
}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="token-name">Nombre</Label>
        <input
          id="token-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Token de Café Premium"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="token-supply">Total Supply</Label>
        <input
          id="token-supply"
          type="number"
          min="1"
          step="1"
          value={supply}
          onChange={(e) => setSupply(e.target.value)}
          placeholder="1000"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-500">Debe ser un número entero positivo</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="token-features">Features (JSON)</Label>
        <textarea
          id="token-features"
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          placeholder={exampleJson}
          rows={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-500">Formato JSON para describir las características del token</p>
      </div>

      {!isProducer && (
        <div className="space-y-2">
          <Label htmlFor="token-parent">Parent Token</Label>
          <Select
            id="token-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full"
          >
            <option value="0">No tiene padre</option>
            {parentTokens.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <p className="text-xs text-slate-500">Selecciona el token padre (opcional)</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={create} disabled={loading} className="min-w-32">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Creando...
            </span>
          ) : (
            "Crear Token"
          )}
        </Button>
      </div>
    </div>
  );
}

