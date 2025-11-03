# Fundamentos de UI (global)

* **Layout**: `Container` centrado a 1200px máx., `px-4 md:px-6`, `py-6`.
* **Header** (sticky): logo + breadcrumb + `ConnectWalletButton`. Fondo semitransparente con blur.
* **Tipografía**: `text-zinc-100` sobre **bg** oscuro `#0B0D12`, secundarios `text-zinc-400`.
* **Tarjetas**: `rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-lg backdrop-blur`.
* **Controles**: shadcn `Button`, `Input`, `Select`, `Badge`, `Alert`, `Dialog`, `Toast`.
* **Estados**: `EmptyState` (icono + texto + CTA), `PageSkeleton` (skeleton), `ErrorState` (alert).
* **Badges de estado**:

  * pending → `bg-amber-500/15 text-amber-300`
  * approved → `bg-emerald-500/15 text-emerald-300`
  * rejected/canceled → `bg-rose-500/15 text-rose-300`
* **Accesibilidad**: roles/aria, `focus-visible:outline`, tamaños táctiles ≥ 44px.

Componentes base recomendados:

* `StatusBadge({status})`, `RolePill({role})`, `TokenCard`, `TransferRow`, `KeyValue({label,value})`.

---

# Páginas

## `/` — Landing + Estado de usuario

**Objetivo**: orientar y llevar al “siguiente paso” según estado (no conectado / pendiente / aprobado).
**Estructura**:

* Hero compacto (título, frase, CTA principal).
* Panel “Tu estado” (wallet, rol, estado con `StatusBadge`).
* Grid 2×2 con accesos rápidos (Tokens, Transferencias, Panel Admin si admin).

**Acciones**:

* Si no conectado: botón **Conectar Wallet** grande.
* Si conectado y sin rol: botón **Solicitar rol** (abre `Dialog`).
* Si pendiente: aviso `Alert` + tips.
* Si aprobado: CTA a **Dashboard**.

---

## `/dashboard`

**Objetivo**: vista general.
**Estructura**:

* KPIs en 4 `Card`: tokens, transferencias pendientes, últimas operaciones, rol/estado.
* “Actividad reciente” (tabla simple o lista).
* “Siguientes pasos” (según rol).

**Acciones**:

* Botón “Crear token” si rol lo permite.
* Botón “Ir a transferencias”.

---

## `/tokens`

**Objetivo**: listar tokens del usuario.
**Estructura**:

* Toolbar: `Search`, filtros (materia prima/derivado), botón **Crear token**.
* Grid de `TokenCard` (imagen opcional, nombre, id, balance, parentId badge).
* Empty state con CTA a **Crear token**.

**Acciones**:

* Click card → `/tokens/[id]`.
* Menu contextual en card: **Transferir**, **Ver detalle**.

---

## `/tokens/create`

**Objetivo**: formulario de creación.
**Estructura**:

* `Card` con formulario:

  * Nombre, descripción corta.
  * Metadatos JSON (`Textarea` con validador).
  * Toggle **Derivado** → `Select parentId`.
* `Alert` informativa (coste gas, irreversible).
* Botones: **Crear** (primary) y **Cancelar** (ghost).

**Estados**:

* Loading → `Button` con spinner.
* Error → `Toast`/`Alert`.
* Éxito → redirect a `/tokens/[id]`.

---

## `/tokens/[id]`

**Objetivo**: ficha del token + trazabilidad.
**Estructura**:

* Header compacto con nombre + `StatusBadge` (si aplica) + `RolePill` del owner.
* `Card` “Detalles”: `KeyValue` (id, owner, balance, createdAt, parentId).
* `Card` “Metadatos” (viewer JSON).
* `Card` “Árbol de parentesco” (lista/hierarchical chips).
* `Card` “Historial” (timeline simple con eventos).

**Acciones**:

* Botón **Transferir** → `/tokens/[id]/transfer`.

---

## `/tokens/[id]/transfer`

**Objetivo**: iniciar transferencia.
**Estructura**:

* `Card` con resumen (token, balance disponible).
* Form: `To (address o pick siguiente rol)`, `Cantidad`.
* Avisos de flujo permitido (Producer→Factory→Retailer→Consumer).
* Confirm modal antes de enviar.

**Estados**:

* Prevalidación (balance, destino correcto).
* Tras enviar: loader + hash tx, `Toast`.

---

## `/transfers`

**Objetivo**: gestionar pendientes y ver historial.
**Estructura**:

* Tabs: **Pendientes** | **Historial**.
* **Pendientes**: tabla `TransferRow` (id, token, qty, from→to, fecha, acciones Aceptar/Rechazar).
* **Historial**: tabla simple con estado final y enlaces a token.

**Acciones**:

* Aceptar/Rechazar con confirm `Dialog`.
* Filtros: por token, por estado, por fecha.

---

## `/admin`

**Objetivo**: aprobar/rechazar usuarios (solo admin).
**Estructura**:

* Guardia de ruta (`Alert` si no admin).
* Tabla de solicitudes: address, rol solicitado, fecha, estado (pending).
* Acciones masivas (aprobar/rechazar selección).
* Detalle de usuario (side panel) opcional.

**Acciones**:

* `Button` **Aprobar** / **Rechazar** por fila.
* `Toast` con resultado.

---

## `/profile`

**Objetivo**: datos de la cuenta y preferencias.
**Estructura**:

* `Card` datos de wallet: address, ens, red actual.
* `Card` rol y estado con `StatusBadge`.
* `Card` preferencias UI (tema oscuro/claridad del JSON viewer).
* Botón **Desconectar wallet**.

---

# Snippets útiles (breves)

### `StatusBadge`

```tsx
export function StatusBadge({ status }: { status: "pending"|"approved"|"rejected"|"canceled" }) {
  const map = {
    pending: "bg-amber-500/15 text-amber-300",
    approved: "bg-emerald-500/15 text-emerald-300",
    rejected: "bg-rose-500/15 text-rose-300",
    canceled: "bg-rose-500/15 text-rose-300",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${map[status]}`}>{status}</span>;
}
```

### `TokenCard` (resumen)

```tsx
function TokenCard({ token }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{token.name ?? `Token #${token.id}`}</h3>
        <span className="text-xs text-zinc-400">#{token.id}</span>
      </div>
      <div className="text-sm text-zinc-400">Balance: {token.balance}</div>
      {token.parentId && <div className="mt-1 text-xs text-zinc-500">Parent: {token.parentId}</div>}
      <div className="mt-4 flex gap-2">
        <a href={`/tokens/${token.id}`} className="text-sm underline">Ver</a>
        <a href={`/tokens/${token.id}/transfer`} className="text-sm underline">Transferir</a>
      </div>
    </div>
  );
}
```

### `EmptyState`

```tsx
function EmptyState({ icon, title, subtitle, action }) {
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-zinc-600" />
      <h3 className="mt-4 text-zinc-100 font-medium">{title}</h3>
      <p className="mt-1 text-zinc-400 text-sm">{subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

---

# Criterios generales por página

* **Loading**: skeletons (`animate-pulse`) en tarjetas/tablas.
* **Errores**: `Alert` con retry.
* **Responsive**: grid 1col → 2col (md) → 3col (xl) donde aplique.
* **Confirmaciones críticas**: `Dialog` antes de on-chain actions.
* **Toasts**: en todas las operaciones Web3 (éxito/error).
