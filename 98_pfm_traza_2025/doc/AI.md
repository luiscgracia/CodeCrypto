## H1-S1 Instalar Node 18+, Foundry y MetaMask

- Fecha/hora (Europe/Madrid): 23/10/2025, 10:31:01

- Resumen de acciones (Windows 10 PowerShell):
  - Verificado Node.js y npm instalados (Node v22.16.0, npm 10.9.2)
  - Instalado Foundry dentro de WSL (Ubuntu) y verificados forge/anvil
  - MetaMask: verificación manual (pendiente confirmar en navegador)

- Comandos ejecutados:
  - git checkout master && git pull --rebase origin master
  - node --version && npm --version
  - wsl -e bash -lc 'curl -fsSL https://foundry.paradigm.xyz | bash; source ~/.bashrc >/dev/null 2>&1 || true; foundryup; forge --version; anvil --version'

- Resultados de checks:
  - Node/npm: OK → v22.16.0 / 10.9.2
  - Foundry (WSL): OK → foundryup 1.3.0; forge 1.2.3-stable; anvil 1.2.3-stable
  - MetaMask: pendiente (instalación/extensión en navegador)


## H1-S2 Crear estructura de directorios sc/ y web/

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:10:39

- Resumen de acciones:
  - Creada la estructura base de carpetas: `sc/`, `sc/src`, `sc/script`, `sc/test` y `web/`
  - Añadidos archivos `.gitkeep` para versionar directorios vacíos

- Comandos ejecutados:
  - git checkout master && git pull --rebase origin master
  - pwsh: creación de directorios y `.gitkeep`

- Resultados de checks:
  - Estructura: OK (directorios y `.gitkeep` presentes)
  - Builds: N/A (sin código aún en esta sub-issue)

## H1-S3 Añadir archivos de configuración iniciales

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:19:34

- Resumen de acciones:
  - Añadido `sc/foundry.toml` con configuración básica
  - Creado `sc/script/Deploy.s.sol` (placeholder)
  - Generada app Next.js TypeScript en `web/`

- Comandos ejecutados:
  - git checkout master && git pull --rebase origin master
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge build"
  - npx create-next-app@latest web --ts --eslint --use-npm --no-tailwind --app --import-alias "@/*" --yes
  - cd web && npm run build && npm run lint

- Resultados de checks:
  - forge build: OK (estructura mínima lista)
  - Next.js build: OK
  - ESLint: OK

## H1-S4 Verificar ejecución de anvil, forge build y npm run dev

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:19:34

- Resumen de acciones:
  - Anvil iniciado en WSL para verificación rápida
  - `forge build` ejecutado en `sc/`
  - Next.js dev levantado temporalmente y verificación de disponibilidad

- Comandos ejecutados:
  - wsl -e bash -lc "export PATH=\"$HOME/.foundry/bin:$PATH\"; nohup anvil &"
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge build"
  - npm run dev (temporal) en `web/` y probe `http://localhost:3000`

- Resultados de checks:
  - anvil: iniciado (WSL)
  - forge build: OK
  - Next.js dev: OK (servido en localhost:3000)

## H2-S1 Definir enums UserStatus y TransferStatus

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:19:34

- Resumen de acciones:
  - Añadidos enumerados `UserStatus` y `TransferStatus` en `sc/src/SupplyChain.sol`
  - Formateado el código y verificado build con Foundry

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge fmt && forge build"

- Resultados de checks:
  - forge build: OK

## H2-S2 Crear structs User, Token y Transfer

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:19:34

- Resumen de acciones:
  - Añadidos structs `User`, `Token` (con mapping de balances) y `Transfer`
  - Declaradas variables de estado, mappings y eventos base en `SupplyChain`
  - Formateado y verificado build

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge fmt && forge build"

- Resultados de checks:
  - forge build: OK

## H2-S3 Configurar mappings e identificadores auto-incrementales

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Verificados mappings `tokens`, `transfers`, `users`, `addressToUserId`
  - Verificados contadores `nextTokenId`, `nextTransferId`, `nextUserId`
  - Formateado y build exitoso

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge fmt && forge build"

- Resultados de checks:
  - forge build: OK

## H2-S4 Emitir eventos para usuario, token y transferencia

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Verificadas declaraciones de eventos: `UserRoleRequested`, `UserStatusChanged`, `TokenCreated`, `TransferRequested`, `TransferAccepted`, `TransferRejected`
  - Formateado y build del contrato

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge fmt && forge build"

- Resultados de checks:
  - forge build: OK

## H2-S5 Desarrollar pruebas unitarias para eventos de usuario, token y transferencia

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Añadidas funciones mínimas para emisión de eventos (requestUserRole, createToken, transfer)
  - Instalado `forge-std` y creada `sc/test/SupplyChain.t.sol` con tests de eventos
  - Ejecutados build y tests en Foundry

