import type { Account, WalletClient, Transport, Chain } from 'viem';
import type { IBlockchainService } from './IBlockchainService.js';

export type ViemWalletClient = WalletClient<
  Transport,
  Chain | undefined,
  Account
>;

/**
 * ViemBlockchainService
 *
 * Implements IBlockchainService using viem library.
 */
export class ViemBlockchainService implements IBlockchainService {
  constructor(walletClient: ViemWalletClient) {
    this.walletClient = walletClient;
  }

  private walletClient: ViemWalletClient;

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

/**
 * Type guard to check if a client is a viem WalletClient connected to an account
 */
export function isViemWalletClient(
  object: unknown
): object is ViemWalletClient {
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
