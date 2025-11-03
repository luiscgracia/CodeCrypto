import * as React from "react";

export function EmptyState({ icon: Icon, title, subtitle, action }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="surface flex flex-col items-center text-center">
      <div className="rounded-full bg-indigo-100 p-4 text-indigo-600">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
