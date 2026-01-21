/**
 * Input validation utilities
 */

import {
  SOLIDITY_TYPES_SET,
  SOLIDITY_TYPE_TO_CODE,
  type BaseUrl,
  type EthereumAddress,
  type InputValue,
  type SolidityType,
} from '../types/internalTypes.js';
import { solidityTypeToJSType } from './helpers.js';

// ============================================================================
// Config Validation
// ============================================================================

/**
 * Checks url is a base URL
 *
 * if starts with http:// or https:// and has no path segment (/) nor query parameters (?).
 */
export function isBaseURL(url: unknown): url is BaseUrl {
  return typeof url === 'string' && /^https?:\/\/[^/?]+\/?$/.test(url);
}

/**
 * Checks address is a valid Ethereum address
 *
 * if starts with 0x and is 40 characters long.
 */
export function isEthereumAddress(
  address: unknown
): address is EthereumAddress {
  return typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address);
}

// ============================================================================
// Solidity Type Validation
// ============================================================================

/**
 * Validates that the type is a valid SolidityType
 * @throws TypeError if type is invalid
 */
export function validateSolidityType(
  type: string
): asserts type is SolidityType {
  if (!SOLIDITY_TYPES_SET.has(type)) {
    throw new TypeError(`Invalid Solidity type: ${type}`);
  }
}

// ============================================================================
// Input Value Validation
// ============================================================================

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const HEX_STRING_PATTERN = /^0x([0-9a-fA-F]{2})*$/;

const isValidAddress = (value: string): boolean => ADDRESS_PATTERN.test(value);
const isValidHexString = (value: string): boolean =>
  HEX_STRING_PATTERN.test(value);
const isValidBytesN = (value: string, size: number): boolean =>
  isValidHexString(value) && value.length <= 2 + size * 2;

/**
 * Validates that the value matches the expected Solidity type
 * @throws TypeError if value doesn't match the type
 */
export function validateInputValue(
  value: InputValue,
  solidityType: SolidityType
): void {
  const expectedJSType = solidityTypeToJSType(solidityType);

  if (typeof value !== expectedJSType) {
    throw new TypeError(
      `Invalid value for ${solidityType}: expected ${expectedJSType}, got ${typeof value}`
    );
  }

  if (typeof value === 'string') {
    validateStringFormat(value, solidityType);
  }
}

// ============================================================================
// Handle & InputProof Validation
// ============================================================================

/** Handle: 32 bytes = 0x + 64 hex chars */
const HANDLE_PATTERN = /^0x[0-9a-fA-F]{64}$/;
/** InputProof: 117 bytes = 0x + 234 hex chars (createdAt 32 + owner 20 + sig 65) */
const INPUT_PROOF_PATTERN = /^0x[0-9a-fA-F]{234}$/;

/** Current handle format version */
const HANDLE_VERSION = 0;

interface ValidateHandleParameters {
  handle: string;
  expectedChainId: number;
  expectedSolidityType: SolidityType;
}

/**
 * Validates a handle structure according to the protocol spec.
 *
 * Handle structure (32 bytes):
 * - Bytes 0-25: prehandle (truncated hash)
 * - Bytes 26-29: chainId (uint32)
 * - Byte 30: type code
 * - Byte 31: version
 *
 * @throws TypeError if handle format is invalid
 * @throws Error if chainId, type, or version doesn't match expected values
 */
export function validateHandle({
  handle,
  expectedChainId,
  expectedSolidityType,
}: ValidateHandleParameters): void {
  if (!HANDLE_PATTERN.test(handle)) {
    throw new TypeError(
      `Invalid handle format: expected 0x + 64 hex chars (32 bytes), got ${handle}`
    );
  }

  // Extract bytes from handle (skip "0x" prefix)
  const hexWithoutPrefix = handle.slice(2);

  // Bytes 26-29: chainId (4 bytes = 8 hex chars, starting at position 52)
  const chainIdHex = hexWithoutPrefix.slice(52, 60);
  const chainId = Number.parseInt(chainIdHex, 16);

  if (chainId !== expectedChainId) {
    throw new Error(
      `Handle chainId mismatch: expected ${expectedChainId}, got ${chainId}`
    );
  }

  // Byte 30: type (1 byte = 2 hex chars, starting at position 60)
  const typeCodeHex = hexWithoutPrefix.slice(60, 62);
  const typeCode = Number.parseInt(typeCodeHex, 16);
  const expectedTypeCode = SOLIDITY_TYPE_TO_CODE.get(expectedSolidityType);

  if (typeCode !== expectedTypeCode) {
    throw new Error(
      `Handle type mismatch: expected ${expectedTypeCode} (${expectedSolidityType}), got ${typeCode}`
    );
  }

  // Byte 31: version (1 byte = 2 hex chars, starting at position 62)
  const versionHex = hexWithoutPrefix.slice(62, 64);
  const version = Number.parseInt(versionHex, 16);

  if (version !== HANDLE_VERSION) {
    throw new Error(
      `Handle version mismatch: expected ${HANDLE_VERSION}, got ${version}`
    );
  }
}

/**
 * Validates and verifies an inputProof
 * format: 117 bytes hex string
 * InputProof structure:
 * - Bytes 0-31: createdAt (uint256)
 * - Bytes 32-51: ownerAddress (address)
 * - Bytes 52-116: signature EIP-712 (65 bytes)
 *
 * @throws TypeError if inputProof format is invalid
 * @throws Error if inputProof verification fails
 */
export function validateInputProof(inputProof: string): void {
  if (!INPUT_PROOF_PATTERN.test(inputProof)) {
    throw new TypeError(
      `Invalid inputProof: expected 0x + 234 hex chars (117 bytes), got ${inputProof}`
    );
  }
  // TODO: Verify inputProof using the gateway signer address inputProof = createdAt (32 bytes) || ownerAddress (20 bytes) || signature EIP-712 (65 bytes)
}

function validateStringFormat(value: string, solidityType: SolidityType): void {
  if (solidityType === 'address' && !isValidAddress(value)) {
    throw new TypeError(
      `Invalid value for address: expected 0x + 40 hex chars, got ${value}`
    );
  }

  if (solidityType === 'bytes' && !isValidHexString(value)) {
    throw new TypeError(
      `Invalid value for bytes: expected hex string (0x...), got ${value}`
    );
  }

  if (solidityType.startsWith('bytes') && solidityType !== 'bytes') {
    const size = Number.parseInt(solidityType.slice(5), 10);
    if (!isValidBytesN(value, size)) {
      throw new TypeError(
        `Invalid value for ${solidityType}: expected hex string with max ${size * 2} hex chars, got ${value}`
      );
    }
  }
}
