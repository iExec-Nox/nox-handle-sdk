import type { AbstractSigner, BrowserProvider, Provider } from 'ethers';
import type { IBlockchainService } from './IBlockchainService.js';

export type EthersClient = AbstractSigner<Provider> | BrowserProvider;

/**
 * EthersBlockchainService
 *
 * Implements IBlockchainService using ethers library.
 *
 * @param signer - An ethers AbstractSigner instance connected to a Provider or a BrowserProvider
 * @returns A EthersBlockchainService instance
 * @throws {TypeError} if the provided signer is invalid
 */
export class EthersBlockchainService implements IBlockchainService {
  constructor(signer: EthersClient) {
    if (isEthersSigner(signer)) {
      this.signerProvider = signer;
    } else if (isEthersBrowserProvider(signer)) {
      this.browserProvider = signer;
    } else {
      throw new TypeError(
        'Unsupported signer. Expected an ethers AbstractSigner instance connected to a Provider or a BrowserProvider.'
      );
    }
  }

  private signerProvider?: AbstractSigner<Provider>;
  private browserProvider?: BrowserProvider;

  async getChainId(): Promise<number> {
    try {
      if (this.signerProvider) {
        const network = await this.signerProvider.provider.getNetwork();
        return Number(network.chainId);
      }
      if (this.browserProvider) {
        const network = await this.browserProvider.getNetwork();
        return Number(network.chainId);
      }
      throw new Error('No provider available to get chain ID');
    } catch (error) {
      throw new Error('Failed to get chain ID', { cause: error });
    }
  }

  async getAddress(): Promise<string> {
    try {
      if (this.signerProvider) {
        const address = await this.signerProvider.getAddress();
        return address;
      }
      if (this.browserProvider) {
        const signer = await this.browserProvider.getSigner();
        const address = await signer.getAddress();
        return address;
      }
      throw new Error('No signer available to get address');
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
