"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastType = "success" | "error" | "info";
export type ToastItem = { id: number; type: ToastType; message: string };

type ToastContextValue = {
  show: (message: string, type?: ToastType, durationMs?: number) => void;
};

const ToastCtx = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, type: ToastType = "info", durationMs = 7000) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-md border px-3 py-2 text-sm shadow-md ${
              t.type === "success"
                ? "border-green-300 bg-green-50 text-green-900"
                : t.type === "error"
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-blue-300 bg-blue-50 text-blue-900"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
