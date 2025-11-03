export function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 text-sm">
      <span className="min-w-32 font-medium text-slate-600">{label}:</span>
      <span className="flex-1 text-slate-900">{value}</span>
    </div>
  );
}
