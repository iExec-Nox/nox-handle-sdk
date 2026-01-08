import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';

/**
 * HandleClient
 *
 * A client to interact with encrypted values using Handles on blockchain
 */
export class HandleClient {
  private blockchainService: IBlockchainService;
  constructor(blockchainService: IBlockchainService) {
    this.blockchainService = blockchainService;
  }
  // TODO: remove or replace with actual methods
  // Example method to demonstrate usage of blockchainService
  async getChainId(): Promise<number> {
    return this.blockchainService.getChainId();
  }
}
