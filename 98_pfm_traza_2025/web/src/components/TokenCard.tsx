import { Button } from "@/src/components/ui/button";

export function TokenCard({ 
  token,
  canTransfer = true,
  showTransfer = true,
  onViewDetails,
  onTransfer
}: { 
  token: { 
    id: bigint; 
    name: string; 
    balance?: bigint; 
    totalSupply?: bigint;
    parentId?: bigint;
    parentName?: string;
  };
  canTransfer?: boolean;
  showTransfer?: boolean;
  onViewDetails?: () => void;
  onTransfer?: () => void;
}) {
  const displayName = token.name && token.name.trim().length > 0 
    ? token.name 
    : `Token #${token.id.toString()}`;
  return (
    <div className="surface flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {displayName} ({token.id.toString()})
        </h3>
      </div>
      {token.balance !== undefined && token.totalSupply !== undefined && (
        <div className="mb-4 text-sm text-slate-700">
          <span className="text-slate-500">Balance:</span> 
          <span className="ml-2 font-medium">{token.balance.toString()}/{token.totalSupply.toString()}</span>
        </div>
      )}
      {token.parentId !== undefined && token.parentId !== BigInt(0) && (
        <div className="mb-4 text-sm text-slate-700">
          <span className="text-slate-500">Parent:</span>
          <span className="ml-2 font-medium">{token.parentName && token.parentName.trim().length > 0 ? token.parentName : `Token #${token.parentId.toString()}`} ({token.parentId.toString()})</span>
        </div>
      )}
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={onViewDetails} className="w-full">Ver detalles</Button>
        {showTransfer && (
          <div className="relative">
            <Button 
              onClick={onTransfer} 
              className={`w-full bg-slate-600 hover:bg-slate-500 ${!canTransfer ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!canTransfer}
              title={!canTransfer ? "Solo puedes transferir tokens creados por ti" : undefined}
            >
              Transferir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
