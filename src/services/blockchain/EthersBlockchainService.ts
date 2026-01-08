import type { AbstractSigner, BrowserProvider, Provider } from 'ethers';
import type { IBlockchainService } from './IBlockchainService.js';

export type EthersClient = AbstractSigner<Provider> | BrowserProvider;

/**
 * Internal adapter interface for ethers clients
 */
interface EthersAdapter {
  getChainId(): Promise<number>;
  getAddress(): Promise<string>;
}

/**
 * Adapter for ethers AbstractSigner
 */
class SignerAdapter implements EthersAdapter {
  constructor(signer: AbstractSigner<Provider>) {
    this.signer = signer;
  }

  private signer: AbstractSigner<Provider>;

  async getChainId(): Promise<number> {
    const network = await this.signer.provider.getNetwork();
    return Number(network.chainId);
  }

  async getAddress(): Promise<string> {
    return this.signer.getAddress();
  }
}

/**
 * Adapter for ethers BrowserProvider
 */
class BrowserProviderAdapter implements EthersAdapter {
  constructor(provider: BrowserProvider) {
    this.provider = provider;
  }

  private provider: BrowserProvider;

  async getChainId(): Promise<number> {
    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  async getAddress(): Promise<string> {
    const signer = await this.provider.getSigner();
    return signer.getAddress();
  }
}

/**
 * EthersBlockchainService
 *
 * Implements IBlockchainService using ethers library.
 */
export class EthersBlockchainService implements IBlockchainService {
  /**
   * Creates an instance of EthersBlockchainService.
   * @param client - An ethers AbstractSigner instance connected to a Provider or a BrowserProvider
   * @returns A EthersBlockchainService instance
   * @throws {TypeError} if the provided client is invalid
   */
  constructor(client: EthersClient) {
    if (isEthersSigner(client)) {
      this.adapter = new SignerAdapter(client);
    } else if (isEthersBrowserProvider(client)) {
      this.adapter = new BrowserProviderAdapter(client);
    } else {
      throw new TypeError(
        'Unsupported client. Expected an ethers AbstractSigner instance connected to a Provider or a BrowserProvider.'
      );
    }
  }

  private adapter: EthersAdapter;

  async getChainId(): Promise<number> {
    try {
      return await this.adapter.getChainId();
    } catch (error) {
      throw new Error('Failed to get chain ID', { cause: error });
    }
  }

  async getAddress(): Promise<string> {
    try {
      return await this.adapter.getAddress();
    } catch (error) {
      throw new Error('Failed to get address', { cause: error });
    }
  }
}

/**
 * Type guard to check if a client is an ethers AbstractSigner with a connected Provider
 */
export function isEthersSigner(
  object: unknown
): object is AbstractSigner<Provider> {
  return (
    !!object &&
    typeof object === 'object' &&
    'getAddress' in object &&
    typeof object.getAddress === 'function' &&
    'provider' in object &&
    !!object.provider &&
    typeof object.provider === 'object' &&
    'getNetwork' in object.provider &&
    typeof object.provider.getNetwork === 'function'
  );
}

/**
 * Type guard to check if a client is an ethers BrowserProvider
 */
export function isEthersBrowserProvider(
  object: unknown
): object is BrowserProvider {
  return (
    !!object &&
    typeof object === 'object' &&
    'getSigner' in object &&
    typeof object.getSigner === 'function' &&
    'getNetwork' in object &&
    typeof object.getNetwork === 'function'
  );
}
