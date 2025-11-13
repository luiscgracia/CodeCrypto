// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Test.sol";
import "../src/SupplyChainTracker.sol";

contract SupplyChainTest_Users is Test {
    SupplyChainTracker public supplyChain;

    // Roles
    bytes32 public constant PRODUCER = keccak256("Producer");
    bytes32 public constant FACTORY = keccak256("Factory");
    bytes32 public constant RETAILER = keccak256("Retailer");
    bytes32 public constant CONSUMER = keccak256("Consumer");

    // Direcciones de prueba
    address public admin;
    address public producer;
    address public factory;
    address public retailer;
    address public consumer;
    address public attacker;

    // Configuración inicial
    function setUp() public {
        admin = address(1);
        producer = address(2);
        factory = address(3);
        retailer = address(4);
        consumer = address(5);
        attacker = address(6);

        vm.prank(admin);
        supplyChain = new SupplyChainTracker();
    }

    // TESTS DE GESTIÓN DE USUARIOS
    function testUserRegistration() public {
        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
        supplyChain.requestUserRole(PRODUCER);

        SupplyChainTracker.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.role, PRODUCER);
        assertEq(uint256(user.status), uint256(SupplyChainTracker.UserStatus.Pending));
    }

    function testAdminApproveUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);

        SupplyChainTracker.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChainTracker.UserStatus.Approved));
    }

    function testAdminRejectUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Rejected);

        SupplyChainTracker.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChainTracker.UserStatus.Rejected));
    }

    function testUserStatusChanges() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Rejected);
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Canceled);

        SupplyChainTracker.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChainTracker.UserStatus.Canceled));
    }

    function testOnlyApprovedUsersCanOperate() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        vm.prank(producer);
        vm.expectRevert("Not approved");
        supplyChain.createToken("Test", 100, "Features", 0);

        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);

        vm.prank(producer);
        supplyChain.createToken("Test", 100, "Features", 0);
    }

    function testGetUserInfo() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        SupplyChainTracker.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.id, 1);
        assertEq(user.userAddress, producer);
        assertEq(user.role, PRODUCER);
        assertEq(uint256(user.status), uint256(SupplyChainTracker.UserStatus.Pending));
    }

    function testIsAdmin() public view {
        assertEq(supplyChain.admin(), admin);
    }
}