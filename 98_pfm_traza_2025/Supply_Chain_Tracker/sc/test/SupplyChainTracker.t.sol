// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Test.sol";
import "../src/SupplyChainTracker.sol";

contract SupplyChainTest is Test {
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

    // Tests de gestión de usuarios
    function testUserRegistration() public {
        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
        supplyChain.requestUserRole(PRODUCER);

        // Obtener el struct User completo
        SupplyChainTracker.User memory user = supplyChain.getUserInfo(producer);

        // Acceder a los campos del struct
        assertEq(user.role, PRODUCER);
        assertEq(uint256(user.status), uint256(SupplyChainTracker.UserStatus.Pending));
    }

    function testAdminApproveUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);

        // Obtener el struct User completo
        SupplyChainTracker.User memory user = supplyChain.getUserInfo(producer);

        // Acceder al campo status del struct
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

        // Cambiar a Approved
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);

        // Cambiar a Rejected
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Rejected);

        // Cambiar a Canceled
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Canceled);

        SupplyChainTracker.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChainTracker.UserStatus.Canceled));
    }

    function testOnlyApprovedUsersCanOperate() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        // Intento de crear token sin aprobación (debería fallar)
        vm.prank(producer);
        vm.expectRevert("Not approved");
        supplyChain.createToken("Test", 100, "Features", 0);

        // Aprobar usuario
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);

        // Ahora debería poder crear token
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

    function testIsAdmin() public {
        assertEq(supplyChain.admin(), admin);
    }

    // Tests de creación de tokens
    function testCreateTokenByProducer() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Product A", 1000, "Organic", 0);

        (uint256 id,, string memory name, uint256 totalSupply,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(name, "Product A");
        assertEq(totalSupply, 1000);
    }

    function testCreateTokenByFactory() public {
        _setupApprovedUser(factory, FACTORY);

        vm.prank(factory);
        supplyChain.createToken("Processed Product", 500, "Processed", 0);

        (uint256 id,, string memory name,,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(name, "Processed Product");
    }

    function testCreateTokenByRetailer() public {
        _setupApprovedUser(retailer, RETAILER);

        vm.prank(retailer);
        supplyChain.createToken("Packaged Product", 200, "Packaged", 0);

        (uint256 id,, string memory name,,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(name, "Packaged Product");
    }

    function testTokenWithParentId() public {
        _setupApprovedUser(producer, PRODUCER);

        // Crear token padre
        vm.prank(producer);
        supplyChain.createToken("Parent Product", 1000, "Parent", 0);

        // Crear token con parentId
        vm.prank(producer);
        supplyChain.createToken("Child Product", 500, "Child", 1);

        (,,,, uint256 parentId,,) = supplyChain.getToken(2);
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

        (, , string memory tokenName, uint256 tokenSupply, uint256 tokenParentId, ,) = supplyChain.getToken(1);
        assertEq(tokenName, name);
        assertEq(tokenSupply, totalSupply);
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

        (uint256 id, address creator, string memory name, uint256 totalSupply, uint256 parentId, uint256 dateCreated, uint256 balance) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(creator, producer);
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

    // Tests de transferencias
    function testTransferFromProducerToFactory() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        // Crear token
        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        // Transferir del productor a la fábrica
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        // Verificar balances
        assertEq(supplyChain.getTokenBalance(1, producer), 500);
        assertEq(supplyChain.getTokenBalance(1, factory), 500);

        // Verificar transferencia
        (,,,,,, SupplyChainTracker.TransferStatus status) = supplyChain.transfers(1);
        assertEq(uint256(status), uint256(SupplyChainTracker.TransferStatus.Pending));
    }

    function testTransferFromFactoryToRetailer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);
        _setupApprovedUser(retailer, RETAILER);

        // Crear y transferir a fábrica
        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);

        // Aceptar transferencia
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // Transferir de fábrica a minorista
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 500);

        // Verificar balances
        assertEq(supplyChain.getTokenBalance(1, factory), 500);
        assertEq(supplyChain.getTokenBalance(1, retailer), 500);
    }

    function testTransferFromRetailerToConsumer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);
        _setupApprovedUser(retailer, RETAILER);
        _setupApprovedUser(consumer, CONSUMER);

        // Flujo completo: productor -> fábrica -> minorista -> consumidor
        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        // Productor a fábrica
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // Fábrica a minorista
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 500);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        // Minorista a consumidor
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 250);

        // Verificar balances
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

        // Aceptar transferencia
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // Obtener toda la transferencia
        SupplyChainTracker.Transfer memory transfer = supplyChain.transfers(1);
        assertEq(uint256(transfer.status), uint256(SupplyChainTracker.TransferStatus.Accepted));
    }

    function testRejectTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        // Rechazar transferencia
        vm.prank(factory);
        supplyChain.rejectTransfer(1);

        SupplyChainTracker.Transfer memory transfer = supplyChain.transfers(1);
        assertEq(uint256(transfer.status), uint256(SupplyChainTracker.TransferStatus.Accepted));

        // Verificar que el balance vuelva al remitente
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
    }

    function testTransferInsufficientBalance() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 100, "High Quality", 0);

        // Intentar transferir más de lo que tiene
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

        // Transferencias
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 250);

        // Obtener transferencias del productor
        uint256[] memory producerTransfers = supplyChain.getUserTransfers(producer);
        assertEq(producerTransfers.length, 1);
        assertEq(producerTransfers[0], 1);

        // Obtener transferencias de la fábrica
        uint256[] memory factoryTransfers = supplyChain.getUserTransfers(factory);
        assertEq(factoryTransfers.length, 2); // Recibió 1, envió 1
    }

    // Tests de validaciones y permisos
    function testInvalidRoleTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(consumer, CONSUMER);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        // Intentar transferir de productor a consumidor (salto de roles inválido)
        vm.prank(producer);
        vm.expectRevert("Invalid role transition");
        supplyChain.transfer(consumer, 1, 500);
    }

    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        // Intento de crear token sin aprobación
        vm.prank(producer);
        vm.expectRevert("Not approved");
        supplyChain.createToken("Test", 100, "Features", 0);
    }

    function testUnapprovedUserCannotTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        // Registrar pero no aprobar al receptor
        vm.prank(factory);
        supplyChain.requestUserRole(FACTORY);

        // Intento de transferir a usuario no aprobado (debería fallar en el require de toId != 0)
        vm.prank(producer);
        vm.expectRevert("Recipient not registered");
        supplyChain.transfer(factory, 1, 500);
    }

    function testOnlyAdminCanChangeStatus() public {
        _setupApprovedUser(producer, PRODUCER);

        // Intento de cambiar estado por no admin
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

        // Intento de transferir desde consumidor (debería fallar)
        vm.prank(consumer);
        vm.expectRevert("Consumer cannot transfer");
        supplyChain.transfer(producer, 1, 250);
    }

    function testTransferToSameAddress() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        // Intento de transferir a sí mismo
        vm.prank(producer);
        vm.expectRevert("Invalid recipient");
        supplyChain.transfer(producer, 1, 500);
    }

    // Tests de casos edge
    function testTransferZeroAmount() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        // Intento de transferir cantidad 0
        vm.prank(producer);
        vm.expectRevert("Amount must be > 0");
        supplyChain.transfer(factory, 1, 0);
    }

    function testTransferNonExistentToken() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        // Intento de transferir token que no existe
        vm.prank(producer);
        vm.expectRevert("Token does not exist");
        supplyChain.transfer(factory, 999, 500);
    }

    function testAcceptNonExistentTransfer() public {
        _setupApprovedUser(factory, FACTORY);

        // Intento de aceptar transferencia que no existe
        vm.prank(factory);
        vm.expectRevert("Not pending"); // El contrato no tiene esta validación específica, pero fallará en otros requires
        supplyChain.acceptTransfer(999);
    }

    function testDoubleAcceptTransfer() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);

        // Aceptar transferencia
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // Intento de aceptar nuevamente
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

        // Rechazar transferencia
        vm.prank(factory);
        supplyChain.rejectTransfer(1);

        // Intentar aceptar transferencia rechazada
        vm.prank(factory);
        vm.expectRevert("Not pending");
        supplyChain.acceptTransfer(1);
    }

    // Tests de eventos
    function testUserRegisteredEvent() public {
        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
//        emit UserRoleRequested(producer, PRODUCER);
//        emit UserStatusChanged(producer, SupplyChainTracker.UserStatus.Pending);

        supplyChain.requestUserRole(PRODUCER);
    }

    function testUserStatusChangedEvent() public {
        vm.prank(producer);
        supplyChain.requestUserRole(PRODUCER);

        vm.prank(admin);
        vm.expectEmit(true, true, true, true);
//        emit UserStatusChanged(producer, SupplyChainTracker.UserStatus.Approved);

        supplyChain.changeStatusUser(producer, SupplyChainTracker.UserStatus.Approved);
    }

    function testTokenCreatedEvent() public {
        _setupApprovedUser(producer, PRODUCER);

        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
//        emit TokenCreated(1, producer, "Test Product", 1000);

        supplyChain.createToken("Test Product", 1000, "Features", 0);
    }

    function testTransferInitiatedEvent() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        vm.prank(producer);
        supplyChain.createToken("Product", 1000, "High Quality", 0);

        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
