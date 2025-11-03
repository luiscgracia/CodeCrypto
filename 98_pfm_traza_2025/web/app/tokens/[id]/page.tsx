"use client";

import { use } from "react";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/src/hooks/useWallet";
import { Web3Service } from "@/src/lib/web3";

export default function TokenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tokenId = Number(id);
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
  const svc = useMemo(() => new Web3Service(provider), [provider]);

  useEffect(() => {
    const run = async () => {
      try {
        // Load token metadata and user balance for current account
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
        // Build parent tree by walking parentId until root
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
      }
    };
    if (isConnected) void run();
  }, [isConnected, account, svc, tokenId]);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-100">Token #{id}</h1>
      {!isConnected ? (
        <p className="text-sm">Connect your wallet to view details.</p>
      ) : !meta ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg backdrop-blur">
            <h2 className="text-lg font-medium text-zinc-100">Metadata</h2>
            <div className="mt-2 text-sm">
              <div><span className="text-zinc-400">Name:</span> <span className="text-zinc-200">{meta.name}</span></div>
              <div><span className="text-zinc-400">Creator:</span> <span className="text-zinc-200">{meta.creator}</span></div>
              <div><span className="text-zinc-400">Total Supply:</span> <span className="text-zinc-200">{String(meta.totalSupply)}</span></div>
              <div><span className="text-zinc-400">Features:</span> <code className="text-xs text-zinc-300">{meta.features}</code></div>
              <div><span className="text-zinc-400">Date:</span> <span className="text-zinc-200">{String(meta.dateCreated)}</span></div>
            </div>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg backdrop-blur">
            <h2 className="text-lg font-medium text-zinc-100">Your Balance</h2>
            <div className="mt-2 text-sm text-zinc-200">{balance !== null ? String(balance) : "-"}</div>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg backdrop-blur">
            <h2 className="text-lg font-medium text-zinc-100">Parent Tree</h2>
            {tree.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">No parent lineage.</p>
            ) : (
              <ul className="mt-2 list-disc pl-5 text-sm text-zinc-200">
                {tree.map((n) => (
                  <li key={n.id.toString()}>
                    <span className="font-medium">#{n.id.toString()}</span> {n.name}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
