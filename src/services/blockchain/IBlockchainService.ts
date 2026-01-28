import type { HexString } from '../../types/internalTypes.js';

/**
 * Interface for Blockchain Service
 *
 * Defines methods to interact with the blockchain regardless of the underlying library.
 */
export interface IBlockchainService {
  getChainId(): Promise<number>;
  getAddress(): Promise<string>;
  signTypedData(data: EIP712TypedData): Promise<string>;
  verifyTypedData(data: EIP712TypedData, signature: string): Promise<string>;
}

export type EIP712TypedData = {
  types: Record<string, { name: string; type: string }[]>;
  primaryType: string;
  domain: {
    name?: string;
    version?: string;
    chainId?: number | bigint;
    verifyingContract?: HexString;
    salt?: HexString;
  };
  message: Record<string, unknown>;
};
