// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Test.sol";
import "../src/SupplyChainTracker.sol";

contract SupplyChainTest_Tokens is Test {
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

    // Función auxiliar para configurar usuarios aprobados
    function _setupApprovedUser(address user, bytes32 role) internal {
        vm.prank(user);
        supplyChain.requestUserRole(role);
        vm.prank(admin);
        supplyChain.changeStatusUser(user, SupplyChainTracker.UserStatus.Approved);
    }

    // TESTS DE CREACIÓN DE TOKENS
    function testCreateTokenByProducer() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Product A", 1000, "Organic", 0);

        (uint256 id,, string memory name, uint256 totalSupply,,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(name, "Product A");
        assertEq(totalSupply, 1000);
    }

    function testCreateTokenByFactory() public {
        _setupApprovedUser(factory, FACTORY);

        vm.prank(factory);
        supplyChain.createToken("Processed Product", 500, "Processed", 0);

        (uint256 id,, string memory name,,,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(name, "Processed Product");
    }

    function testCreateTokenByRetailer() public {
        _setupApprovedUser(retailer, RETAILER);

        vm.prank(retailer);
        supplyChain.createToken("Packaged Product", 200, "Packaged", 0);

        (uint256 id,, string memory name,,,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(name, "Packaged Product");
    }

    function testTokenWithParentId() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Parent Product", 1000, "Parent", 0);

        vm.prank(producer);
        supplyChain.createToken("Child Product", 500, "Child", 1);

        (,,,,, uint256 parentId,,) = supplyChain.getToken(2);
        assertEq(parentId, 1);
    }

    function testTokenMetadata() public {
        _setupApprovedUser(producer, PRODUCER);

        string memory name = "Test Product";
        uint256 totalSupply = 1000;
        string memory features = "High Quality";
        uint256 parentId = 0;

        vm.prank(producer);
        supplyChain.createToken(name, totalSupply, features, parentId);

        (, , string memory tokenName, uint256 tokenSupply, string memory tokenFeatures, uint256 tokenParentId, ,) = supplyChain.getToken(1);
        assertEq(tokenName, name);
        assertEq(tokenSupply, totalSupply);
        assertEq(tokenFeatures, features);
        assertEq(tokenParentId, parentId);
    }

    function testTokenBalance() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Test", 1000, "Features", 0);

        uint256 balance = supplyChain.getTokenBalance(1, producer);
        assertEq(balance, 1000);
    }

    function testGetToken() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Test", 1000, "Features", 0);

        (uint256 id, address creator, string memory name, uint256 totalSupply, string memory features, uint256 parentId, uint256 dateCreated, uint256 balance) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(creator, producer);
        assertEq(name, "Test");
        assertEq(totalSupply, 1000);
        assertEq(features, "Features");
        assertEq(parentId, 0);
        assertGt(dateCreated, 0);
        assertEq(balance, 1000);
    }

    function testGetUserTokens() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Token 1", 100, "Features 1", 0);
        supplyChain.createToken("Token 2", 200, "Features 2", 0);

        uint256[] memory userTokens = supplyChain.getUserTokens(producer);
        assertEq(userTokens.length, 2);
        assertEq(userTokens[0], 1);
        assertEq(userTokens[1], 2);
    }
}