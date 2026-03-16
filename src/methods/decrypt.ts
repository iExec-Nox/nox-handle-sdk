import type {
  IBlockchainService,
  EIP712TypedData,
} from '../services/blockchain/IBlockchainService.js';
import type { IApiService } from '../services/api/IApiService.js';
import type { HandleClientConfig } from '../client/HandleClient.js';
import {
  generateRsaKeyPair,
  exportRsaPublicKey,
  rsaDecrypt,
} from '../utils/rsa.js';
import { eciesDecrypt } from '../utils/ecies.js';
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
import { IS_VIEWER_ABI } from '../services/blockchain/abis/isViewer.abi.js';
import { decodeValue } from '../utils/encoding.js';

export async function decrypt<T extends SolidityType>({
  handle,
  apiService,
  blockchainService,
  config,
}: {
  handle: Handle<T>;
  apiService: IApiService;
  blockchainService: IBlockchainService;
  config: HandleClientConfig;
}): Promise<{ value: JsValue<T>; solidityType: T }> {
  assertRequiredParams({ handle }, ['handle']);

  const [chainId, userAddress] = await Promise.all([
    blockchainService.getChainId(),
    blockchainService.getAddress(),
  ]);

  const chainIdFromHandle = handleToChainId(handle); // validate chainId
  if (chainIdFromHandle !== chainId) {
    throw new Error(
      `Handle chainId (${chainIdFromHandle}) does not match connected chainId (${chainId})`
    );
  }

  const isViewer = await blockchainService.readContract(
    config.smartContractAddress,
    IS_VIEWER_ABI,
    [handle, userAddress]
  );
  if (!isViewer) {
    throw new Error(
      `Handle (${handle}) does not exist or user (${userAddress}) is not authorized to decrypt it`
    );
  }

  const solidityType = handleToSolidityType(handle) as T;

  const rsaKeyPair = await generateRsaKeyPair().catch((error) => {
    throw new Error('Failed to generate RSA key pair', { cause: error });
  });
  const spkiHexRsaPubKey = await exportRsaPublicKey(rsaKeyPair).catch(
    (error) => {
      throw new Error('Failed to export RSA public key', { cause: error });
    }
  );

  const now = Math.floor(Date.now() / 1000);

  const dataAccessAuthorizationTypedData: EIP712TypedData = {
    types: {
      EIP712Domain: [
        // standard domain type (no salt)
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'version',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
      ],
      DataAccessAuthorization: [
        {
          name: 'userAddress',
          type: 'address',
        },
        {
          name: 'encryptionPubKey',
          type: 'string',
        },
        {
          name: 'notBefore',
          type: 'uint256',
        },
        {
          name: 'expiresAt',
          type: 'uint256',
        },
      ],
    },
    domain: {
      name: 'Handle Gateway',
      version: '1', // major version
      chainId: chainId,
      verifyingContract: config.smartContractAddress, // Nox contract address to specify
    },
    primaryType: 'DataAccessAuthorization',
    message: {
      userAddress: userAddress,
      encryptionPubKey: spkiHexRsaPubKey,
      notBefore: now,
      expiresAt: now + 3600, // valid for 1 hour
    },
  };
  const signature = await blockchainService
    .signTypedData(dataAccessAuthorizationTypedData)
    .catch((error) => {
      throw new Error('Failed to sign data access authorization', {
        cause: error,
      });
    });

  const authorization = `EIP712 ${btoa(
    JSON.stringify({
      payload: dataAccessAuthorizationTypedData.message,
      signature: signature,
    })
  )}`;

  const { status, data } = await apiService.get({
    endpoint: `/v0/secrets/${handle}`,
    headers: {
      Authorization: authorization,
    },
  });

  // Validate response
  if (
    status !== 200 ||
    typeof data !== 'object' ||
    data === null ||
    !isHexString((data as { ciphertext?: unknown })?.ciphertext) ||
    !isHexString((data as { iv?: unknown })?.iv, 12) ||
    !isHexString(
      (data as { encryptedSharedSecret?: unknown })?.encryptedSharedSecret
    )
  ) {
    throw new Error(
      `Unexpected response from Handle Gateway (status: ${status}, data: ${JSON.stringify(data)})`
    );
  }
  const { ciphertext, iv, encryptedSharedSecret } = data as {
    ciphertext: HexString;
    iv: HexString;
    encryptedSharedSecret: HexString;
  };

  const sharedSecret = await rsaDecrypt({
    privateKey: rsaKeyPair.privateKey,
    ciphertext: encryptedSharedSecret,
  }).catch((error) => {
    throw new Error('Failed to decrypt shared secret', { cause: error });
  });

  const plaintext = await eciesDecrypt({
    ciphertext,
    iv,
    sharedSecret,
  }).catch((error) => {
    throw new Error('Failed to decrypt ciphertext', { cause: error });
  });

  let value: JsValue<T>;
  try {
    value = decodeValue<T>(plaintext, solidityType);
  } catch (error) {
    throw new Error(
      `Failed to decode decrypted plaintext: expected hex encoded ${solidityType}, got ${plaintext}`,
      { cause: error }
    );
  }
  return { value, solidityType };
}
