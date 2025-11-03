"use client";

import { use } from "react";
import { useState } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service } from "@/src/lib/web3";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/toast";
import { Spinner } from "@/src/components/ui/spinner";
import { extractErrorMessage } from "@/src/lib/errors";

export default function TransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tokenId = Number(id);
  const { isConnected, provider } = useWallet();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const submit = async () => {
    try {
      setLoading(true);
      setMsg("Submitting...");
      const svc = new Web3Service(provider);
      await svc.transfer(to, tokenId, amount);
      setMsg("Transfer requested.");
      show("Transfer requested", "success");
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
      <h1 className="text-2xl font-semibold text-zinc-100">Transfer Token #{tokenId}</h1>
      {!isConnected ? (
        <p className="text-sm">Connect your wallet to transfer.</p>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <label className="w-32 text-sm text-zinc-300">To</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100" placeholder="0x..." />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-32 text-sm text-zinc-300">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100" />
          </div>
          <Button onClick={submit}>{loading ? <span className="inline-flex items-center gap-2"><Spinner /> Send</span> : "Send"}</Button>
          {msg && <p className="text-xs text-zinc-400">{msg}</p>}
        </div>
      )}
    </main>
  );
}