- Comandos ejecutados:
  - forge install foundry-rs/forge-std --no-commit
  - forge build && forge test -vvv

- Resultados de checks:
  - build: OK
  - tests: OK (eventos emitidos con parámetros esperados)

## H3-S1 Implementar funciones para solicitud y gestión de roles

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Implementadas funciones: `requestUserRole`, `changeStatusUser`, `getUserInfo`, `isAdmin`
  - Persistencia mínima en mappings y emisión de eventos correspondientes
  - Formateado y ejecución de tests

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge fmt && forge test -vvv"

- Resultados de checks:
  - build/tests: OK

## H3-S2 Implementar creación de tokens con metadatos y balances

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - `createToken` ahora requiere usuario aprobado (UserStatus.Approved)
  - Persistencia de metadatos JSON y `parentId`; asignación de balance inicial
  - Añadidos tests: aprobado puede crear; no aprobado revierte
  - Formateado y ejecución de tests

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge fmt && forge test -vvv"

- Resultados de checks:
  - tests/build: OK

## H3-S3 Implementar flujo de transferencias: transfer, acceptTransfer y rejectTransfer

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Lógica de `transfer` con deducción temporal de saldo y creación de solicitud Pending
  - `acceptTransfer` (solo receptor) acredita saldo y marca Accepted
  - `rejectTransfer` (receptor o admin) restaura saldo y marca Rejected
  - Tests actualizados para iniciar transferencia desde usuario aprobado con balance

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge test -vvv"

- Resultados de checks:
  - tests/build: OK

## H3-S4 Validar flujo Producer→Factory→Retailer→Consumer y balances

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Añadidas restricciones de flujo de roles (Producer→Factory→Retailer→Consumer) en aceptación
  - Bloqueado que Consumer inicie transferencias
  - Añadido `getTokenBalance` y helpers de comparación de roles
  - Tests: creación de usuario recipient con vm.prank, rechazo por admin restaura saldo

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge test -vvv"

- Resultados de checks:
  - tests/build: OK

## H3-S5 Añadir funciones de consulta (getUserTokens, getUserTransfers, getTransfer)

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Implementadas vistas: `getUserTokens`, `getUserTransfers`, `getTransfer` (y `getTokenBalance` ya existente)
  - Devuelven arrays de ids según creador/tenencia y transferencias asociadas
  - Añadidos tests básicos para validar los datos devueltos

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge test -vvv"

- Resultados de checks:
  - tests/build: OK

## H3-S6 Desarrollar pruebas unitarias para lógica de negocio y transferencias

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Añadidos tests de casos edge y reverts: cantidad cero, mismo destinatario, transferencia inexistente
  - Validaciones añadidas en `transfer` (mismo address, amount>0) y tests de rechazo/aceptación
  - Suite ejecutada en WSL, todo en verde

- Comandos ejecutados:
  - wsl -e bash -lc "cd /mnt/e/CodeCrypto/source/98_pfm_traza_2025/sc && forge test -vvv"

- Resultados de checks:
  - tests/build: OK

## H4-S1 Crear proveedor de contexto Web3Provider para conexión MetaMask

- Fecha/hora (Europe/Madrid): 23/10/2025, 11:42:17

- Resumen de acciones:
  - Añadido `web/src/contexts/Web3Context.tsx` con conexión, persistencia y eventos
  - Envolvido `web/app/layout.tsx` con `<Web3Provider>`
  - Instalado `ethers@6` y verificados build/lint

- Comandos ejecutados:
  - cd web && npm i ethers@6 && npm run build && npm run lint

- Resultados de checks:
  - build: OK
  - lint: OK

## H4-S2 Implementar hook useWallet para conectar y desconectar MetaMask

- Fecha/hora (Europe/Madrid): 23/10/2025, 15:40:40

- Resumen de acciones:
  - Añadido `web/src/hooks/useWallet.ts` que expone `account`, `chainId`, `provider`, `isConnected`, `connect`, `disconnect`
  - Verificado build/lint tras la incorporación del hook

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H4-S3 Diseñar layout general y header de navegación

- Fecha/hora (Europe/Madrid): 23/10/2025, 17:51:25

- Resumen de acciones:
  - Creado `web/src/components/Header.tsx` (client) con enlaces y conexión MetaMask
  - Incluido en `web/app/layout.tsx` bajo `<Web3Provider>`
  - Verificado build/lint del frontend

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H4-S4 Generar páginas base: /, /dashboard, /tokens, /transfers, /admin y /profile

- Fecha/hora (Europe/Madrid): 23/10/2025, 17:51:25

