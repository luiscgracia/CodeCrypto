import * as React from "react";

type Variant = "gray" | "green" | "red" | "yellow" | "blue" | "indigo";

export function Badge({
  children,
  variant = "gray",
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const color = {
    gray: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    red: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100",
    yellow: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
    blue: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100",
    indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100",
  }[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${color} ${className}`}
    >
      {children}
    </span>
  );
}
