import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import type { IApiService } from '../services/api/IApiService.js';
import type { HandleClientConfig } from '../client/HandleClient.js';
import { isHexString } from '../utils/hex.js';
import {
  handleToChainId,
  handleToSolidityType,
  type Handle,
  type JsValue,
  type SolidityType,
} from '../utils/types.js';
import type { HexString } from '../types/internalTypes.js';
import { assertRequiredParams } from '../utils/validators.js';
import { IS_PUBLICLY_DECRYPTABLE_ABI } from '../services/blockchain/abis/isPubliclyDecryptable.abi.js';
import { decodeValue, unpack } from '../utils/encoding.js';

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

  const { status, data } = await apiService.get({
    endpoint: `/v0/public/${handle}`,
  });

  const { decryptionProof, handle: returnedHandle } = validateApiResponse({
    status,
    data,
  });

  if (returnedHandle.toLowerCase() !== handle.toLowerCase()) {
    throw new Error(
      `Decryption proof handle (${returnedHandle}) does not match requested handle (${handle})`
    );
  }

  const solidityPlaintext: HexString = `0x${decryptionProof.slice(2 + 65 * 2)}`; // strip leading 65 bytes (proof signature) to get the packed hex-encoded plaintext

  let value: JsValue<T>;
  try {
    const plaintext = unpack(solidityPlaintext, solidityType);
    value = decodeValue<T>(plaintext, solidityType);
  } catch (error) {
    throw new Error(
      `Failed to decode decrypted plaintext: expected packed ${solidityType}, got ${solidityPlaintext}`,
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
}): { decryptionProof: HexString; handle: HexString } {
  if (
    status !== 200 ||
    typeof data !== 'object' ||
    data === null ||
    !isHexString((data as { handle?: unknown })?.handle, 32) ||
    !isHexString((data as { decryptionProof?: unknown })?.decryptionProof) ||
    (data as { decryptionProof: string }).decryptionProof.length <
      2 + (65 + 32) * 2 // decryption proof must contain at least 65 bytes of signature + 32 bytes of plaintext (may be more for dynamic types)
  ) {
    throw new Error(
      `Unexpected response from Handle Gateway (status: ${status}, data: ${JSON.stringify(data)})`
    );
  }
  const { decryptionProof, handle } = data as {
    handle: HexString;
    decryptionProof: HexString;
  };
  return { decryptionProof, handle };
}
