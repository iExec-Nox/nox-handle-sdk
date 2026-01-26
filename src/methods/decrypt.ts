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
import {
  hexToBool,
  hexToIntX,
  hexToString,
  hexToUintX,
  isHexString,
} from '../utils/hex.js';
import {
  handleToChainId,
  handleToSolidityType,
  type Handle,
  type JsValue,
  type SolidityType,
} from '../utils/types.js';
import type { HexString } from '../types/internalTypes.js';

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
  // TODO: Validate handle ACL
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
    endpoint: `/v0/handles/${handle}`,
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
    /* eslint unicorn/prefer-switch: ["error", {"minimumCases": 5}] */
    if (solidityType === 'bool') {
      value = hexToBool(plaintext) as JsValue<T>;
    } else if (solidityType === 'string') {
      value = hexToString(plaintext) as JsValue<T>;
    } else if (solidityType === 'bytes') {
      // no validation needed plaintext is always hex
      value = plaintext as JsValue<T>;
    } else if (solidityType === 'address') {
      if (!isHexString(plaintext, 20)) {
        throw new TypeError('Invalid address');
      }
      value = plaintext as JsValue<T>;
    } else if (solidityType.startsWith('uint')) {
      const bitSize = Number.parseInt(solidityType.slice(4), 10);
      value = hexToUintX(plaintext, bitSize) as JsValue<T>;
    } else if (solidityType.startsWith('int')) {
      const bitSize = Number.parseInt(solidityType.slice(3), 10);
      value = hexToIntX(plaintext, bitSize) as JsValue<T>;
    } else if (solidityType.startsWith('bytes')) {
      const byteSize = Number.parseInt(solidityType.slice(5), 10);
      if (!isHexString(plaintext, byteSize)) {
        throw new TypeError(`Invalid ${solidityType}`);
      }
      value = plaintext as JsValue<T>;
    } else {
      throw new Error(`Unsupported solidity type ${solidityType}`); // should never happen
    }
  } catch (error) {
    throw new Error(
      `Failed to decode decrypted plaintext: expected hex encoded ${solidityType}, got ${plaintext}`,
      { cause: error }
    );
  }
  return { value, solidityType };
}
