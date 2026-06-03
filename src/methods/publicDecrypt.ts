import type { HandleClientConfig } from '../client/HandleClient.js';
import type { IApiService } from '../services/api/IApiService.js';
import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import { IS_PUBLICLY_DECRYPTABLE_ABI } from '../services/blockchain/abis/isPubliclyDecryptable.abi.js';
import type { ISubgraphService } from '../services/subgraph/SubgraphService.js';
import type { HexString } from '../types/internalTypes.js';
import { decodeValue } from '../utils/encoding.js';
import {
  NotYetComputedHandleError,
  UnknownHandleError,
} from '../utils/error.js';
import { isHexString } from '../utils/hex.js';
import { retry } from '../utils/retry.js';
import {
  handleToChainId,
  handleToSolidityType,
  isUniqueHandle,
  type Handle,
  type JsValue,
  type SolidityType,
} from '../utils/types.js';
import { assertRequiredParams } from '../utils/validators.js';
import { viewACL } from './viewACL.js';

export async function publicDecrypt<T extends SolidityType>({
  handle,
  apiService,
  blockchainService,
  subgraphService,
  config,
}: {
  handle: Handle<T>;
  apiService: IApiService;
  blockchainService: IBlockchainService;
  subgraphService: ISubgraphService;
  config: HandleClientConfig;
}): Promise<{
  value: JsValue<T>;
  solidityType: T;
  decryptionProof: HexString;
}> {
  assertRequiredParams({ handle }, ['handle']);

  const chainId = await blockchainService.getChainId();
  const chainIdFromHandle = handleToChainId(handle); // validate chainId
  if (chainIdFromHandle !== chainId) {
    throw new Error(
      `Handle chainId (${chainIdFromHandle}) does not match connected chainId (${chainId})`
    );
  }

  const isPubliclyDecryptable = await blockchainService.readContract(
    config.smartContractAddress,
    IS_PUBLICLY_DECRYPTABLE_ABI,
    [handle]
  );
  if (!isPubliclyDecryptable) {
    throw new Error(
      `Handle (${handle}) does not exist or is not publicly decryptable`
    );
  }

  const solidityType = handleToSolidityType(handle) as T;

  let handleVerifiedToExist = false;
  const getDecryptionResult = async () => {
    const response = await apiService.get({
      endpoint: `/v0/public/${handle}`,
      expectedResponse: {
        types: {
          PublicDecryptionResult: [{ name: 'decryptionProof', type: 'string' }],
        },
        primaryType: 'PublicDecryptionResult',
      },
    });

    if (response.status === 404) {
      // public decryption is already known to be unavailable for this handle, but we want to check if the handle exists
      // if handle is unique, checking isPubliclyDecryptable on-chain is sufficient to determine if the handle exist
      // if handle is not unique, we need to query the subgraph to check if the handle exists, because isPubliclyDecryptable will return true for non-unique handles even if they don't exist
      if (!handleVerifiedToExist && !isUniqueHandle(handle)) {
        await viewACL({
          subgraphService,
          blockchainService,
          handle,
        }).catch((error) => {
          if (error instanceof UnknownHandleError) {
            throw error;
          }
          throw new Error(
            'Failed to decrypt, handle existence is not verified.',
            {
              cause: error,
            }
          );
        });
      }
      handleVerifiedToExist = true;
      throw new NotYetComputedHandleError(handle);
    }
    return response;
  };

  const response = await retry(getDecryptionResult, {
    // Retry options may need to be adjusted based on observed gateway sync times
    delay: 1000,
    backoff: 2,
    maxRetries: 3,
    shouldRetry: (error) => error instanceof NotYetComputedHandleError,
  });

  const { decryptionProof } = validateApiResponse({
    status: response.status,
    data: response.data,
  });
  const plaintext: HexString = `0x${decryptionProof.slice(2 + 65 * 2)}`; // strip leading 65 bytes (proof signature) to get the hex-encoded plaintext
  let value: JsValue<T>;
  try {
    value = decodeValue<T>(plaintext, solidityType);
  } catch (error) {
    throw new Error(
      `Failed to decode decrypted plaintext: expected hex encoded ${solidityType}, got ${plaintext}`,
      { cause: error }
    );
  }
  return { value, solidityType, decryptionProof };
}

/**
 * validates that the response from the Handle Gateway contains a properly formatted decryption proof and handle, and returns them as hex strings
 */
function validateApiResponse({
  status,
  data,
}: {
  status: number;
  data: unknown;
}): { decryptionProof: HexString } {
  if (
    status !== 200 ||
    typeof data !== 'object' ||
    data === null ||
    !isHexString((data as { decryptionProof?: unknown })?.decryptionProof) ||
    (data as { decryptionProof: string }).decryptionProof.length < 2 + 65 * 2 // decryption proof must contain at least 65 bytes of signature
  ) {
    throw new Error(
      `Unexpected response from Handle Gateway (status: ${status}, data: ${JSON.stringify(data)})`
    );
  }
  const { decryptionProof } = data as {
    decryptionProof: HexString;
  };
  return { decryptionProof };
}
