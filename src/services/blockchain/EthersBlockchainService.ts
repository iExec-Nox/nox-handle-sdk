import type { AbstractSigner, Provider } from 'ethers';
import type { IBlockchainService } from './IBlockchainService.js';

export type EthersSigner = AbstractSigner<Provider>;

/**
 * EthersBlockchainService
 *
 * Implements IBlockchainService using ethers library.
 */
export class EthersBlockchainService implements IBlockchainService {
  constructor(signer: EthersSigner) {
    this.signerProvider = signer;
  }

  private signerProvider: EthersSigner;

  async getChainId(): Promise<number> {
    try {
      const chainId = await this.signerProvider.provider
        .getNetwork()
        .then((network) => Number(network.chainId));
      return chainId;
    } catch (error) {
      throw new Error('Failed to get chain ID', { cause: error });
    }
  }

  async getAddress(): Promise<string> {
    try {
      const address = await this.signerProvider.getAddress();
      return address;
    } catch (error) {
      throw new Error('Failed to get address', { cause: error });
    }
  }
}

/**
 * Type guard to check if a client is an ethers AbstractSigner with a connected Provider
 */
export function isEthersSigner(object: unknown): object is EthersSigner {
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
