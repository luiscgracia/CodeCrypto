# 1) Cadena local determinista (Anvil)

* Usa **Anvil** para todo e2e local: bloques rápidos, snapshots, RPC extendido y cuentas prefundidas.
* Recomendado:

  ```bash
  anvil \
    --chain-id 31337 \
    --block-time 0 \
    --steps-tracing \
    --silent
  ```
* Si necesitas datos reales: tests separados con **fork** (`anvil --fork-url <RPC>`), pero mantenlos fuera del “happy path” e2e básico por rendimiento.

# 2) Despliegue y “seeding” repetibles

* **Un único script de Foundry** (tu `script/Deploy.s.sol`) que:

  1. Despliegue el contrato.
  2. Inicialice **roles/estados** mínimos para el flujo Producer→Factory→Retailer→Consumer.
  3. Imprima/guarde un **artifact JSON** con direcciones para el frontend de test.
* Ejemplo de job de seeding:

  ```bash
  forge script script/Deploy.s.sol \
    --rpc-url http://localhost:8545 \
    --private-key $E2E_DEPLOYER_PK \
    --broadcast \
    --json | tee .e2e/deploy.json
  ```
* Tras desplegar, genera un **`web/src/contracts/config.e2e.ts`** (o `.env.test`) con `address` y `adminAddress`. Un pequeño script Node puede leer `.e2e/deploy.json` y escribir la config consumida por el frontend de pruebas.

# 3) Ciclo de vida de tests: snapshot/restore

* Antes del primer test e2e: **seed** (deploy + datos base).
* Entre tests: **snapshot + revert** para evitar redeploys costosos:

  * Guarda `snapshotId = anvil_snapshot`.
  * En `beforeEach`/`afterEach`: `anvil_revert(snapshotId)` → `anvil_snapshot` de nuevo.
* También puedes simular tiempo/blocks:

  * `evm_increaseTime`, `evm_mine`, etc., si tu DApp depende de expiraciones/fecha.

# 4) Wallet automatizada para el navegador

Tienes dos caminos (elige uno y sé consistente):

**Opción A — Cypress + Synpress (MetaMask real en pruebas)**

* Ventaja: reproduce el flujo real de usuario con MetaMask (aprobaciones, switches de red, firmas).
* Setup:

  * Paquete: **@synthetixio/synpress** (Cypress + MetaMask preconfigurado).
  * Configura red `Anvil Local (31337)`.
  * Preimporta una de las **private keys de Anvil** en MetaMask (la del “user” de cada rol).
* Flujo típico en test:

  1. Abres la app.
  2. “Connect Wallet” → Synpress maneja el popup de MetaMask.
  3. Interactúas con UI (crear token, transferir, aceptar).
* Úsalo cuando quieras **validar de verdad** las confirmaciones de firma/tx.

**Opción B — Playwright/Cypress + “mock connector” (sin extensión)**

* Para smoke e2e rápidos puedes usar **wagmi + MockConnector** o una **cartera in-memory** (viem/ethers) en modo test.
* Ventaja: mucho más estable en CI y veloz; no dependes de extensiones.
* Inconveniente: no valida los popups reales de la wallet; es más “integration” que full e2e.

> Recomendación práctica:
> **Pirámide de e2e**
>
> * 80% de los e2e con **MockConnector** (rapidísimos).
> * 20% “golden paths” con **Synpress** para cubrir conexión, firma y confirmaciones reales.

# 5) Runner de UI y orquestación

* **Cypress** (ya lo usas): sencillo de paralelizar y con buen DX.
* Si prefieres **Playwright**, también funciona bien (especialmente con wallet mock).
* Orquesta todo con **npm scripts** o **Makefile**:

  ```json
  {
    "scripts": {
      "anvil": "anvil --chain-id 31337 --silent",
      "sc:seed": "forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key $E2E_DEPLOYER_PK --broadcast --json > .e2e/deploy.json && node scripts/gen-e2e-config.cjs",
      "web:dev": "cross-env NEXT_PUBLIC_E2E=1 next dev -p 3000",
      "e2e": "start-server-and-test anvil http://localhost:8545 'npm:sc:seed' 'npm:web:dev' http://localhost:3000 'cypress run --browser chrome'"
    }
  }
  ```
