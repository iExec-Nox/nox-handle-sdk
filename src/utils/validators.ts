/**
 * Input validation utilities
 */

import {
  SOLIDITY_TYPES_SET,
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
