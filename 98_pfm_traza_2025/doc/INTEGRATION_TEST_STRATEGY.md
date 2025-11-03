# Estrategia simple (dos capas)

1. **Integración on-chain (Foundry)**

   * Usa `forge test` con *pranks* y varios `address` para cubrir flujos de negocio completos del contrato (Producer→Factory→…).
   * Son rápidos, sin navegador, y te dan mucha señal.

2. **Integración off-chain (Node.js + viem/ethers)**

   * Pruebas que llaman a tu contrato **igual que el frontend**, pero desde Node (Vitest/Jest).
   * Conectas a **Anvil** y firmas con **private keys** (las de Anvil).
   * Aquí validas tu **servicio Web3** (conversión de tipos, manejo de transacciones, reintentos, parseo de eventos, etc.).

Con esto cubres de extremo a extremo *sin* intervención humana.

---

## A) Integración on-chain con Foundry (recomendado)

**Ejemplo de test de integración (SupplyChain.t.sol)**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

contract SupplyChainIntegrationTest is Test {
    SupplyChain sc;

    address admin   = vm.addr(1);
    address prod    = vm.addr(2);
    address factory = vm.addr(3);
    address retail  = vm.addr(4);
    address cons    = vm.addr(5);

    function setUp() public {
        vm.prank(admin);
        sc = new SupplyChain();

        // Seed: solicitar y aprobar roles necesarios
        vm.prank(prod);    sc.requestUserRole("Producer");
        vm.prank(factory); sc.requestUserRole("Factory");
        vm.prank(retail);  sc.requestUserRole("Retailer");
        vm.prank(cons);    sc.requestUserRole("Consumer");

        vm.startPrank(admin);
        sc.changeStatusUser(prod, SupplyChain.UserStatus.Approved);
        sc.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        sc.changeStatusUser(retail, SupplyChain.UserStatus.Approved);
        sc.changeStatusUser(cons, SupplyChain.UserStatus.Approved);
        vm.stopPrank();
    }

    function test_FullFlow() public {
        // Producer crea token
        vm.prank(prod);
        sc.createToken("Cacao", 1000, '{"grade":"A"}', 0);

        // Transfer a Factory
        vm.prank(prod);
        sc.transfer(factory, 1, 100);

        // Factory acepta
        vm.prank(factory);
        sc.acceptTransfer(1);

        // Assert balances
        uint prodBal    = sc.getTokenBalance(1, prod);
        uint factoryBal = sc.getTokenBalance(1, factory);
        assertEq(prodBal, 900);
        assertEq(factoryBal, 100);
    }
}
```

**Ventajas**

* No hay UI, ni extensiones: puro contrato.
* Sincroniza muy bien con tu pirámide de tests (rápidos y confiables).

**Scripts**

```bash
forge test -vv
```

---

## B) Integración off-chain (Node + viem) — “como si fueras el frontend”

### 1) Dependencias

```bash
npm i -D vitest ts-node typescript
npm i viem # (o ethers si prefieres)
```

### 2) Scripts

```json
{
  "scripts": {
    "anvil": "anvil --chain-id 31337 --silent",
    "build:abi": "forge build",
    "test:int": "vitest run --dir tests-int"
  }
}
```

> Ejecuta en dos terminales o orquesta con `start-server-and-test` si quieres, pero manténlo simple:
>
> 1. `npm run anvil`
> 2. `npm run build:abi`
> 3. `npm run test:int`

### 3) Helper de cliente viem (tests-int/helpers/client.ts)

```ts
import { createPublicClient, createWalletClient, http, parseAbiItem, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

const RPC = "http://localhost:8545";

// Cuentas de Anvil por defecto (usa la que necesites)
export const adminPk   = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const producerPk= "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
export const factoryPk = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
export const retailerPk= "0x7c852118294c9c8720f70c029fce6a99d6a1a1bd7c1ee5edc9f3b6b1b21f6f8a";
export const consumerPk= "0x47e179ec197488593b187f80a00eb0da205c4b2dbeabi..."; // otra de anvil

export const publicClient = createPublicClient({
  chain: foundry,
  transport: http(RPC),
});

export const mkWallet = (pk: string) =>
  createWalletClient({
    chain: foundry,
    transport: http(RPC),
    account: privateKeyToAccount(pk as `0x${string}`),
  });

// utilidades JSON-RPC para snapshots
export async function snapshot() {
  return await publicClient.request({ method: "evm_snapshot", params: [] }) as string;
}
export async function revert(id: string) {
  return await publicClient.request({ method: "evm_revert", params: [id] });
}
```

### 4) Despliegue para tests (puedes usar el script Foundry o hacerlo con viem)

**Opción simple (viem) — tests-int/helpers/deploy.ts**

```ts
import { mkWallet, publicClient } from "./client";
import { parseAbi } from "viem";
import fs from "node:fs";

export async function deploySupplyChain() {
  const admin = mkWallet(process.env.ADMIN_PK || "0xac09...ff80"); // default Anvil account #0
  const abi = JSON.parse(fs.readFileSync("./out/SupplyChain.sol/SupplyChain.json","utf8")).abi;
  const bytecode = JSON.parse(fs.readFileSync("./out/SupplyChain.sol/SupplyChain.json","utf8")).bytecode.object;

  const hash = await admin.deployContract({
    abi,
    bytecode: `0x${bytecode}`,
    args: [],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error("No contractAddress");
  return { address: receipt.contractAddress as `0x${string}`, abi };
}
```

> Si prefieres, usa **`forge script ... --json`** y lee el `.json` generado (evitas duplicar lógica de deploy).

### 5) Test de integración (Vitest) — tests-int/supplychain.int.test.ts

```ts
import { describe, it, beforeAll, beforeEach, expect } from "vitest";
import { publicClient, mkWallet, snapshot, revert, adminPk, producerPk, factoryPk } from "./helpers/client";
import { deploySupplyChain } from "./helpers/deploy";
import { getAddress } from "viem";

let contract: { address: `0x${string}`, abi: any };
let snapId: string;

describe("SupplyChain integration (Node + viem)", () => {
  beforeAll(async () => {
    contract = await deploySupplyChain();
    // Seed de roles
    const admin = mkWallet(adminPk);
    const producer = mkWallet(producerPk);
    const factory = mkWallet(factoryPk);

    await producer.writeContract({ address: contract.address, abi: contract.abi, functionName: "requestUserRole", args: ["Producer"]});
    await factory.writeContract({  address: contract.address, abi: contract.abi, functionName: "requestUserRole",  args: ["Factory"]});

    await admin.writeContract({ address: contract.address, abi: contract.abi, functionName: "changeStatusUser", args: [producer.account.address, 1]/* Approved */});
    await admin.writeContract({ address: contract.address, abi: contract.abi, functionName: "changeStatusUser", args: [factory.account.address, 1]});
  });

  beforeEach(async () => {
    snapId = await snapshot();
  });

  it("Producer crea token y transfiere a Factory", async () => {
    const producer = mkWallet(producerPk);
    const factory  = mkWallet(factoryPk);

    // Crear token
    await producer.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "createToken",
      args: ["Cacao", 1000n, '{"grade":"A"}', 0n]
    });

    // Transferir 100 a Factory
    await producer.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "transfer",
      args: [factory.account.address, 1n, 100n]
    });

    // Factory acepta
    await factory.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "acceptTransfer",
      args: [1n]
    });

    // Assert balances
    const prodBal = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getTokenBalance",
      args: [1n, producer.account.address]
    });
    const facBal = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getTokenBalance",
      args: [1n, factory.account.address]
    });

    expect(prodBal).toBe(900n);
    expect(facBal).toBe(100n);
  });

  afterEach(async () => {
    await revert(snapId);
  });
});
```

**Claves del ejemplo**

* No hay extensiones, ni clicks: **todo programático**.
* Usas **cuentas de Anvil** como si fueran usuarios reales.
* `snapshot/revert` te da **tests idempotentes** y veloces.

---

## Buenas prácticas para estos tests

* **Datos de seed mínimos y deterministas** (roles, 1–2 tokens base).
* **Snapshots/reverts** entre pruebas para evitar re-deploys.
* **Asserts por eventos** si te interesa trazabilidad: puedes leer `logs` de `waitForTransactionReceipt` y validar `eventName`/`args`.
* **Separa**:

  * Foundry (lógica de contrato)
  * Node (capa Web3/servicios y “contrato + transporte RPC”)

---

## Resumen ejecutable

1. **Foundry (on-chain)**

   * Escribe tests de flujo con `vm.prank` y `assertEq`.
   * `forge test`.

2. **Node (off-chain)**

   * `anvil` en 8545.
   * Despliega (Foundry o viem).
   * Vitest + viem: invoca tus funciones y **aserta balances/estados**.
   * Usa **private keys de Anvil** (sin MetaMask), y **snapshots** para aislar.