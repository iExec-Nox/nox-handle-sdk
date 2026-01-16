/**
 * Input validation utilities
 */

import {
  SOLIDITY_TYPES,
  type InputValue,
  type SolidityType,
} from '../types/internalTypes.js';

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
  if (!SOLIDITY_TYPES.includes(type as SolidityType)) {
    throw new TypeError(`Invalid Solidity type: ${type}`);
  }
}

// ============================================================================
// Input Value Validation
// ============================================================================

/** Validation patterns */
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const HEX_STRING_PATTERN = /^0x[0-9a-fA-F]*$/;

/** Type check helpers */
const isBoolean = (v: InputValue): v is boolean => typeof v === 'boolean';
const isString = (v: InputValue): v is string => typeof v === 'string';
const isBigint = (v: InputValue): v is bigint => typeof v === 'bigint';
const isAddress = (v: InputValue): boolean =>
  isString(v) && ADDRESS_PATTERN.test(v);
const isHexString = (v: InputValue): boolean =>
  isString(v) && HEX_STRING_PATTERN.test(v);

/**
 * Validates that the value matches the expected Solidity type
 * @throws TypeError if value doesn't match the type
 */
export function validateInputValue(
  value: InputValue,
  solidityType: SolidityType
): void {
  switch (solidityType) {
    case 'bool': {
      if (!isBoolean(value)) {
        throw new TypeError(
          `Invalid value for bool: expected boolean, got ${typeof value}`
        );
      }
      break;
    }
    case 'string': {
      if (!isString(value)) {
        throw new TypeError(
          `Invalid value for string: expected string, got ${typeof value}`
        );
      }
      break;
    }
    case 'address': {
      if (!isAddress(value)) {
        throw new TypeError(
          `Invalid value for address: expected 0x + 40 hex chars, got ${value}`
        );
      }
      break;
    }
    case 'bytes': {
      if (!isHexString(value)) {
        throw new TypeError(
          `Invalid value for bytes: expected hex string (0x...), got ${value}`
        );
      }
      break;
    }
    default: {
      validateBytesOrInteger(value, solidityType);
    }
  }
}

function validateBytesOrInteger(
  value: InputValue,
  solidityType: SolidityType
): void {
  // bytesN → 0x + up to N*2 hex chars
  if (solidityType.startsWith('bytes')) {
    const size = Number.parseInt(solidityType.slice(5), 10);
    const maxLength = 2 + size * 2;
    if (!isHexString(value) || (value as string).length > maxLength) {
      throw new TypeError(
        `Invalid value for ${solidityType}: expected hex string with max ${size * 2} hex chars, got ${value}`
      );
    }
    return;
  }

  // uint* / int* → bigint
  if (!isBigint(value)) {
    throw new TypeError(
      `Invalid value for ${solidityType}: expected bigint, got ${typeof value}`
    );
  }
}
