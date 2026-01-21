/**
 * Internal types - not exported to consumers
 */

export type BaseUrl = `http${'' | 's'}://${string}`;
export type EthereumAddress = `0x${string}`;

/**
 * Supported Solidity types for encryption.
 *
 * WARNING: DO NOT reorder or remove entries from this array.
 * The array index is used as the type code (byte 30 of handle).
 */
export const SOLIDITY_TYPES = [
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

/** Hex-encoded string with "0x" prefix */
export type HexString = `0x${string}`;

/** Result of encrypting an input value */
export interface EncryptInputResult {
  /** The encrypted handle for the value */
  handle: HexString;
  /** The proof required for smart contract verification */
  inputProof: HexString;
}

/**
 * Value types accepted by encryptInput based on Solidity type:
 * - bool → boolean
 * - string → string
 * - address, bytes, bytesN → string (hex)
 * - uint*, int* → bigint
 */
export type InputValue = string | boolean | bigint;
