import type { HandleClientConfig } from '../client/HandleClient.js';
import type {
  IBlockchainService,
  EIP712TypedData,
} from '../services/blockchain/IBlockchainService.js';
import { GATEWAY_ABI } from '../services/blockchain/abis/gateway.abi.js';
import type { HexString } from '../types/internalTypes.js';
import { bytesToHex, isHexString } from './hex.js';

/**
 * Custom error class for gateway server verification failures.
 * This error is thrown when the gateway response fails signature verification, indicating a potential tampering of the response.
 */
export class GatewayTrustError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GatewayTrustError';
  }
}

/**
 * Generates a unique salt for each request, which is used in the EIP-712 typed data to prevent replay attacks. The salt is a random 32-byte value represented as a hex string.
 *
 * @returns A unique 32-byte hex string.
 */
export function generateRequestSalt(): HexString {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(randomBytes);
}

/**
 * Attests the response comes from the registered gateway by verifying the EIP-712 signature included in the response.
 * It checks that the response is signed by the gateway with the provided salt.
 */
export async function attestResponse({
  blockchainService,
  noxContractAddress,
  message,
  types,
  primaryType,
  requestSalt,
  signature,
}: {
  blockchainService: IBlockchainService;
  noxContractAddress: HandleClientConfig['smartContractAddress'];
  message: EIP712TypedData['message'];
  types: EIP712TypedData['types'];
  primaryType: EIP712TypedData['primaryType'];
  requestSalt: HexString;
  signature?: string;
}): Promise<void> {
  try {
    if (!isHexString(requestSalt, 32)) {
      throw new Error('Invalid salt format');
    }
    const [chainId, gatewayAddress] = await Promise.all([
      blockchainService.getChainId(),
      blockchainService.readContract(noxContractAddress, GATEWAY_ABI, []),
    ]);

    const requestDomain: EIP712TypedData['domain'] = {
      name: 'Handle Gateway',
      version: '1',
      chainId,
      salt: requestSalt,
    };

    try {
      if (!signature) {
        throw new Error('Missing gateway signature');
      }
      if (!isHexString(signature)) {
        throw new Error('Invalid signature format');
      }
      const signerAddress = await blockchainService
        .verifyTypedData(
          { domain: requestDomain, types, primaryType, message: message },
          signature
        )
        .catch((error) => {
          throw new Error('Invalid gateway signature', { cause: error });
        });
      if (signerAddress.toLowerCase() !== gatewayAddress.toLowerCase()) {
        throw new Error('Invalid gateway signature');
      }
    } catch (error) {
      throw new GatewayTrustError('Untrustable Gateway response', {
        cause: error,
      });
    }
  } catch (error) {
    if (error instanceof GatewayTrustError) {
      throw error;
    }
    throw new Error('Failed to attest gateway response', {
      cause: error,
    });
  }
}
