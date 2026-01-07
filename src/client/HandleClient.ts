import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';

export class HandleClient {
  private blockchainService: IBlockchainService;
  constructor(blockchainService: IBlockchainService) {
    this.blockchainService = blockchainService;
  }
  async getChainId(): Promise<number> {
    return this.blockchainService.getChainId();
  }
}
