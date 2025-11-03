"use client";

import * as React from "react";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
