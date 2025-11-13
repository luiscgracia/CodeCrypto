// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Test.sol";
import "../src/SupplyChainTracker.sol";

contract SupplyChainTest_TransfersAndFlows is Test {
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

    // TESTS DE TRANSFERENCIAS
    function testTransferFromProducerToFactory() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        assertEq(supplyChain.getTokenBalance(1, producer), 500);
        assertEq(supplyChain.getTokenBalance(1, factory), 500);

        (,,,,,, SupplyChainTracker.TransferStatus status) = supplyChain.transfers(1);
        assertEq(uint256(status), uint256(SupplyChainTracker.TransferStatus.Pending));
    }

    function testTransferFromFactoryToRetailer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);
        _setupApprovedUser(retailer, RETAILER);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 500);

        assertEq(supplyChain.getTokenBalance(1, factory), 500);
        assertEq(supplyChain.getTokenBalance(1, retailer), 500);
    }

    function testTransferFromRetailerToConsumer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);
        _setupApprovedUser(retailer, RETAILER);
        _setupApprovedUser(consumer, CONSUMER);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 500);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 250);

        assertEq(supplyChain.getTokenBalance(1, retailer), 250);
        assertEq(supplyChain.getTokenBalance(1, consumer), 250);
    }

    function testAcceptTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        (,,,,,, SupplyChainTracker.TransferStatus status) = supplyChain.transfers(1);
        assertEq(uint256(status), uint256(SupplyChainTracker.TransferStatus.Accepted));
    }

    function testRejectTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        vm.prank(factory);
        supplyChain.rejectTransfer(1);

        (,,,,,, SupplyChainTracker.TransferStatus status) = supplyChain.transfers(1);
        assertEq(uint256(status), uint256(SupplyChainTracker.TransferStatus.Rejected));

        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
    }

    function testTransferInsufficientBalance() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 100, "High Quality", 0);

        vm.prank(producer);
        vm.expectRevert("Insufficient balance");
        supplyChain.transfer(factory, 1, 200);
    }

    function testGetTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        (uint256 id, address from, address to, uint256 tokenId, uint256 amount,,) = supplyChain.transfers(1);
        assertEq(id, 1);
        assertEq(from, producer);
        assertEq(to, factory);
        assertEq(tokenId, 1);
        assertEq(amount, 500);
    }

    function testGetUserTransfers() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);
        _setupApprovedUser(retailer, RETAILER);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 250);

        uint256[] memory producerTransfers = supplyChain.getUserTransfers(producer);
        assertEq(producerTransfers.length, 1);
        assertEq(producerTransfers[0], 1);

        uint256[] memory factoryTransfers = supplyChain.getUserTransfers(factory);
        assertEq(factoryTransfers.length, 2);
    }

    // TESTS DE VALIDACIONES Y PERMISOS
    function testInvalidRoleTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(consumer, CONSUMER);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(producer);
        vm.expectRevert("Invalid role transition");
        supplyChain.transfer(consumer, 1, 500);
    }

    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        vm.prank(producer);
        vm.expectRevert("Not approved");
        supplyChain.createToken("Test", 100, "Features", 0);
    }

    function testUnapprovedUserCannotTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(factory);
        supplyChain.requestUserRole(FACTORY);

        vm.prank(producer);
        vm.expectRevert("Recipient not registered");
        supplyChain.transfer(factory, 1, 500);
    }

    function testOnlyAdminCanChangeStatus() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        vm.expectRevert("Not admin");
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);
    }

    function testConsumerCannotTransfer() public {
        _setupApprovedUser(consumer, CONSUMER);
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(consumer, 1, 500);
        vm.prank(consumer);
        supplyChain.acceptTransfer(1);

        vm.prank(consumer);
        vm.expectRevert("Consumer cannot transfer");
        supplyChain.transfer(producer, 1, 250);
    }

    function testTransferToSameAddress() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(producer);
        vm.expectRevert("Invalid recipient");
        supplyChain.transfer(producer, 1, 500);
    }

    // TESTS DE CASOS EDGE
    function testTransferZeroAmount() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(producer);
        vm.expectRevert("Amount must be > 0");
        supplyChain.transfer(factory, 1, 0);
    }

    function testTransferNonExistentToken() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        vm.expectRevert("Token does not exist");
        supplyChain.transfer(factory, 999, 500);
    }

    function testAcceptNonExistentTransfer() public {
        _setupApprovedUser(factory, FACTORY);

        vm.prank(factory);
        vm.expectRevert("Not pending");
        supplyChain.acceptTransfer(999);
    }

    function testDoubleAcceptTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        vm.expectRevert("Not pending");
        supplyChain.acceptTransfer(1);
    }

    function testTransferAfterRejection() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        vm.prank(factory);
        supplyChain.rejectTransfer(1);

        vm.prank(factory);
        vm.expectRevert("Not pending");
        supplyChain.acceptTransfer(1);
    }

    // TESTS DE EVENTOS
    function testUserRegisteredEvent() public {
        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
        supplyChain.requestUserRole(PRODUCER);
    }

    function testUserStatusChangedEvent() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        vm.prank(admin);
        vm.expectEmit(true, true, true, true);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);
    }

    function testTokenCreatedEvent() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
        supplyChain.createToken("Test Product", 1000, "Features", 0);
    }

    function testTransferInitiatedEvent() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
        supplyChain.transfer(factory, 1, 500);
    }

    function testTransferAcceptedEvent() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        vm.prank(factory);
        vm.expectEmit(true, true, true, true);
        supplyChain.acceptTransfer(1);
    }

    function testTransferRejectedEvent() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        vm.prank(factory);
        vm.expectEmit(true, true, true, true);
        supplyChain.rejectTransfer(1);
    }

    // TESTS DE FLUJO COMPLETO
    function testCompleteSupplyChainFlow() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);
        _setupApprovedUser(retailer, RETAILER);
        _setupApprovedUser(consumer, CONSUMER);

        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "Organic", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 700);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 350);

        assertEq(supplyChain.getTokenBalance(1, producer), 0);
        assertEq(supplyChain.getTokenBalance(1, factory), 300);
        assertEq(supplyChain.getTokenBalance(1, retailer), 350);
        assertEq(supplyChain.getTokenBalance(1, consumer), 350);
    }

    function testMultipleTokensFlow() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product 1", 1000, "Type A", 0);
        supplyChain.createToken("Product 2", 2000, "Type B", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        supplyChain.transfer(factory, 2, 1000);

        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        supplyChain.acceptTransfer(2);

        assertEq(supplyChain.getTokenBalance(1, producer), 500);
        assertEq(supplyChain.getTokenBalance(1, factory), 500);
        assertEq(supplyChain.getTokenBalance(2, producer), 1000);
        assertEq(supplyChain.getTokenBalance(2, factory), 1000);
    }

    function testTraceabilityFlow() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);
        _setupApprovedUser(retailer, RETAILER);
        _setupApprovedUser(consumer, CONSUMER);

        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "Base Product", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        supplyChain.createToken("Processed Product", 800, "Derived from Raw Material", 1);

        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 800);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        (,,,,, uint256 parentId1,,) = supplyChain.getToken(1);
        (,,,,, uint256 parentId2,,) = supplyChain.getToken(2);

        assertEq(parentId1, 0);
        assertEq(parentId2, 1);
    }

    // Función auxiliar para configurar usuarios aprobados
    function _setupApprovedUser(address user, bytes32 role) internal {
        vm.prank(user);
        supplyChain.requestUserRole(role);
        vm.prank(admin);
        supplyChain.changeStatusUser(user, SupplyChainTracker.UserStatus.Approved);
    }
}