* En CI, usa **Docker Compose** con tres servicios: `anvil`, `web`, `e2e`. Así eliminas dependencias del host.

# 6) Fixtures por rol y estados

* Predefine **cuentas** por rol con PKs de Anvil: `admin`, `producer`, `factory`, `retailer`, `consumer`.
* En el seeding, llama a `requestUserRole`/`changeStatusUser` para dejar **Approved** lo necesario.
* Mantén **fixtures** en JSON para reusar en tests (p.ej., tokens base, metadatos).

# 7) Contratos: Unit vs e2e

* **Unit/Integration de contrato**: en **Foundry** (rápidos, cobertura alta).
* **E2E UI+Chain**: en Cypress/Playwright sobre Anvil.
  Esto te da una pirámide sana: lógica de dominio verificada en Foundry, y flujos completos validados con pocas pruebas de extremo a extremo.

# 8) Casos E2E mínimos (golden path)

1. **Onboarding**: conectar wallet, registrarse, admin aprueba.
2. **Creación de token** (Producer) con metadatos.
3. **Transferencias dirigidas**: Producer→Factory→Retailer→Consumer con aceptación del receptor.
4. **Trazabilidad**: comprobar historial en UI.
5. **Permisos**: intento de acción inválida (por rol) y mensaje de error visible.

# 9) Utilidades clave para estabilidad

* **Esperas por eventos on-chain**: la UI debe mostrar estado “pending/confirmed”. En tests, espera a que aparezca la **tx hash** o la **confirmación** visible en la UI (no uses `sleep` ciegos).
* **Logs del contrato**: emite eventos y muéstralos en UI; los tests los usarán como aserciones de “éxito”.
* **Reset limpio**: si un test falla, asegúrate de **revert snapshot** antes del siguiente.
* **Control de gas/timeouts**: sube `defaultCommandTimeout`/`pageLoadTimeout` sólo si es necesario; mejorar estabilidad con esperas basadas en UI.

# 10) Ejemplo mini (Cypress + Synpress)

```ts
// cypress/e2e/happy-path.cy.ts
describe('SupplyChain E2E', () => {
  before(() => {
    cy.task('anvil:revertToFreshSnapshot'); // tu task que hace RPC revert
  });

  it('Producer crea token y transfiere a Factory', () => {
    cy.visit('/');
    cy.acceptMetamaskAccess();     // Synpress
    cy.switchToAnvilNetwork();     // Synpress helper
    cy.get('[data-e2e="register-role"]').select('Producer');
    cy.get('[data-e2e="request-role"]').click();
    // (Admin ya aprobado en seeding)
    cy.get('[data-e2e="create-token"]').click();
    cy.get('[data-e2e="token-name"]').type('Cacao');
    cy.get('[data-e2e="token-supply"]').type('1000');
    cy.get('[data-e2e="submit"]').click();
    cy.confirmMetamaskTransaction(); // Synpress
    cy.contains('Token creado').should('be.visible');

    cy.get('[data-e2e="transfer"]').click();
    cy.get('[data-e2e="to"]').type('0xFactoryAddress...');
    cy.get('[data-e2e="amount"]').type('100');
    cy.get('[data-e2e="submit"]').click();
    cy.confirmMetamaskTransaction();
    cy.contains('Transferencia pendiente').should('be.visible');
  });
});
```

# 11) Qué NO hacer

* Mezclar en el mismo suite e2e **fork mainnet** con **local seeding** (tiempos y flakiness).
* Depender de waits fijos (`cy.wait(3000)`) en lugar de **esperas por señales de UI**.
* Re-desplegar contratos por cada test: usa snapshots.

---

## Resumen ejecutable

1. **Anvil** siempre, chain 31337.
2. **Script de deploy + seeding** que produce `deploy.json` y configura el frontend de test.
3. **Snapshots** para resetear estado entre tests.
4. **Cypress + Synpress** para cubrir conexión/firmas; **MockConnector** para la mayoría de flujos rápidos.
5. **Pocos e2e críticos**, muchos unit/integration en Foundry.
