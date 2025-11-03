// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SupplyChain {
    // User lifecycle for registration and authorization within the app
    enum UserStatus {
        Pending,
        Approved,
        Rejected,
        Canceled
    }

    // Transfer lifecycle for token movements requiring recipient action
    enum TransferStatus {
        Pending,
        Accepted,
        Rejected,
        Canceled
    }

    struct Token {
        uint256 id;
        address creator;
        string name;
        uint256 totalSupply;
        string features; // JSON string with token metadata
        uint256 parentId;
        uint256 dateCreated;
        // Per-address balances for this token id
        mapping(address => uint256) balance;
    }

    struct Transfer {
        uint256 id;
        address from;
        address to;
        uint256 tokenId;
        uint256 dateCreated;
        uint256 amount;
        TransferStatus status;
    }

    struct User {
        uint256 id;
        address userAddress;
        string role;
        UserStatus status;
    }

    address public admin;
    uint256 public nextTokenId = 1;
    uint256 public nextTransferId = 1;
    uint256 public nextUserId = 1;

    mapping(uint256 => Token) public tokens;
    mapping(uint256 => Transfer) public transfers;
    mapping(uint256 => User) public users;
    // Reverse index to find user by EOA address (0 means not registered)
    mapping(address => uint256) public addressToUserId;

    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply);
    event TransferRequested(
        uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount
    );
    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    event TransferCanceled(uint256 indexed transferId);
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, UserStatus status);

    constructor() {
        admin = msg.sender;
    }

    // Register or re-request a user role. Re-requests reset status to Pending.
    function requestUserRole(string memory role) public {
        uint256 existingId = addressToUserId[msg.sender];
        if (existingId == 0) {
            uint256 newId = nextUserId;
            nextUserId = newId + 1;
            users[newId] = User({id: newId, userAddress: msg.sender, role: role, status: UserStatus.Pending});
            addressToUserId[msg.sender] = newId;
        } else {
            User storage u = users[existingId];
            u.role = role;
            u.status = UserStatus.Pending;
        }
        emit UserRoleRequested(msg.sender, role);
        emit UserStatusChanged(msg.sender, UserStatus.Pending);
    }

    // Admin-only: update user status (approve/reject/cancel)
    function changeStatusUser(address userAddress, UserStatus newStatus) public {
        require(msg.sender == admin, "Only admin");
        uint256 uid = addressToUserId[userAddress];
        require(uid != 0, "User not found");
        users[uid].status = newStatus;
        emit UserStatusChanged(userAddress, newStatus);
    }

    // Returns user info; non-registered addresses return a zeroed struct with Rejected status
    function getUserInfo(address userAddress) public view returns (User memory) {
        uint256 uid = addressToUserId[userAddress];
        if (uid == 0) {
            return User({id: 0, userAddress: address(0), role: "", status: UserStatus.Rejected});
        }
        return users[uid];
    }

    // Stateless helper for UI gating
    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }

    // Admin-only: enumerate addresses with Pending status
    function getPendingUsers() public view returns (address[] memory) {
        require(msg.sender == admin, "Only admin");
        uint256 total = nextUserId - 1;
        uint256 count = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (users[i].status == UserStatus.Pending) {
                count++;
            }
        }
        address[] memory addrs = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (users[i].status == UserStatus.Pending) {
                addrs[idx++] = users[i].userAddress;
            }
        }
        return addrs;
    }

    // Create a new token. Only Approved users can create. Initial balance is minted to creator.
    function createToken(string memory name, uint256 totalSupply, string memory features, uint256 parentId) public {
        uint256 uid = addressToUserId[msg.sender];
        require(uid != 0 && users[uid].status == UserStatus.Approved, "Not approved");
        uint256 newId = nextTokenId;
        nextTokenId = newId + 1;
        Token storage t = tokens[newId];
        t.id = newId;
        t.creator = msg.sender;
        t.name = name;
        t.totalSupply = totalSupply;
        t.features = features;
        t.parentId = parentId;
        t.dateCreated = block.timestamp;
        t.balance[msg.sender] = totalSupply;
        emit TokenCreated(newId, msg.sender, name, totalSupply);
    }

    // Initiate a transfer request. Deducts sender balance temporarily until accepted/rejected.
    function transfer(address to, uint256 tokenId, uint256 amount) public {
        require(to != address(0), "Invalid to");
        require(to != msg.sender, "Same address");
        require(amount > 0, "Zero amount");
        uint256 uid = addressToUserId[msg.sender];
        require(uid != 0 && users[uid].status == UserStatus.Approved, "Not approved");
        require(tokenId > 0 && tokenId < nextTokenId, "Token not found");
        // Consumer cannot initiate transfers further in the chain
        require(!_roleEq(users[uid].role, "Consumer"), "Consumer cannot transfer");
        // Recipient must be registered (has a user id)
        uint256 toId = addressToUserId[to];
        require(toId != 0, "Recipient not registered");
        // Validate role flow at creation time as well
        require(_isNextRole(users[uid].role, users[toId].role), "Invalid role transfer");

        Token storage t = tokens[tokenId];
        uint256 senderBalance = t.balance[msg.sender];
        require(senderBalance >= amount, "Insufficient balance");

        // Temporarily deduct balance until transfer is accepted or rejected
        t.balance[msg.sender] = senderBalance - amount;

        uint256 newTransferId = nextTransferId;
        nextTransferId = newTransferId + 1;
        transfers[newTransferId] = Transfer({
            id: newTransferId,
            from: msg.sender,
            to: to,
            tokenId: tokenId,
            dateCreated: block.timestamp,
            amount: amount,
            status: TransferStatus.Pending
        });

        emit TransferRequested(newTransferId, msg.sender, to, tokenId, amount);
    }

    // Recipient accepts transfer: credits balance and finalizes
    function acceptTransfer(uint256 transferId) public {
        require(transferId > 0 && transferId < nextTransferId, "Transfer not found");
        Transfer storage tr = transfers[transferId];
        require(tr.status == TransferStatus.Pending, "Not pending");
        require(msg.sender == tr.to, "Only recipient");
        uint256 fromId = addressToUserId[tr.from];
        uint256 toId = addressToUserId[tr.to];
        require(fromId != 0 && users[fromId].status == UserStatus.Approved, "From not approved");
        require(toId != 0 && users[toId].status == UserStatus.Approved, "To not approved");
        require(_isNextRole(users[fromId].role, users[toId].role), "Invalid role transfer");

        Token storage t = tokens[tr.tokenId];
        t.balance[tr.to] += tr.amount;
        tr.status = TransferStatus.Accepted;
        emit TransferAccepted(transferId);
    }

    // Recipient or admin rejects transfer: restores sender balance and finalizes
    function rejectTransfer(uint256 transferId) public {
        require(transferId > 0 && transferId < nextTransferId, "Transfer not found");
        Transfer storage tr = transfers[transferId];
        require(tr.status == TransferStatus.Pending, "Not pending");
        require(msg.sender == tr.to || msg.sender == admin, "Only recipient or admin");

        Token storage t = tokens[tr.tokenId];
        // Restore the deducted balance to sender
        t.balance[tr.from] += tr.amount;
        tr.status = TransferStatus.Rejected;
        emit TransferRejected(transferId);
    }

    // Sender cancels their pending transfer: restores balance
    function cancelTransfer(uint256 transferId) public {
        require(transferId > 0 && transferId < nextTransferId, "Transfer not found");
        Transfer storage tr = transfers[transferId];
        require(tr.status == TransferStatus.Pending, "Not pending");
        require(msg.sender == tr.from, "Only sender");

        Token storage t = tokens[tr.tokenId];
        // Restore the deducted balance to sender
        t.balance[tr.from] += tr.amount;
        tr.status = TransferStatus.Canceled;
        emit TransferCanceled(transferId);
    }

    // Read-only helpers used by the UI
    function getTokenBalance(uint256 tokenId, address user) public view returns (uint256) {
        require(tokenId > 0 && tokenId < nextTokenId, "Token not found");
        return tokens[tokenId].balance[user];
    }

    function getUserTokens(address user) public view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 total = nextTokenId - 1;
        // First pass: count tokens created or with balance
        for (uint256 i = 1; i <= total; i++) {
            Token storage t = tokens[i];
            if (t.creator == user || t.balance[user] > 0) {
                count++;
            }
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            Token storage t = tokens[i];
            if (t.creator == user || t.balance[user] > 0) {
                ids[idx++] = i;
            }
        }
        return ids;
    }

    function getUserTransfers(address user) public view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 total = nextTransferId - 1;
        for (uint256 i = 1; i <= total; i++) {
            Transfer storage tr = transfers[i];
            if (tr.from == user || tr.to == user) {
                count++;
            }
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            Transfer storage tr = transfers[i];
            if (tr.from == user || tr.to == user) {
                ids[idx++] = i;
            }
        }
        return ids;
    }

    function getTransfer(uint256 transferId) public view returns (Transfer memory) {
        require(transferId > 0 && transferId < nextTransferId, "Transfer not found");
        return transfers[transferId];
    }

    // Allowed role flow: Producer -> Factory -> Retailer -> Consumer
    function _isNextRole(string memory fromRole, string memory toRole) internal pure returns (bool) {
        bytes32 f = keccak256(abi.encodePacked(fromRole));
        bytes32 t = keccak256(abi.encodePacked(toRole));
        if (f == keccak256(abi.encodePacked("Producer")) && t == keccak256(abi.encodePacked("Factory"))) return true;
        if (f == keccak256(abi.encodePacked("Factory")) && t == keccak256(abi.encodePacked("Retailer"))) return true;
        if (f == keccak256(abi.encodePacked("Retailer")) && t == keccak256(abi.encodePacked("Consumer"))) return true;
        return false;
    }

    // String equality helper via keccak256
    function _roleEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}
