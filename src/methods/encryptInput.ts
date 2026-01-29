import type { IApiService } from '../services/api/IApiService.js';
import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import type { EthereumAddress, HexString } from '../types/internalTypes.js';
import {
  SOLIDITY_TYPES_SET,
  type Handle,
  type JsValue,
  type SolidityType,
} from '../utils/types.js';
import {
  assertRequiredParams,
  validateHandle,
  validateInputProof,
} from '../utils/validators.js';
import {
  boolToHex,
  intXToHex,
  isHexString,
  stringToHex,
  uintXToHex,
} from '../utils/hex.js';

interface GatewaySecretResponse {
  handle: string;
  proof: string;
}

interface EncryptInputParameters {
  blockchainService: IBlockchainService;
  apiService: IApiService;
  value: JsValue<SolidityType>;
  solidityType: SolidityType;
}

function assertValidSolidityType(type: string): asserts type is SolidityType {
  if (!SOLIDITY_TYPES_SET.has(type)) {
    throw new TypeError(`Invalid Solidity type: ${type}`);
  }
}

function assertValidAddress(value: string): void {
  if (!isHexString(value, 20)) {
    throw new TypeError(
      `Invalid value for address: expected 20 bytes hex string (0x...), got ${value}`
    );
  }
}

function assertValidBytes(value: string): void {
  if (!isHexString(value)) {
    throw new TypeError(
      `Invalid value for bytes: expected hex string (0x...), got ${value}`
    );
  }
}

function assertValidBytesN(
  value: string,
  solidityType: `bytes${number}`
): void {
  const size = Number.parseInt(solidityType.slice(5), 10);
  if (!isHexString(value, size)) {
    throw new TypeError(
      `Invalid value for ${solidityType}: expected ${size} bytes hex string (0x...), got ${value}`
    );
  }
}

function encodeValue(
  value: JsValue<SolidityType>,
  solidityType: SolidityType
): HexString {
  assertValidSolidityType(solidityType);

  switch (solidityType) {
    case 'bool': {
      return boolToHex(value as boolean);
    }
    case 'string': {
      return stringToHex(value as string);
    }
    case 'address': {
      assertValidAddress(value as string);
      return value as HexString;
    }
    case 'bytes': {
      assertValidBytes(value as string);
      return value as HexString;
    }
    default: {
      if (solidityType.startsWith('uint')) {
        const bits = Number.parseInt(solidityType.slice(4), 10);
        return uintXToHex(value as bigint, bits);
      }
      if (solidityType.startsWith('int')) {
        const bits = Number.parseInt(solidityType.slice(3), 10);
        return intXToHex(value as bigint, bits);
      }
      if (solidityType.startsWith('bytes')) {
        assertValidBytesN(value as string, solidityType as `bytes${number}`);
        return value as HexString;
      }
      throw new TypeError(`Unsupported Solidity type: ${solidityType}`);
    }
  }
}

export async function encryptInput<T extends SolidityType>({
  blockchainService,
  apiService,
  value,
  solidityType,
}: EncryptInputParameters): Promise<{
  handle: Handle<T>;
  inputProof: HexString;
}> {
  assertRequiredParams({ value, solidityType }, ['value', 'solidityType']);
  const encodedValue = encodeValue(value, solidityType);
  const [owner, chainId] = await Promise.all([
    blockchainService.getAddress(),
    blockchainService.getChainId(),
  ]);
  const response = await apiService.post({
    endpoint: '/v0/secrets',
    body: {
      value: encodedValue,
      solidityType,
      owner: owner as EthereumAddress,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Gateway API error: ${response.status} - ${JSON.stringify(response.data)}`
    );
  }

  const data = response.data as GatewaySecretResponse;
  if (!data?.handle || !data?.proof) {
    throw new Error('Invalid gateway response: missing handle or inputProof');
  }

  validateHandle({
    handle: data.handle,
    expectedChainId: chainId,
    expectedSolidityType: solidityType,
  });
  validateInputProof(data.proof);

  return {
    handle: data.handle as HexString,
    inputProof: data.proof as HexString,
  };
}
