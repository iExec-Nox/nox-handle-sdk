import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';

export type HandleClientConfig = {
  gatewayUrl: string;
  smartContractAddress: string;
};

/**
 * HandleClient
 *
 * A client to interact with encrypted values using Handles on blockchain
 */
export class HandleClient {
  // TODO: Remove @ts-expect-error when properties are used
  // @ts-expect-error Property will be used in upcoming PR
  private readonly blockchainService: IBlockchainService;
  // @ts-expect-error Property will be used in upcoming PR
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
}
