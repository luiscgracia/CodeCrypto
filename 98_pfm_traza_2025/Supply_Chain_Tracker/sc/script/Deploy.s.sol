// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

contract SupplyChainScript is Script {
    function run() external {
        // Usará la clave proporcionada por --private-key o --keystore en la CLI
        vm.startBroadcast();

        SupplyChain supplyChain = new SupplyChain();
        console.log(unicode"✅ SupplyChain desplegado en:", address(supplyChain));

        vm.stopBroadcast();
    }
}