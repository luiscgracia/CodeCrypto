"use client";

import { useState } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service } from "@/src/lib/web3";
import { CONTRACT_CONFIG } from "@/src/contracts/config";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/toast";
import { Spinner } from "@/src/components/ui/spinner";
import { extractErrorMessage } from "@/src/lib/errors";

export default function CreateTokenPage() {
  const { isConnected, provider } = useWallet();
  const [name, setName] = useState("");
  const [supply, setSupply] = useState<number>(0);
  const [features, setFeatures] = useState("{}");
  const [parentId, setParentId] = useState<number>(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const create = async () => {
    try {
      setLoading(true);
      setMsg("Submitting...");
      const svc = new Web3Service(provider);
      await svc.createToken(name, supply, features, parentId);
      setMsg("Token created.");
      show("Token created", "success");
    } catch (e) {
      const m = extractErrorMessage(e);
      setMsg(m);
      show(m, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Create Token</h1>
      {!isConnected ? (
        <p className="text-sm">Connect your wallet to create a token.</p>
      ) : CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000" ? (
        <p className="text-sm text-amber-600">Contract address not configured. Set it in src/contracts/config.ts to enable this form.</p>
      ) : (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="w-32 text-sm">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-md border px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-32 text-sm">Total Supply</label>
            <input type="number" value={supply} onChange={(e) => setSupply(Number(e.target.value))} className="flex-1 rounded-md border px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-32 text-sm">Features (JSON)</label>
            <input value={features} onChange={(e) => setFeatures(e.target.value)} className="flex-1 rounded-md border px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-32 text-sm">Parent ID</label>
            <input type="number" value={parentId} onChange={(e) => setParentId(Number(e.target.value))} className="flex-1 rounded-md border px-3 py-1.5 text-sm" />
          </div>
          <Button onClick={create}>{loading ? <span className="inline-flex items-center gap-2"><Spinner /> Create</span> : "Create"}</Button>
          {msg && <p className="text-xs text-gray-600">{msg}</p>}
        </div>
      )}
    </main>
  );
}
