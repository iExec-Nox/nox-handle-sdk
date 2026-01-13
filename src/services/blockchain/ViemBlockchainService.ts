import type { WalletClient, TypedDataDomain } from 'viem';
import type {
  EIP712TypedData,
  IBlockchainService,
} from './IBlockchainService.js';

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

  private readonly walletClient: ViemClient;

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

  async signTypedData(data: EIP712TypedData): Promise<string> {
    try {
      const address = await this.getAddress();
      const signature = await this.walletClient.signTypedData({
        account: address as `0x${string}`,
        domain: data.domain as TypedDataDomain,
        types: data.types,
        primaryType: data.primaryType,
        message: data.message,
      });
      return signature;
    } catch (error) {
      throw new Error('Failed to sign typed data', { cause: error });
    }
  }
}
