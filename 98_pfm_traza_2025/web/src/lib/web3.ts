import { ethers } from "ethers";
import { CONTRACT_CONFIG } from "@/src/contracts/config";

export type UserInfo = {
  id: bigint;
  userAddress: string;
  role: string;
  status: number;
};

export class Web3Service {
  private provider: ethers.BrowserProvider | null;
  constructor(provider: ethers.BrowserProvider | null) {
    this.provider = provider;
  }

  // Read-only contract instance using current provider.
  // Note: functions that mutate state require a signer; see methods below using getSigner().
  private getContract() {
    if (!this.provider) throw new Error("No provider");
    if (!CONTRACT_CONFIG.address || CONTRACT_CONFIG.address === "0x0000000000000000000000000000000000000000")
      throw new Error("Contract address not configured");
    return new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, this.provider);
  }

  async getUserInfo(address: string): Promise<UserInfo> {
    // Returns the on-chain struct cast to a friendlier shape
    console.log("Web3Service.getUserInfo called for:", address);
    const c = this.getContract();
    console.log("Contract instance created, calling getUserInfo...");
    const res = await c.getUserInfo(address);
    console.log("Contract getUserInfo raw response:", res);
    return {
      id: res.id as bigint,
      userAddress: res.userAddress as string,
      role: res.role as string,
      status: Number(res.status)
    };
  }

  async isAdmin(address: string): Promise<boolean> {
    const c = this.getContract();
    return await c.isAdmin(address);
  }

  async getPendingUsers(): Promise<string[]> {
    // Admin-only call; requires signer to pass msg.sender checks where relevant
    if (!this.provider) throw new Error("No provider");
    const signer = await this.provider.getSigner();
    const c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
    const addrs: string[] = await c.getPendingUsers();
    return addrs;
  }

  async requestUserRole(role: string): Promise<void> {
    // Writes to chain; must be sent from the connected account
    if (!this.provider) throw new Error("No provider");
    const signer = await this.provider.getSigner();
    const c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
    const tx = await c.requestUserRole(role);
    await tx.wait?.();
  }

  async changeStatusUser(userAddress: string, status: number) {
    // Admin action to change user status
    if (!this.provider) throw new Error("No provider");
    const signer = await this.provider.getSigner();
    const c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
    const tx = await c.changeStatusUser(userAddress, status);
    const receipt = await tx.wait?.();
    return receipt ?? null;
  }

  async createToken(name: string, totalSupply: number, features: string, parentId: number): Promise<void> {
    // totalSupply and parentId are passed as BigInt to match uint256
    if (!this.provider) throw new Error("No provider");
    const signer = await this.provider.getSigner();
    const c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
    const tx = await c.createToken(name, BigInt(totalSupply), features, BigInt(parentId));
    await tx.wait?.();
  }

  async transfer(to: string, tokenId: number, amount: number): Promise<void> {
    // Creates a pending transfer and temporarily deducts sender balance until finalized
    if (!this.provider) throw new Error("No provider");
    const signer = await this.provider.getSigner();
    const c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
    const tx = await c.transfer(to, BigInt(tokenId), BigInt(amount));
    await tx.wait?.();
  }

  async acceptTransfer(transferId: number): Promise<void> {
    // Recipient-only action to finalize and credit balance
    if (!this.provider) throw new Error("No provider");
    const signer = await this.provider.getSigner();
    const c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
    const tx = await c.acceptTransfer(BigInt(transferId));
    await tx.wait?.();
  }

  async rejectTransfer(transferId: number): Promise<void> {
    // Recipient or admin can reject; restores sender balance
    if (!this.provider) throw new Error("No provider");
    const signer = await this.provider.getSigner();
    const c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
    const tx = await c.rejectTransfer(BigInt(transferId));
    await tx.wait?.();
  }

  async cancelTransfer(transferId: number): Promise<void> {
    // Sender can cancel their own pending transfer
    if (!this.provider) throw new Error("No provider");
    const signer = await this.provider.getSigner();
    const c = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
    const tx = await c.cancelTransfer(BigInt(transferId));
    await tx.wait?.();
  }

  async getUserTransfers(address: string): Promise<bigint[]> {
    const c = this.getContract();
    const ids: bigint[] = await c.getUserTransfers(address);
    return ids;
  }

  async getTransfer(transferId: number) {
    const c = this.getContract();
    return await c.getTransfer(BigInt(transferId));
  }

  async getToken(tokenId: number) {
    const c = this.getContract();
    return await c.tokens(BigInt(tokenId));
  }

  async getTokenBalance(tokenId: number, userAddress: string): Promise<bigint> {
    const c = this.getContract();
    const bal: bigint = await c.getTokenBalance(BigInt(tokenId), userAddress);
    return bal;
  }

  async getUserTokens(address: string): Promise<bigint[]> {
    const c = this.getContract();
    const ids: bigint[] = await c.getUserTokens(address);
    return ids;
  }

  // Events helpers
  async getRecentRoleRequests(lastNBlocks: number = 5000) {
    // Scans logs client-side using the provider; no contract call needed
    if (!this.provider) throw new Error("No provider");
    const toBlock = await this.provider.getBlockNumber();
    const fromBlock = Math.max(0, toBlock - lastNBlocks);

    const iface = new ethers.Interface([
      "event UserRoleRequested(address indexed user, string role)"
    ]);
    const topic0 = ethers.id("UserRoleRequested(address,string)");

    const logs = await this.provider.getLogs({
      address: CONTRACT_CONFIG.address,
      fromBlock,
      toBlock,
      topics: [topic0]
    });

    const items = logs.map((log) => {
      const parsed = iface.parseLog(log);
      if (!parsed) return null;
      const user = parsed.args[0] as string;
      const role = parsed.args[1] as string;
      return {
        user,
        role,
        txHash: log.transactionHash,
        blockNumber: Number(log.blockNumber)
      };
    }).filter((x): x is { user: string; role: string; txHash: string; blockNumber: number } => Boolean(x));

    return items;
  }

  async getLastUserStatusChange(user: string, lastNBlocks: number = 5000) {
    // Reads the last status change event for a specific user via indexed topics
    if (!this.provider) throw new Error("No provider");
    const toBlock = await this.provider.getBlockNumber();
    const fromBlock = Math.max(0, toBlock - lastNBlocks);
    const iface = new ethers.Interface([
      "event UserStatusChanged(address indexed user, uint8 status)"
    ]);
    const topic0 = ethers.id("UserStatusChanged(address,uint8)");
    const userTopic = ethers.zeroPadValue(user, 32); // indexed address topic
    const logs = await this.provider.getLogs({
      address: CONTRACT_CONFIG.address,
      fromBlock,
      toBlock,
      topics: [topic0, userTopic]
    });
    if (logs.length === 0) return null;
    const last = logs[logs.length - 1];
    const parsed = iface.parseLog(last);
    if (!parsed) return null;
    const status = Number(parsed.args[1]);
    return { status, blockNumber: Number(last.blockNumber), txHash: last.transactionHash };
  }
}
