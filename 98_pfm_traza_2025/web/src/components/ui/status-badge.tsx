import * as React from "react";

export function StatusBadge({ status }: { status: "pending"|"approved"|"rejected"|"canceled" }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
    approved: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    rejected: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
    canceled: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
