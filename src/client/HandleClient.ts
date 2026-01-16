import { encryptInput } from '../methods/encryptInput.js';
import type { IApiService } from '../services/api/IApiService.js';
import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import type {
  EncryptInputResult,
  InputValue,
  SolidityType,
} from '../types/internalTypes.js';

export type BaseUrl = `http${'' | 's'}://${string}`;

export type HandleClientConfig = {
  gatewayUrl: BaseUrl;
  smartContractAddress: `0x${string}`;
};

/**
 * HandleClient
 *
 * A client to interact with encrypted values using Handles on blockchain
 */
export class HandleClient {
  private readonly blockchainService: IBlockchainService;
  private readonly apiService: IApiService;
  private readonly config: HandleClientConfig;

  /**
   * Creates an instance of HandleClient.
   * @param blockchainService - Service to interact with the blockchain
   * @param apiService - Service to call the gateway API
   * @param config - Configuration with gateway URL and contract address
   */
  constructor(
    blockchainService: IBlockchainService,
    apiService: IApiService,
    config: HandleClientConfig
  ) {
    this.blockchainService = blockchainService;
    this.apiService = apiService;
    this.config = config;
  }

  /**
   * Encrypts a value and returns a handle for use in smart contracts.
   *
   * @param value - The value to encrypt (boolean, string, or bigint)
   * @param solidityType - The Solidity type of the value
   * @returns Handle and inputProof for smart contract usage
   *
   * @example
   * ```typescript
   * // Encrypt a uint256
   * const { handle, inputProof } = await client.encryptInput(1000000n, 'uint256');
   *
   * // Encrypt a boolean
   * const { handle, inputProof } = await client.encryptInput(true, 'bool');
   * ```
   */
  async encryptInput(
    value: InputValue,
    solidityType: SolidityType
  ): Promise<EncryptInputResult> {
    return encryptInput(
      this.blockchainService,
      this.apiService,
      value,
      solidityType
    );
  }
}
