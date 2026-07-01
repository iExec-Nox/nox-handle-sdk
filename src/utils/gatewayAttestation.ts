import type {
  EIP712TypedData,
  IBlockchainService,
} from '../services/blockchain/IBlockchainService.js';
import { GATEWAY_ABI } from '../services/blockchain/abis/gateway.abi.js';
import type { EthereumAddress, HexString } from '../types/internalTypes.js';
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
 * Retrieves the gateway address from the smart contract.
 */
export async function getGatewayAddress({
  blockchainService,
  smartContractAddress,
}: {
  blockchainService: IBlockchainService;
  smartContractAddress: EthereumAddress;
}): Promise<EthereumAddress> {
  const gatewayAddress = (await blockchainService.readContract(
    smartContractAddress,
    GATEWAY_ABI,
    []
  )) as `0x${string}`;
  return gatewayAddress;
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
  verifyTypedData,
  gatewayAddress,
  chainId,
  message,
  types,
  primaryType,
  requestSalt,
  signature,
}: {
  verifyTypedData: (
    data: EIP712TypedData,
    signature: HexString
  ) => Promise<EthereumAddress>;
  gatewayAddress: EthereumAddress;
  chainId: number;
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
      const signerAddress = await verifyTypedData(
        { domain: requestDomain, types, primaryType, message },
        signature
      ).catch((error) => {
        throw new Error('Invalid gateway signature', { cause: error });
      });
      if (signerAddress.toLowerCase() !== gatewayAddress.toLowerCase()) {
        throw new Error('Invalid gateway signature');
      }
    } catch (error) {
      throw new GatewayTrustError('Untrusted Gateway response', {
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
