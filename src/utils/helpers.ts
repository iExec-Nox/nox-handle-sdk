/**
 * Helper utilities
 */

import type { SolidityType } from '../types/internalTypes.js';

// ============================================================================
// Types
// ============================================================================

export type JSType = 'boolean' | 'string' | 'bigint';

// ============================================================================
// Solidity to JS Type Mapping
// ============================================================================

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
export function solidityTypeToJSType(solidityType: SolidityType): JSType {
  switch (solidityType) {
    case 'bool': {
      return 'boolean';
    }
    case 'string':
    case 'address':
    case 'bytes': {
      return 'string';
    }
    default: {
      // bytesN (bytes1-bytes32) → string
      if (solidityType.startsWith('bytes')) {
        return 'string';
      }
      // uint* / int* → bigint
      return 'bigint';
    }
  }
}
