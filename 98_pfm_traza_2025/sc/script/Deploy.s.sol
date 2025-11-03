// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

contract DeployScript is Script {
    function run() external {
        // Usará la clave proporcionada por --private-key o --keystore en la CLI
        vm.startBroadcast();

        SupplyChain supplyChain = new SupplyChain();
        console.log(unicode"✅ SupplyChain deployed at:", address(supplyChain));

        vm.stopBroadcast();
    }
}
