// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Test.sol";
import "../src/SendEther.sol";

contract SendEtherTest is Test {
    SendEther public sendEther;

    function setUp() public {
        sendEther = new SendEther();
    }

    function _send(uint256 amount) private {
        (bool ok,) = address(sendEther).call{value: amount}("");
        require(ok, "Enviar ETH fall&#243;");
    }

    function testEthBalance() public view {
        console.log("ETH Balance:", address(this).balance / 1e18);
    }

    function testSendEther() public {
        uint256 bal = address(sendEther).balance;

        // deal, asignarle un valor a una address
        deal(address(1), 100);
        assertEq(address(1).balance, 100);

        deal(address(1), 10);
        assertEq(address(1).balance, 10);

        // hoax
        deal(address(1), 145);
        vm.prank(address(1));
        _send(145);

        hoax(address(1), 567);
        _send(567);

        assertEq(address(sendEther).balance, bal + 145 + 567);
    }
}
