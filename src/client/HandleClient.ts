import { encryptInput } from '../methods/encryptInput.js';
import type { IApiService } from '../services/api/IApiService.js';
import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import type {
  BaseUrl,
  EncryptInputResult,
  EthereumAddress,
} from '../types/internalTypes.js';
import type { JsValue, SolidityType } from '../utils/types.js';

export interface HandleClientConfig {
  gatewayUrl: BaseUrl;
  smartContractAddress: EthereumAddress;
}

export interface HandleClientDependencies {
  blockchainService: IBlockchainService;
  apiService: IApiService;
  config: HandleClientConfig;
}

/**
 * A client to interact with encrypted values using Handles on blockchain
 */
export class HandleClient {
  private readonly blockchainService: IBlockchainService;
  private readonly apiService: IApiService;
  private readonly config: HandleClientConfig;

  /**
   * Creates an instance of HandleClient.
   * @param dependencies - The client dependencies
   * @param dependencies.blockchainService - Service to interact with the blockchain
   * @param dependencies.apiService - Service to call the gateway API
   * @param dependencies.config - Configuration with gateway URL and contract address
   */
  constructor({
    blockchainService,
    apiService,
    config,
  }: HandleClientDependencies) {
    this.blockchainService = blockchainService;
    this.apiService = apiService;
    this.config = config;
  }

  /**
   * Encrypts a value and returns a handle for use in smart contracts.
   *
   * @param value - The value to encrypt (boolean, string, or bigint)
   * @param solidityType - The Solidity type of the value
   * @returns Handle and handleProof for smart contract usage
   *
   * @example
   * ```typescript
   * // Encrypt a uint256
   * const { handle, handleProof } = await client.encryptInput(1000000n, 'uint256');
   *
   * // Encrypt a boolean
   * const { handle, handleProof } = await client.encryptInput(true, 'bool');
   * ```
   */
  async encryptInput(
    value: JsValue<SolidityType>,
    solidityType: SolidityType
  ): Promise<EncryptInputResult> {
    return encryptInput({
      blockchainService: this.blockchainService,
      apiService: this.apiService,
      smartContractAddress: this.config.smartContractAddress,
      value,
      solidityType,
    });
  }
}
