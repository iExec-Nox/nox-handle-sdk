import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import type { BaseUrl } from '../types/internalTypes.js';

export type HandleClientConfig = {
  gatewayUrl: BaseUrl;
  smartContractAddress: string;
};

/**
 * HandleClient
 *
 * A client to interact with encrypted values using Handles on blockchain
 */
export class HandleClient {
  private readonly blockchainService: IBlockchainService;
  private readonly config: HandleClientConfig;
  /**
   * Creates an instance of HandleClient.
   * @param blockchainService
   * @returns A Promise of HandleClient instance
   * @throws {TypeError} if the provided blockchainService is invalid
   */
  constructor(
    blockchainService: IBlockchainService,
    config: HandleClientConfig
  ) {
    this.blockchainService = blockchainService;
    this.config = config;
  }
  // TODO: remove or replace with actual methods
  // Example method to demonstrate usage of blockchainService
  async getChainId(): Promise<number> {
    return this.blockchainService.getChainId();
  }

  /**
   * Gets the Handle smart contract address
   */
  getSmartContractAddress(): string {
    return this.config.smartContractAddress;
  }

  /**
   * Gets the Gateway TEE service URL
   */
  getGatewayUrl(): BaseUrl {
    return this.config.gatewayUrl;
  }
}
