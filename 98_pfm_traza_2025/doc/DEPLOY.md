## Deploy local (Anvil) y prueba de la aplicación

Esta guía explica, paso a paso, cómo levantar una red local con Anvil, desplegar el contrato `SupplyChain.sol`, configurar el frontend y probar los flujos básicos en tu máquina.

### Prerrequisitos

- Windows 10/11 con WSL (Ubuntu recomendado) para Foundry, o Linux/macOS nativos
- Node.js 18+ y npm
- Git
- MetaMask instalado en tu navegador

Verifica versiones:

```bash
node --version
npm --version
git --version
```

### 1) Clonar y sincronizar el repositorio

```bash
git clone https://github.com/Sheuka/98_pfm_traza_2025.git
cd 98_pfm_traza_2025
git checkout master && git pull --rebase origin master
```

### 2) Instalar Foundry (en WSL o Linux/macOS)

En Windows, usa WSL para Foundry. Abre una terminal WSL (Ubuntu) y ejecuta:

```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc || true
foundryup
forge --version
anvil --version
```

### 3) Iniciar Anvil (red local)

En la terminal WSL:

```bash
anvil
```

Deja Anvil corriendo. Verás un listado de cuentas con sus claves privadas. La cuenta #0 suele ser el admin por defecto en local. Ejemplo:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Anota una private key para desplegar (usa una de las que muestra anvil, nunca claves reales).

### 4) Compilar contratos

En otra terminal WSL:

```bash
cd /mnt/<tu-disco>/.../98_pfm_traza_2025/sc
forge build
```

Si no está instalado `forge-std`, puedes ejecutar:

```bash
forge install foundry-rs/forge-std --no-commit
forge build
```

### 5) Desplegar el contrato SupplyChain

Opción sencilla (forge create):

```bash
cd /mnt/<tu-disco>/.../98_pfm_traza_2025/sc
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

La salida mostrará la dirección del contrato. Copia esa dirección (p.ej. `0x...`).

Para verificar conectividad:

```bash
cast block-number --rpc-url http://127.0.0.1:8545
```

### 6) Configurar MetaMask para Anvil

En MetaMask:

- Añade red:
  - Network Name: `Anvil Local`
  - RPC URL: `http://127.0.0.1:8545`
  - Chain ID: `31337`
  - Currency Symbol: `ETH`

- Importa cuentas de prueba usando las private keys que mostró Anvil (al menos 2–3 para probar roles y transferencias).

### 7) Configurar el frontend (Next.js)

En PowerShell (Windows) o terminal (Linux/macOS), fuera de WSL para el frontend:

```bash
cd 98_pfm_traza_2025/web
npm install
```

Edita `web/src/contracts/config.ts` y sustituye la dirección del contrato:

```ts
export const CONTRACT_CONFIG = {
  address: "0xTU_DIRECCION_DESPLEGADA",
  adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  abi: [ /* ya incluido en el repo */ ]
};
```

Compila y levanta el frontend:

```bash
npm run build
npm run dev
# Abre http://localhost:3000
```

Si solo quieres validar tipos y linting:

```bash
npm run lint
npm run build
```

### 8) Flujo de prueba básico en la UI

1. Conecta MetaMask en la app (botón Connect).
2. En Home, solicita registro con un rol (Producer/Factory/Retailer/Consumer).
3. Cambia a una cuenta admin (Account #0 de Anvil) y ve a `/admin/users` para aprobar la solicitud.
4. Con la cuenta aprobada, ve a `/tokens/create` y crea un token (nombre, supply, features JSON, parentId = 0 si es materia prima).
5. Ve a `/tokens/[id]` para ver metadatos, balance y árbol de parentesco.
6. Inicia una transferencia desde `/tokens/[id]/transfer` indicando destinatario y cantidad.
7. Con la cuenta destinataria, ve a `/transfers` para aceptar o rechazar; en la sección Pending verás la solicitud y en History el resultado.

Notas UI:

- La cabecera muestra conexión y botón Connect/Disconnect.
- En Home se muestra el estado del usuario con badge (Pending/Approved/Rejected/Canceled) y su rol.
- La app incluye toasts de éxito/error y spinners de carga en acciones Web3.

### 9) Solución de problemas comunes

- Tailwind/PostCSS en Next 16: si ves `It looks like you're trying to use tailwindcss directly as a PostCSS plugin`, asegúrate de usar `@tailwindcss/postcss` en `web/postcss.config.js`:

```js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

- BigInt y TypeScript: evita usar literales `0n` en componentes; usa `BigInt(0)` para máxima compatibilidad del target.

- ESLint efecto con setState: no llames setState directamente dentro del cuerpo del efecto sin condiciones; usa dependencias correctas y callbacks memoizados (`useCallback`).

- Foundry en Windows: ejecuta `forge`, `anvil`, `cast` dentro de WSL. El frontend puedes ejecutarlo en PowerShell/cmd fuera de WSL.

### 10) Comandos útiles

Contratos (WSL):

```bash
cd sc
forge fmt && forge build
forge test -vvv
```

Frontend:

```bash
cd web
npm run lint
npm run build
npm run dev
```

Si actualizas el contrato, recuerda volver a desplegar y actualizar `web/src/contracts/config.ts` con la nueva `address`.