- Resumen de acciones:
  - Creadas páginas base en `web/app`: `/dashboard`, `/tokens`, `/transfers`, `/admin`, `/profile` (con placeholders)
  - Verificado build/lint y rutas prerenderizadas

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H4-S5 Integrar Tailwind CSS y componentes de shadcn/ui

- Fecha/hora (Europe/Madrid): 23/10/2025, 18:09:34

- Resumen de acciones:
  - Instalado y configurado Tailwind CSS con `@tailwindcss/postcss`
  - Añadidos componentes base: `Button`, `Card`, `Label`, `Select`
  - Verificados build y lint del frontend

- Comandos ejecutados:
  - cd web && npm i -D tailwindcss postcss autoprefixer @tailwindcss/postcss
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H4-S6 Validar compilación y linting del frontend

- Fecha/hora (Europe/Madrid): 23/10/2025, 18:09:34

- Resumen de acciones:
  - Ejecutados `npm run build` y `npm run lint` en `web/`
  - Verificadas rutas prerenderizadas sin errores

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S1 Mostrar estado de conexión y registro en la página principal

- Fecha/hora (Europe/Madrid): 23/10/2025, 18:19:56

- Resumen de acciones:
  - Actualizada `/` para mostrar estado de conexión (connect/disconnect) y placeholder de registro
  - Añadida config mínima de contrato y servicio Web3 guardado para evitar errores sin address
  - Verificados build y lint

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S2 Permitir a los usuarios solicitar registro según su rol

- Fecha/hora (Europe/Madrid): 23/10/2025, 18:26:33

- Resumen de acciones:
  - UI en `/` con selector de rol y botón de solicitud
  - Servicio Web3 para `requestUserRole` y aviso si falta configurar address
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S3 Crear panel de administración para aprobar o rechazar solicitudes

- Fecha/hora (Europe/Madrid): 23/10/2025, 18:32:43

- Resumen de acciones:
  - Página `/admin/users` con entrada de address y botones Approve/Reject/Cancel
  - Servicio Web3 extendido y ABI con `changeStatusUser`
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S4 Crear UI para creación de tokens

- Fecha/hora (Europe/Madrid): 23/10/2025, 18:47:25

- Resumen de acciones:
  - Página `/tokens/create` con formulario (name, totalSupply, features JSON, parentId)
  - Servicio Web3 extendido y ABI con `createToken`
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S5 UI de transferencias: enviar, aceptar y rechazar

- Fecha/hora (Europe/Madrid): 23/10/2025, 18:57:56

- Resumen de acciones:
  - ABI/servicio extendidos con `transfer`, `acceptTransfer`, `rejectTransfer`, `getUserTransfers`, `getTransfer`
  - Página `/tokens/[id]/transfer` con formulario (to, amount)
  - Página `/transfers` con listado básico y acciones aceptar/rechazar
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S7 Mostrar detalles y estado de transferencias

- Fecha/hora (Europe/Madrid): 23/10/2025, 19:04:12

- Resumen de acciones:
  - Mejorada `/transfers` para mostrar `from`, `to`, `tokenId`, `amount`, `status`
  - Acciones condicionales solo cuando `status=Pending`
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S6 Ver detalle del token y árbol de parentesco

- Fecha/hora (Europe/Madrid): 23/10/2025, 19:19:14

- Resumen de acciones:
  - Añadidas funciones `getToken` y `getTokenBalance` en ABI/servicio
  - Creada página `/tokens/[id]` mostrando metadatos, balance del usuario y árbol de parentesco recursivo
  - Ajuste BigInt literal para compatibilidad TS (uso de `BigInt(0)`)
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S8 Mostrar transferencias pendientes e historial con acciones

- Fecha/hora (Europe/Madrid): 23/10/2025, 19:27:44

- Resumen de acciones:
  - `/transfers` dividido en secciones: Pending e History
  - Auto-refresh tras aceptar/rechazar
  - Fechas legibles y detalle de dirección/token/cantidad
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S9 Mostrar estados y roles correctamente en la UI

- Fecha/hora (Europe/Madrid): 23/10/2025, 19:36:25

- Resumen de acciones:
  - Añadido `web/src/components/ui/badge.tsx` y helpers `web/src/lib/status.ts`
  - Home: badge de estado/rol del usuario
  - `/transfers`: badges para Pending/Accepted/Rejected y fecha legible
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

## H5-S10 Manejo de errores, loaders y notificaciones

- Fecha/hora (Europe/Madrid): 23/10/2025, 19:47:16

- Resumen de acciones:
  - Añadido `ToastProvider` y hook `useToast` + `Spinner`
  - Helper `extractErrorMessage` para errores de ethers/web3
  - Integrado en Home, Admin/Users, Tokens/Create y Transfers
  - Build/lint verificados

- Comandos ejecutados:
  - cd web && npm run lint && npm run build

- Resultados de checks:
  - lint/build: OK

