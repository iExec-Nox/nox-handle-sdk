import {
  publicActions,
  recoverTypedDataAddress,
  type WalletClient,
} from 'viem';
import type {
  EIP712TypedData,
  IBlockchainService,
} from './IBlockchainService.js';
import type { EthereumAddress, HexString } from '../../types/internalTypes.js';
import type {
  AbiFragmentTypes,
  AbiReadFunctionJsonFragment,
} from './abi.types.js';

export type ViemClient = WalletClient;

/**
 * Type guard to check if a client is a viem WalletClient connected to an account
 *
 * @dev ⚠️ Update this function to match ViemBlockchainService requirements changes
 */
export function isViemWalletClient(object: unknown): object is ViemClient {
  return (
    !!object &&
    typeof object === 'object' &&
    'getChainId' in object &&
    typeof object.getChainId === 'function' &&
    'getAddresses' in object &&
    typeof object.getAddresses === 'function'
  );
}

/**
 * Implements IBlockchainService using viem library.
 */
export class ViemBlockchainService implements IBlockchainService {
  private readonly walletClient: ViemClient;

  /**
   * Creates an instance of ViemBlockchainService.
   * @param client - A viem WalletClient instance connected to an account
   * @returns A ViemBlockchainService instance
   * @throws {TypeError} if the provided client is invalid
   */
  constructor(client: ViemClient) {
    if (isViemWalletClient(client)) {
      this.walletClient = client;
    } else {
      throw new TypeError(
        'Unsupported client. Expected a viem WalletClient instance connected to an account.'
      );
    }
  }

  async getChainId(): Promise<number> {
    try {
      const chainId = await this.walletClient.getChainId();
      return chainId;
    } catch (error) {
      throw new Error('Failed to get chain ID', { cause: error });
    }
  }

  async getAddress(): Promise<string> {
    try {
      const addresses = await this.walletClient.getAddresses();
      const address = addresses[0];
      if (!address) {
        throw new Error('No connected account');
      }
      return address;
    } catch (error) {
      throw new Error('Failed to get address', { cause: error });
    }
  }

  async readContract<T extends AbiReadFunctionJsonFragment>(
    contractAddress: string,
    abiFunctionFragment: T,
    parameters: AbiFragmentTypes<T, 'inputs'>
  ): Promise<AbiFragmentTypes<T, 'outputs'>> {
    try {
      const publicClient = this.walletClient.extend(publicActions);
      return (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [abiFunctionFragment],
        functionName: abiFunctionFragment.name,
        args: parameters,
      })) as AbiFragmentTypes<T, 'outputs'>;
    } catch (error) {
      throw new Error(
        `Failed to read contract at ${contractAddress} (method: ${abiFunctionFragment.name}, parameters: ${JSON.stringify(parameters)})`,
        {
          cause: error,
        }
      );
    }
  }

  async signTypedData(data: EIP712TypedData): Promise<string> {
    try {
      const address = await this.getAddress();
      const signature = await this.walletClient.signTypedData({
        account: address as EthereumAddress,
        domain: data.domain,
        types: data.types,
        primaryType: data.primaryType,
        message: data.message,
      });
      return signature;
    } catch (error) {
      throw new Error('Failed to sign typed data', { cause: error });
    }
  }

  async verifyTypedData(
    data: EIP712TypedData,
    signature: string
  ): Promise<string> {
    try {
      return await recoverTypedDataAddress({
        domain: data.domain,
        types: data.types,
        primaryType: data.primaryType,
        message: data.message,
        signature: signature as HexString,
      });
    } catch (error) {
      throw new Error('Failed to verify typed data', { cause: error });
    }
  }
}
