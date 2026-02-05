// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Test.sol";
import "../lib/forge-std/src/console.sol";

interface IWETH {
    function balanceOf(address) external view returns (uint256);
    function deposit() external payable;
}

contract ForkTest is Test {
    IWETH public weth;

    function setUp() public {
        weth = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    }

    function testDeposit() public {
        uint256 balanceInicial = weth.balanceOf(address(this));
        console.log("Balance inicial:", balanceInicial);

        weth.deposit{value: 500}();

        uint256 balanceFinal = weth.balanceOf(address(this));
        console.log("Balance final:  ", balanceFinal);
    }
}

// API_Alchemy: https://eth-mainnet.g.alchemy.com/v2/dab0Z22Gy5QXqzgYjDtxuQUifGjlQRfw
// forge test --fork-url [API_Alchemy] --match-path test/Fork.t.sol -vvv

// forge test --fork-url https://eth-mainnet.g.alchemy.com/v2/dab0Z22Gy5QXqzgYjDtxuQUifGjlQRfw --match-path test/Fork.t.sol -vvv
