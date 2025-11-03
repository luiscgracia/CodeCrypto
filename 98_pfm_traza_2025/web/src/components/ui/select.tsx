import * as React from "react";

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  const { className = "", ...rest } = props;
  return (
    <select
      className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white ${className}`}
      {...rest}
    />
  );
}
