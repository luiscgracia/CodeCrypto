export const CONTRACT_CONFIG = {
  address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  abi: [
    // events
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "user", type: "address" },
        { indexed: false, internalType: "string", name: "role", type: "string" }
      ],
      name: "UserRoleRequested",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "user", type: "address" },
        { indexed: false, internalType: "uint8", name: "status", type: "uint8" }
      ],
      name: "UserStatusChanged",
      type: "event"
    },
    // getUserInfo(address) returns (User memory)
    {
      inputs: [{ internalType: "address", name: "userAddress", type: "address" }],
      name: "getUserInfo",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "userAddress", type: "address" },
            { internalType: "string", name: "role", type: "string" },
            { internalType: "enum SupplyChain.UserStatus", name: "status", type: "uint8" }
          ],
          internalType: "struct SupplyChain.User",
          name: "",
          type: "tuple"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    // isAdmin(address) returns (bool)
    {
      inputs: [{ internalType: "address", name: "userAddress", type: "address" }],
      name: "isAdmin",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function"
    },
    // getPendingUsers() returns address[]
    {
      inputs: [],
      name: "getPendingUsers",
      outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
      stateMutability: "view",
      type: "function"
    },
    // tokens(uint256) returns token fields (auto-generated getter, excludes mapping)
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "tokens",
      outputs: [
        { internalType: "uint256", name: "id", type: "uint256" },
        { internalType: "address", name: "creator", type: "address" },
        { internalType: "string", name: "name", type: "string" },
        { internalType: "uint256", name: "totalSupply", type: "uint256" },
        { internalType: "string", name: "features", type: "string" },
        { internalType: "uint256", name: "parentId", type: "uint256" },
        { internalType: "uint256", name: "dateCreated", type: "uint256" }
      ],
      stateMutability: "view",
      type: "function"
    },
    // getTokenBalance(uint256,address) returns (uint256)
    {
      inputs: [
        { internalType: "uint256", name: "tokenId", type: "uint256" },
        { internalType: "address", name: "userAddress", type: "address" }
      ],
      name: "getTokenBalance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function"
    },
    // transfer(address,uint256,uint256)
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "tokenId", type: "uint256" },
        { internalType: "uint256", name: "amount", type: "uint256" }
      ],
      name: "transfer",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    // acceptTransfer(uint256)
    {
      inputs: [{ internalType: "uint256", name: "transferId", type: "uint256" }],
      name: "acceptTransfer",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    // rejectTransfer(uint256)
    {
      inputs: [{ internalType: "uint256", name: "transferId", type: "uint256" }],
      name: "rejectTransfer",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    // cancelTransfer(uint256)
    {
      inputs: [{ internalType: "uint256", name: "transferId", type: "uint256" }],
      name: "cancelTransfer",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    // getUserTokens(address) returns (uint256[])
    {
      inputs: [{ internalType: "address", name: "user", type: "address" }],
      name: "getUserTokens",
      outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
      stateMutability: "view",
      type: "function"
    },
    // getUserTransfers(address) returns (uint[])
    {
      inputs: [{ internalType: "address", name: "userAddress", type: "address" }],
      name: "getUserTransfers",
      outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
      stateMutability: "view",
      type: "function"
    },
    // getTransfer(uint256) returns (Transfer memory)
    {
      inputs: [{ internalType: "uint256", name: "transferId", type: "uint256" }],
      name: "getTransfer",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "uint256", name: "dateCreated", type: "uint256" },
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "enum SupplyChain.TransferStatus", name: "status", type: "uint8" }
          ],
          internalType: "struct SupplyChain.Transfer",
          name: "",
          type: "tuple"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    // createToken(string,uint256,string,uint256)
    {
      inputs: [
        { internalType: "string", name: "name", type: "string" },
        { internalType: "uint256", name: "totalSupply", type: "uint256" },
        { internalType: "string", name: "features", type: "string" },
        { internalType: "uint256", name: "parentId", type: "uint256" }
      ],
      name: "createToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    // requestUserRole(string)
    {
      inputs: [{ internalType: "string", name: "role", type: "string" }],
      name: "requestUserRole",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    // changeStatusUser(address,uint8)
    {
      inputs: [
        { internalType: "address", name: "userAddress", type: "address" },
        { internalType: "uint8", name: "newStatus", type: "uint8" }
      ],
      name: "changeStatusUser",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};
