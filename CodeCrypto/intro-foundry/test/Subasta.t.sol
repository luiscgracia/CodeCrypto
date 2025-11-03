// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Test.sol";
import "../src/Subasta.sol";

contract SubastaTest is Test {
    Subasta public subasta;

    uint256 private inicio;

    function setUp() public {
        subasta = new Subasta();
        inicio = block.timestamp;
    }

    function testOfertaAntesDeTiempo() public {
        vm.expectRevert(bytes("No puede ofertar"));
        subasta.oferta();
    }

    function testOferta() public {
        vm.warp(inicio + 1 days);
        subasta.oferta();
    }

    function testOfertaFallaDespuesDeFin() public {
        vm.expectRevert(bytes("No puede ofertar"));
        vm.warp(inicio + 2 days);
        subasta.oferta();
    }

    function testTimestamp() public {
        uint256 t = block.timestamp;

        // skip, incrementa el timestamp actual
        skip(100);
        assertEq(block.timestamp, t + 100);

        // rewind, decrementa el timestamp actual
        rewind(10);
        assertEq(block.timestamp, t + 100 - 10);
    }

    function testBlockNumber() public {
        uint256 b = block.number;
        // roll, permite alterar el numero del bloque en la blockchain
        vm.roll(555);
        assertEq(b, 555);
    }
}
