// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Test.sol";
import "../src/Eventos.sol";

contract EventosTest is Test {
    Eventos public eventos;

    event Transfer(address indexed _from, address indexed _to, uint256 _amount);

    function setUp() public {
        eventos = new Eventos();
    }

    function testEmitTransferEvent() public {
        // indicamos a Foundry que datos vamos a comprobar
        vm.expectEmit(true, true, false, true);

        // emitimos el evento esperado
        emit Transfer(address(this), address(123), 200);

        // llamamos la función que debe emitir el evento
        eventos.transfer(address(this), address(123), 200);

        // comprobar solo el primer indice
        vm.expectEmit(true, false, false, false);
        emit Transfer(address(this), address(123), 400);
        eventos.transfer(address(this), address(125), 400);
    }

    function testEmitManyTransferEvent() public {
        address[] memory to = new address[](2);
        to[0] = address(10);
        to[1] = address(11);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 150;
        amounts[1] = 250;

        for (uint256 i = 0; i < to.length; i++) {
            // indicamos a Foundry que datos vamos a comprobar
            vm.expectEmit(true, true, false, true);
            // emitimos el evento esperado
            emit Transfer(address(this), to[i], amounts[i]);
            // llamamos la función que debe emitir el evento
            eventos.transferMany(address(this), to, amounts);
        }

        emit Transfer(address(this), address(123), 200);

        // llamamos la función que debe emitir el evento
    }
}