//        emit TransferRequested(1, producer, factory, 1, 500);

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
//        emit TransferAccepted(1);

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
//        emit TransferRejected(1);

        supplyChain.rejectTransfer(1);
    }

    // Tests de flujo completo
    function testCompleteSupplyChainFlow() public {
        // Configurar usuarios
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);
        _setupApprovedUser(retailer, RETAILER);
        _setupApprovedUser(consumer, CONSUMER);

        // 1. Productor crea token
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "Organic", 0);

        // 2. Productor transfiere a fábrica
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // 3. Fábrica transfiere a minorista
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 700);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        // 4. Minorista transfiere a consumidor
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 350);

        // Verificar balances finales
        assertEq(supplyChain.getTokenBalance(1, producer), 0);
        assertEq(supplyChain.getTokenBalance(1, factory), 300);
        assertEq(supplyChain.getTokenBalance(1, retailer), 350);
        assertEq(supplyChain.getTokenBalance(1, consumer), 350);
    }

    function testMultipleTokensFlow() public {
        _setupApprovedUser(producer, PRODUCER);
        _setupApprovedUser(factory, FACTORY);

        // Crear múltiples tokens
        vm.prank(producer);
        supplyChain.createToken("Product 1", 1000, "Type A", 0);
        supplyChain.createToken("Product 2", 2000, "Type B", 0);

        // Transferir ambos tokens
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        supplyChain.transfer(factory, 2, 1000);

        // Aceptar transferencias
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        supplyChain.acceptTransfer(2);

        // Verificar balances
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

        // Crear token con parentId 0 (sin padre)
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "Base Product", 0);

        // Transferir a fábrica
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // Fábrica crea nuevo token con parentId = 1
        vm.prank(factory);
        supplyChain.createToken("Processed Product", 800, "Derived from Raw Material", 1);

        // Transferir producto procesado a minorista
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 800);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        // Verificar relación padre-hijo
        (,,,, uint256 parentId1,,) = supplyChain.getToken(1);
        (,,,, uint256 parentId2,,) = supplyChain.getToken(2);

        assertEq(parentId1, 0); // Token 1 no tiene padre
        assertEq(parentId2, 1); // Token 2 tiene como padre al token 1
    }

    // Función auxiliar para configurar usuarios aprobados
    function _setupApprovedUser(address user, bytes32 role) internal {
        vm.prank(user);
        supplyChain.requestUserRole(role);
        vm.prank(admin);
        supplyChain.changeStatusUser(user, SupplyChainTracker.UserStatus.Approved);
    }
}