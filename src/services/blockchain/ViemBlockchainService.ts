import type { Account, WalletClient, Transport, Chain } from 'viem';
import type { IBlockchainService } from './IBlockchainService.js';

export type ViemClient = WalletClient<Transport, Chain | undefined, Account>;

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
    'account' in object &&
    !!object.account &&
    typeof object.account === 'object' &&
    'address' in object.account &&
    typeof object.account.address === 'string'
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
      const address = this.walletClient.account.address;
      return address;
    } catch (error) {
      throw new Error('Failed to get address', { cause: error });
    }
  }
}
