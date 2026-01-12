import type { AbstractSigner, BrowserProvider, Provider } from 'ethers';
import type { IBlockchainService } from './IBlockchainService.js';

export type EthersClient = AbstractSigner | BrowserProvider;

/**
 * Internal adapter interface for ethers clients
 */
interface EthersAdapter {
  getChainId(): Promise<number>;
  getAddress(): Promise<string>;
}

/**
 * Type guard to check if a client is an ethers AbstractSigner with a connected Provider
 *
 * @dev ⚠️ Update this function to match SignerAdapter requirements changes
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
 * Adapter for ethers AbstractSigner
 *
 * @dev ⚠️ Update isEthersSigner function if this class is modified requiring more duck type checks
 */
class SignerAdapter implements EthersAdapter {
  constructor(signer: AbstractSigner<Provider>) {
    this.signer = signer;
  }

  private readonly signer: AbstractSigner<Provider>;

  async getChainId(): Promise<number> {
    const network = await this.signer.provider.getNetwork();
    return Number(network.chainId);
  }

  async getAddress(): Promise<string> {
    return this.signer.getAddress();
  }
}

/**
 * Type guard to check if a client is an ethers BrowserProvider
 *
 * @dev ⚠️ Update this function to match BrowserProviderAdapter requirements changes
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

/**
 * Adapter for ethers BrowserProvider
 *
 * @dev ⚠️ Update isEthersBrowserProvider function if this class is modified requiring more duck type checks
 */
class BrowserProviderAdapter implements EthersAdapter {
  constructor(provider: BrowserProvider) {
    this.provider = provider;
  }

  private readonly provider: BrowserProvider;

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

  private readonly adapter: EthersAdapter;

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
