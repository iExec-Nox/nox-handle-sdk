import { decrypt } from '../methods/decrypt.js';
import { encryptInput } from '../methods/encryptInput.js';
import { publicDecrypt } from '../methods/publicDecrypt.js';
import { viewACL, type ACL } from '../methods/viewACL.js';
import type { IApiService } from '../services/api/IApiService.js';
import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import type { IStorageService } from '../services/storage/IStorageService.js';
import { InMemoryStorageService } from '../services/storage/InMemoryStorageService.js';
import type { ISubgraphService } from '../services/subgraph/SubgraphService.js';
import type {
  BaseUrl,
  EthereumAddress,
  HexString,
} from '../types/internalTypes.js';
import type { Handle, JsValue, SolidityType } from '../utils/types.js';

export interface HandleClientConfig {
  gatewayUrl: BaseUrl;
  smartContractAddress: EthereumAddress;
  subgraphUrl: BaseUrl;
}

export interface HandleClientDependencies {
  blockchainService: IBlockchainService;
  subgraphService: ISubgraphService;
  apiService: IApiService;
  storageService?: IStorageService;
  config: HandleClientConfig;
}

/**
 * A client to interact with encrypted values using Handles on blockchain
 */
export class HandleClient {
  private readonly blockchainService: IBlockchainService;
  private readonly apiService: IApiService;
  private readonly config: HandleClientConfig;
  private readonly subgraphService: ISubgraphService;
  private readonly storageService: IStorageService;

  /**
   * @ignore
   * Creates an instance of {@link HandleClient}.
   *
   * @param dependencies The client dependencies
   * @param dependencies.blockchainService Service to interact with the blockchain
   * @param dependencies.subgraphService Service to interact with the subgraph
   * @param dependencies.apiService Service to call the gateway API
   * @param dependencies.storageService Optional storage service for caching decryption materials (default: {@link InMemoryStorageService})
   * @param dependencies.config Configuration with gateway URL and contract address
   */
  constructor({
    blockchainService,
    subgraphService,
    apiService,
    storageService = new InMemoryStorageService(),
    config,
  }: HandleClientDependencies) {
    this.blockchainService = blockchainService;
    this.subgraphService = subgraphService;
    this.storageService = storageService;
    this.apiService = apiService;
    this.config = config;
  }

  /**
   * Encrypts a value and returns a handle for use in smart contracts.
   *
   * @param value The value to encrypt (boolean, string, or bigint)
   * @param solidityType The {@link SolidityType} of the value
   * @param applicationContract The address of the contract allowed to use the input
   * @returns {@link Handle} and handleProof for smart contract usage
   *
   * @remarks
   * **Encrypting multiple values concurrently**
   *
   * You can encrypt several values in parallel using `Promise.all` or `Promise.allSettled`:
   *
   * - **`Promise.all`** — all calls start at the same time and resolve together.
   *   Simple to use, but if any single call rejects, the entire `Promise.all` rejects and fulfilled results become inaccessible — in-flight calls are not cancelled.
   *
   * - **`Promise.allSettled`** — all calls start at the same time and each settles independently. Returns an indexed array of `{ status, value | reason }` — a rejection on one item never discards the others. Requires checking each result individually.
   *
   * The Handle Gateway enforces a rate limit. Sending more than ~100 concurrent calls may result in `429 Too Many Requests` errors.
   *
   * @example
   * ```ts
   * // Encrypt a uint256
   * const { handle, handleProof } = await client.encryptInput(
   *   1000000n,
   *   'uint256',
   *   '0x123...abc'
   * );
   *
   * // Encrypt a boolean
   * const { handle, handleProof } = await client.encryptInput(
   *   true,
   *   'bool',
   *   '0x123...abc'
   * );
   *
   * // Multiple values — Promise.all (throws if any call rejects)
   * const [sell, minBuy, bid] = await Promise.all([
   *   client.encryptInput(sellAmount, 'uint256', applicationContract),
   *   client.encryptInput(minBuyAmount, 'uint256', applicationContract),
   *   client.encryptInput(bidAmount, 'uint256', applicationContract),
   * ]);
   *
   * // Multiple values — Promise.allSettled (each result is independent)
   * const results = await Promise.allSettled([
   *   client.encryptInput(sellAmount, 'uint256', applicationContract),
   *   client.encryptInput(minBuyAmount, 'uint256', applicationContract),
   *   client.encryptInput(bidAmount, 'uint256', applicationContract),
   * ]);
   * for (const [i, result] of results.entries()) {
   *   if (result.status === 'fulfilled') {
   *     const { handle, handleProof } = result.value;
   *   } else {
   *     console.error(`input[${i}] failed:`, result.reason);
   *   }
   * }
   * ```
   */
  async encryptInput<T extends SolidityType>(
    value: JsValue<T>,
    solidityType: T,
    applicationContract: EthereumAddress
  ): Promise<{
    handle: Handle<T>;
    handleProof: HexString;
  }> {
    return encryptInput({
      value,
      solidityType,
      applicationContract,
      blockchainService: this.blockchainService,
      apiService: this.apiService,
    });
  }

