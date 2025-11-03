export function RolePill({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-100">
      {role}
    </span>
  );
}
