// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console, stdError} from "../lib/forge-std/src/Test.sol";
import "../src/HolaMundo.sol";

contract HolaMundoTest is Test {
    HolaMundo public holamundo;

    function setUp() public {
        holamundo = new HolaMundo();
    }

    function testObtenerMensaje() public {
        string memory mensaje = holamundo.obtenerMensaje();
        assertEq(mensaje, "Hola mundo desde foundry");
    }
}