  /**
   * Request the original value and the solidity type associated with a handle.
   *
   * @param handle The handle representing the encrypted value
   * @returns The decrypted value and its {@link SolidityType}
   *
   * @remarks
   * The decryption key is shared with the connected wallet address via public key encryption.
   *
   * To request decryption, the connected wallet must be allowed to view the data and provide an EIP712 DataAccessAuthorization signature.
   *
   * The `value` type is inferred by TypeScript from the type of the `handle` input if correctly typed (ex: `decrypt(handle as Handle<'uint256'>)` infers `value` as `bigint`).
   * If `handle` is not typed, the `value` type will be `JsValue<SolidityType>`, which is a union of all possible types.
   * It is recommended to use typed handles for better type safety and inference when the handle type is known.
   *
   * @example
   * ```ts
   * const { value, solidityType } = await client.decrypt(handle);
   * ```
   */
  async decrypt<T extends SolidityType>(
    handle: Handle<T>
  ): Promise<{
    value: JsValue<T>;
    solidityType: T;
  }> {
    return decrypt({
      handle,
      storageService: this.storageService,
      apiService: this.apiService,
      blockchainService: this.blockchainService,
      subgraphService: this.subgraphService,
      config: this.config,
    });
  }

  /**
   * View the Access Control List (ACL) for a handle.
   *
   * @param handle The handle representing the encrypted value
   * @returns The {@link ACL} details of the handle, including public access, admins, and viewers
   *
   * @remarks
   * The ACL contains the following properties:
   * - `isPublic`: Indicates if the Handle is publicly decryptable (if `true`, anyone can decrypt it).
   * - `admins`: List of addresses that have admin permissions on the Handle.
   * - `viewers`: List of addresses that have viewer permissions on the Handle.
   *
   * @example
   * ```ts
   * const { isPublic, admins, viewers } = await client.viewACL(handle);
   * ```
   */
  async viewACL(handle: Handle<SolidityType>): Promise<ACL> {
    return viewACL({
      subgraphService: this.subgraphService,
      blockchainService: this.blockchainService,
      handle,
    });
  }

  /**
   * Request the original value, the solidity type and the decryption proof associated with a publicly decryptable handle.
   *
   * @param handle The publicly decryptable handle representing the encrypted value
   * @returns The decrypted value, its {@link SolidityType} and the decryptionProof
   *
   * @remarks
   * To request public decryption, the handle must be publicly decryptable.
   *
   * The decryption proof can be verified in a smart contract and used to produce a plaintext value onchain.
   *
   * The `value` type is inferred by TypeScript from the type of the `handle` input if correctly typed (ex: `publicDecrypt(handle as Handle<'uint256'>)` infers `value` as `bigint`).
   * If `handle` is not typed, the `value` type will be `JsValue<SolidityType>`, which is a union of all possible types.
   * It is recommended to use typed handles for better type safety and inference when the handle type is known.
   *
   * @example
   * ```ts
   * const { value, solidityType, decryptionProof } = await client.publicDecrypt(handle);
   * ```
   */
  async publicDecrypt<T extends SolidityType>(
    handle: Handle<T>
  ): Promise<{
    value: JsValue<T>;
    solidityType: T;
    decryptionProof: HexString;
  }> {
    return publicDecrypt({
      handle,
      apiService: this.apiService,
      blockchainService: this.blockchainService,
      subgraphService: this.subgraphService,
      config: this.config,
    });
  }
}
