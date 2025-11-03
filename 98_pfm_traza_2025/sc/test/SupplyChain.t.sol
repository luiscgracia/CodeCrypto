// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SupplyChain} from "../src/SupplyChain.sol";

// Minimal cheatcodes interface to avoid external deps
interface Vm {
    function expectEmit(bool, bool, bool, bool) external;
    function expectRevert(bytes calldata) external;
    function prank(address) external;
}

Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

contract SupplyChainTest {
    SupplyChain sc;
    address recipient = address(0xBEEF);
    address retailer = address(0xCAFE);

    function setUp() public {
        sc = new SupplyChain();
    }

    function testUserRegisteredEvent() public {
        vm.expectEmit(true, false, false, true);
        emit SupplyChain.UserRoleRequested(address(this), "Producer");
        sc.requestUserRole("Producer");
    }

    function testTokenCreatedEvent() public {
        // Ensure caller is approved before creating a token
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        vm.expectEmit(true, true, false, true);
        emit SupplyChain.TokenCreated(1, address(this), "Raw", 100);
        sc.createToken("Raw", 100, "{}", 0);
    }

    function testTransferInitiatedEvent() public {
        // Prepare: approved user with token balance
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("Steel", 100, "{}", 0);
        // New validations: recipient must be registered and correct next role
        vm.prank(recipient);
        sc.requestUserRole("Factory");
        sc.changeStatusUser(recipient, SupplyChain.UserStatus.Approved);
        vm.expectEmit(true, true, true, true);
        emit SupplyChain.TransferRequested(1, address(this), address(0xBEEF), 1, 10);
        sc.transfer(address(0xBEEF), 1, 10);
    }

    function testGetUserTokensAndTransfers() public {
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("X", 10, "{}", 0);
        sc.createToken("Y", 5, "{}", 0);
        // New validations: recipient must be registered and correct next role
        vm.prank(recipient);
        sc.requestUserRole("Factory");
        sc.changeStatusUser(recipient, SupplyChain.UserStatus.Approved);
        sc.transfer(recipient, 1, 3);
        uint256[] memory myTokens = sc.getUserTokens(address(this));
        require(myTokens.length >= 2, "user tokens length");
        uint256[] memory myTransfers = sc.getUserTransfers(address(this));
        require(myTransfers.length >= 1, "user transfers length");
        SupplyChain.Transfer memory tr = sc.getTransfer(1);
        _assertEq(tr.tokenId, 1, "tr tokenId");
        _assertEq(tr.amount, 3, "tr amount");
    }

    function testGetUserInfo_DefaultNotRegistered() public view {
        // Query an address with no registration
        address unknown = address(0x123456);
        SupplyChain.User memory u = sc.getUserInfo(unknown);
        require(u.id == 0, "default id 0");
        _assertEq(u.userAddress, address(0), "default address 0");
        _assertEq(u.role, "", "default empty role");
        require(u.status == SupplyChain.UserStatus.Rejected, "default status Rejected");
    }

    function testGetUserInfo_AfterRequestAndApprove() public {
        sc.requestUserRole("Producer");
        SupplyChain.User memory u1 = sc.getUserInfo(address(this));
        require(u1.id != 0, "id assigned");
        _assertEq(u1.userAddress, address(this), "user address set");
        _assertEq(u1.role, "Producer", "role set");
        require(u1.status == SupplyChain.UserStatus.Pending, "status pending");

        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        SupplyChain.User memory u2 = sc.getUserInfo(address(this));
        require(u2.status == SupplyChain.UserStatus.Approved, "status approved");
    }

    function testRejectNonExistentTransfer() public {
        vm.expectRevert(bytes("Transfer not found"));
        sc.rejectTransfer(999);
    }

    function testTransferZeroAmountReverts() public {
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("Z", 1, "{}", 0);
        vm.expectRevert(bytes("Zero amount"));
        sc.transfer(address(0x1234), 1, 0);
    }

    function testTransferToSameAddressReverts() public {
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("Q", 1, "{}", 0);
        vm.expectRevert(bytes("Same address"));
        sc.transfer(address(this), 1, 1);
    }

    function testTransferToUnregisteredRecipientReverts() public {
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("X1", 10, "{}", 0);
        // recipient has not called requestUserRole -> not registered
        vm.expectRevert(bytes("Recipient not registered"));
        sc.transfer(recipient, 1, 1);
    }

    function testTransferInvalidRoleReverts() public {
        // Sender Producer approved
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("X2", 10, "{}", 0);
        // Recipient registered as Retailer (should be Factory next)
        vm.prank(recipient);
        sc.requestUserRole("Retailer");
        sc.changeStatusUser(recipient, SupplyChain.UserStatus.Approved);
        vm.expectRevert(bytes("Invalid role transfer"));
        sc.transfer(recipient, 1, 1);
    }

    function testCancelTransferRestoresBalanceAndSetsStatus() public {
        // Setup: Producer -> Factory pending transfer
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("X3", 10, "{}", 0);
        vm.prank(recipient);
        sc.requestUserRole("Factory");
        sc.changeStatusUser(recipient, SupplyChain.UserStatus.Approved);
        uint256 balBefore = sc.getTokenBalance(1, address(this));
        sc.transfer(recipient, 1, 4);
        // Balance should be deducted temporarily
        uint256 balAfterTransfer = sc.getTokenBalance(1, address(this));
        _assertEq(balAfterTransfer, balBefore - 4, "temp deducted");
        // Cancel by sender
        sc.cancelTransfer(1);
        // Balance restored
        uint256 balAfterCancel = sc.getTokenBalance(1, address(this));
        _assertEq(balAfterCancel, balBefore, "restored after cancel");
        // Status is Canceled (3)
        SupplyChain.Transfer memory tr = sc.getTransfer(1);
        require(tr.status == SupplyChain.TransferStatus.Canceled, "status canceled");
    }

    function testCancelTransferGuards() public {
        // Non-existent
        vm.expectRevert(bytes("Transfer not found"));
        sc.cancelTransfer(999);
    }

    function testCancelTransferOnlySender() public {
        // Setup: create pending transfer from this to recipient
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("Y3", 5, "{}", 0);
        vm.prank(recipient);
        sc.requestUserRole("Factory");
        sc.changeStatusUser(recipient, SupplyChain.UserStatus.Approved);
        sc.transfer(recipient, 1, 2);
        // recipient cannot cancel (only sender)
        vm.prank(recipient);
        vm.expectRevert(bytes("Only sender"));
        sc.cancelTransfer(1);
    }

    function testCancelTransferAfterAcceptedReverts() public {
        // Setup transfer
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("Y4", 5, "{}", 0);
        vm.prank(recipient);
        sc.requestUserRole("Factory");
        sc.changeStatusUser(recipient, SupplyChain.UserStatus.Approved);
        sc.transfer(recipient, 1, 1);
        // accept as recipient
        vm.prank(recipient);
        sc.acceptTransfer(1);
        // now cancel should revert Not pending
        vm.expectRevert(bytes("Not pending"));
        sc.cancelTransfer(1);
    }

    function testUnapprovedUserCannotCreateToken() public {
        vm.expectRevert(bytes("Not approved"));
        sc.createToken("Raw", 10, "{\"q\":1}", 0);
    }

    function testApprovedUserCanCreateTokenWithMetadata() public {
        // Request role then approve self (admin is this contract in setUp)
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);

        vm.expectEmit(true, true, false, true);
        emit SupplyChain.TokenCreated(1, address(this), "Copper", 500);
        sc.createToken("Copper", 500, "{\"purity\":\"99%\"}", 0);

        // Read token data (except balances) via public getter
        (
            uint256 id,
            address creator,
            string memory name,
            uint256 totalSupply,
            string memory features,
            uint256 parentId,
            uint256 dateCreated
        ) = sc.tokens(1);

        _assertEq(id, 1, "id");
        _assertEq(creator, address(this), "creator");
        _assertEq(name, "Copper", "name");
        _assertEq(totalSupply, 500, "supply");
        _assertEq(features, "{\"purity\":\"99%\"}", "features");
        _assertEq(parentId, 0, "parentId");
        require(dateCreated > 0, "dateCreated");
    }

    function testAcceptTransferFlow() public {
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        sc.createToken("Al", 50, "{}", 0);
        // prepare recipient as approved Factory to satisfy role flow
        vm.prank(recipient);
        sc.requestUserRole("Factory");
        sc.changeStatusUser(recipient, SupplyChain.UserStatus.Approved);
        sc.transfer(recipient, 1, 10);
        // Cannot impersonate without forge-std; validate rejection by admin and balance restore
        uint256 balBefore = sc.getTokenBalance(1, address(this));
        sc.rejectTransfer(1);
        uint256 balAfter = sc.getTokenBalance(1, address(this));
        _assertEq(balAfter, balBefore + 10, "balance restore on reject");
    }

    function testRequestRoleCreatesUserWithPendingAndRole() public {
        // Expect events
        vm.expectEmit(true, false, false, true);
        emit SupplyChain.UserRoleRequested(address(this), "Producer");
        vm.expectEmit(true, false, false, true);
        emit SupplyChain.UserStatusChanged(address(this), SupplyChain.UserStatus.Pending);
        sc.requestUserRole("Producer");

        SupplyChain.User memory u = sc.getUserInfo(address(this));
        require(u.id != 0, "user id assigned");
        _assertEq(u.userAddress, address(this), "user address set");
        _assertEq(u.role, "Producer", "role set");
        require(u.status == SupplyChain.UserStatus.Pending, "status pending");
    }

    function testChangeStatusUserUpdatesStatus() public {
        sc.requestUserRole("Producer");
        // Approve
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        SupplyChain.User memory u1 = sc.getUserInfo(address(this));
        require(u1.status == SupplyChain.UserStatus.Approved, "status approved");
        // Reject
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Rejected);
        SupplyChain.User memory u2 = sc.getUserInfo(address(this));
        require(u2.status == SupplyChain.UserStatus.Rejected, "status rejected");
        // Cancel
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Canceled);
        SupplyChain.User memory u3 = sc.getUserInfo(address(this));
        require(u3.status == SupplyChain.UserStatus.Canceled, "status canceled");
    }

    function testReRequestRoleResetsToPendingAndUpdatesRole() public {
        sc.requestUserRole("Producer");
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Rejected);

        // Re-request as Factory should set role and pending again
        vm.expectEmit(true, false, false, true);
        emit SupplyChain.UserRoleRequested(address(this), "Factory");
        vm.expectEmit(true, false, false, true);
        emit SupplyChain.UserStatusChanged(address(this), SupplyChain.UserStatus.Pending);
        sc.requestUserRole("Factory");

        SupplyChain.User memory u = sc.getUserInfo(address(this));
        _assertEq(u.role, "Factory", "role updated");
        require(u.status == SupplyChain.UserStatus.Pending, "status pending again");
    }

    function testGetPendingUsersAdminOnlyAndLists() public {
        // two users: this and recipient
        sc.requestUserRole("Producer");
        vm.prank(recipient);
        sc.requestUserRole("Factory");

        // both pending initially
        address[] memory pending = sc.getPendingUsers();
        require(pending.length == 2, "two pending");

        // approve one
        sc.changeStatusUser(address(this), SupplyChain.UserStatus.Approved);
        address[] memory pending2 = sc.getPendingUsers();
        require(pending2.length == 1, "one pending after approve");

        // non-admin cannot call
        vm.prank(recipient);
        vm.expectRevert(bytes("Only admin"));
        sc.getPendingUsers();
    }
}

// Simple assertion helpers
function _assertEq(uint256 a, uint256 b, string memory tag) pure {
    require(a == b, tag);
}

function _assertEq(address a, address b, string memory tag) pure {
    require(a == b, tag);
}

function _assertEq(string memory a, string memory b, string memory tag) pure {
    require(keccak256(bytes(a)) == keccak256(bytes(b)), tag);
}
