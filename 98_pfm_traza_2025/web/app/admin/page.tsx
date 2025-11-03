import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Panel de administración</h1>
        <p className="text-sm text-slate-600">
          Herramientas para gestionar usuarios, roles y configuraciones del sistema.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users" className="rounded-lg border bg-white p-4 shadow-sm transition hover:shadow">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Usuarios y Roles</h2>
            <p className="text-sm text-slate-600">Aprobar, rechazar o cancelar solicitudes de usuarios.</p>
          </div>
        </Link>

        <div className="rounded-lg border bg-white p-4 opacity-70">
          <h2 className="text-lg font-semibold text-slate-900">Configuraciones</h2>
          <p className="text-sm text-slate-600">Próximamente</p>
        </div>

        <div className="rounded-lg border bg-white p-4 opacity-70">
          <h2 className="text-lg font-semibold text-slate-900">Métricas</h2>
          <p className="text-sm text-slate-600">Próximamente</p>
        </div>
      </section>
    </main>
  );
}
