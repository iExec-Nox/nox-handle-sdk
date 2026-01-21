import { isHexString } from './hex.js';

export type JsType<T extends SolidityType> =
  | JsBool<T>
  | JsString<T>
  | JsBigInt<T>;
type JsBool<T extends SolidityType> = T extends 'bool' ? 'boolean' : never;
type JsString<T extends SolidityType> = T extends
  | 'string'
  | 'address'
  | 'bytes'
  | `bytes${number}`
  ? 'string'
  : never;
type JsBigInt<T extends SolidityType> = T extends
  | `uint${number}`
  | `int${number}`
  ? 'bigint'
  : never;

/**
 * Value types accepted by encryptInput based on Solidity type:
 * - bool → boolean
 * - string → string
 * - address, bytes, bytesN → string (hex)
 * - uint*, int* → bigint
 */
export type JsValue<T extends SolidityType> =
  | BoolLike<T>
  | StringLike<T>
  | BigIntLike<T>;
type BoolLike<T extends SolidityType> = T extends 'bool' ? boolean : never;
type StringLike<T extends SolidityType> = T extends 'string'
  ? string
  : T extends 'address' | 'bytes' | `bytes${number}`
    ? string
    : never;
type BigIntLike<T extends SolidityType> = T extends
  | `uint${number}`
  | `int${number}`
  ? bigint
  : never;

/**
 * Supported Solidity types for encryption.
 *
 * WARNING: DO NOT reorder or remove entries from this array.
 * The array index is used as the type code (byte 30 of handle).
 */
const SOLIDITY_TYPES = [
  // Special types
  'bool',
  'address',
  'bytes',
  'string',
  // Unsigned integers (uint8 to uint256, step 8)
  'uint8',
  'uint16',
  'uint24',
  'uint32',
  'uint40',
  'uint48',
  'uint56',
  'uint64',
  'uint72',
  'uint80',
  'uint88',
  'uint96',
  'uint104',
  'uint112',
  'uint120',
  'uint128',
  'uint136',
  'uint144',
  'uint152',
  'uint160',
  'uint168',
  'uint176',
  'uint184',
  'uint192',
  'uint200',
  'uint208',
  'uint216',
  'uint224',
  'uint232',
  'uint240',
  'uint248',
  'uint256',
  // Signed integers (int8 to int256, step 8)
  'int8',
  'int16',
  'int24',
  'int32',
  'int40',
  'int48',
  'int56',
  'int64',
  'int72',
  'int80',
  'int88',
  'int96',
  'int104',
  'int112',
  'int120',
  'int128',
  'int136',
  'int144',
  'int152',
  'int160',
  'int168',
  'int176',
  'int184',
  'int192',
  'int200',
  'int208',
  'int216',
  'int224',
  'int232',
  'int240',
  'int248',
  'int256',
  // Fixed-size bytes (bytes1 to bytes32)
  'bytes1',
  'bytes2',
  'bytes3',
  'bytes4',
  'bytes5',
  'bytes6',
  'bytes7',
  'bytes8',
  'bytes9',
  'bytes10',
  'bytes11',
  'bytes12',
  'bytes13',
  'bytes14',
  'bytes15',
  'bytes16',
  'bytes17',
  'bytes18',
  'bytes19',
  'bytes20',
  'bytes21',
  'bytes22',
  'bytes23',
  'bytes24',
  'bytes25',
  'bytes26',
  'bytes27',
  'bytes28',
  'bytes29',
  'bytes30',
  'bytes31',
  'bytes32',
] as const;

export type SolidityType = (typeof SOLIDITY_TYPES)[number];

/** Set for O(1) type validation lookup */
export const SOLIDITY_TYPES_SET: ReadonlySet<string> = new Set(SOLIDITY_TYPES);

/**
 * Mapping from SolidityType to type code (byte 30 of handle)
 *
 * The index in SOLIDITY_TYPES array corresponds to the type code:
 * - 0-3: Special types (bool, address, bytes, string)
 * - 4-35: uint8 to uint256 (step 8)
 * - 36-67: int8 to int256 (step 8)
 * - 68-99: bytes1 to bytes32
 * - 100-255: Reserved
 */
export const SOLIDITY_TYPE_TO_CODE: ReadonlyMap<SolidityType, number> = new Map(
  SOLIDITY_TYPES.map((type, index) => [type, index])
);

/**
 * Maps a Solidity type to its corresponding JavaScript type.
 *
 * @param solidityType - The Solidity type to convert
 * @returns The corresponding JavaScript type name
 *
 * Mapping:
 * - bool → boolean
 * - string, address, bytes, bytesN → string
 * - uint*, int* → bigint
 */
export function solidityTypeToJsType<T extends SolidityType>(
  solidityType: T
): JsType<T> {
  if (!isSolidityType(solidityType)) {
    throw new Error(`Invalid Solidity type: ${solidityType}`);
  }
  switch (solidityType) {
    case 'bool': {
      return 'boolean' as JsType<T>;
    }
    case 'string':
    case 'address':
    case 'bytes': {
      return 'string' as JsType<T>;
    }
    default: {
      // bytesN (bytes1-bytes32) → string
      if (solidityType.startsWith('bytes')) {
        return 'string' as JsType<T>;
      }
      // uint* / int* → bigint
      return 'bigint' as JsType<T>;
    }
  }
}

/**
 * Maps a handle to its corresponding Solidity type.
 *
 * @param handle - The handle containing the type code to convert
 * @returns The corresponding Solidity type
 * @throws Error if the type code is not supported
 */
export function handleToSolidityType(handle: `0x${string}`): SolidityType {
  if (!isHexString(handle, 32)) {
    throw new Error(`Invalid handle: ${handle}`);
  }
  const typeCodeHex = handle.slice(2 + 30 * 2, 2 + 31 * 2); // byte 30
  const typeCode = Number.parseInt(typeCodeHex, 16);

  const solidityType = SOLIDITY_TYPES[typeCode];
  if (!solidityType) {
    throw new Error(`Unknown handle type code: ${typeCode}`);
  }
  return solidityType;
}

/**
 * Checks if a given string is a valid Solidity type.
 * @param type
 * @returns true if the type is a valid Solidity type, false otherwise
 */
export function isSolidityType(type: string): type is SolidityType {
  return SOLIDITY_TYPES_SET.has(type);
}
