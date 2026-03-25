import type { HandleClientConfig } from '../client/HandleClient.js';
import type { IApiService } from '../services/api/IApiService.js';
import type {
  EIP712TypedData,
  IBlockchainService,
} from '../services/blockchain/IBlockchainService.js';
import { IS_PUBLICLY_DECRYPTABLE_ABI } from '../services/blockchain/abis/isPubliclyDecryptable.abi.js';
import type { HexString } from '../types/internalTypes.js';
import { decodeValue } from '../utils/encoding.js';
import {
  generateRequestSalt,
  attestResponse,
} from '../utils/gatewayAttestation.js';
import { isHexString } from '../utils/hex.js';
import {
  handleToChainId,
  handleToSolidityType,
  type Handle,
  type JsValue,
  type SolidityType,
} from '../utils/types.js';
import { assertRequiredParams } from '../utils/validators.js';

export async function publicDecrypt<T extends SolidityType>({
  handle,
  apiService,
  blockchainService,
  config,
}: {
  handle: Handle<T>;
  apiService: IApiService;
  blockchainService: IBlockchainService;
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

  const salt = generateRequestSalt();
  const response = await apiService.get({
    endpoint: `/v0/public/${handle}`,
    query: { salt },
  });

  if (!response.ok) {
    // TODO: verify non-ok response provenance when supported
    throw new Error(
      `Gateway API error: ${response.status} - ${JSON.stringify(response.data)}`
    );
  }

  await attestResponse({
    blockchainService,
    noxContractAddress: config.smartContractAddress,
    message: response.data as EIP712TypedData['message'],
    types: {
      PublicDecryptionResult: [{ name: 'decryptionProof', type: 'string' }],
    },
    primaryType: 'PublicDecryptionResult',
    requestSalt: salt,
    signature: response.signature,
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
