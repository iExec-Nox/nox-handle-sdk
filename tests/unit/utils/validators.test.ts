import { describe, it, expect } from 'vitest';
import {
  isBaseURL,
  isEthereumAddress,
  validateSolidityType,
  validateInputValue,
  validateHandle,
  validateInputProof,
} from '../../../src/utils/validators.js';

// ============================================================================
// isBaseURL
// ============================================================================

describe('isBaseURL', () => {
  const validUrls = [
    'http://example.com',
    'https://example.com',
    'https://api.example.com',
    'http://localhost',
    'https://gateway.testnet.nox.com',
    'https://example.com/', // trailing slash is valid
  ];

  for (const url of validUrls) {
    it(`should return true for valid URL: ${url}`, () => {
      expect(isBaseURL(url)).toBe(true);
    });
  }

  const invalidUrls = [
    'not-a-url',
    'ftp://example.com',
    'https://example.com/path',
    'https://example.com?query=1',
    'https://example.com/path?query=1',
    '',
    123,
    undefined,
    undefined,
  ];

  for (const url of invalidUrls) {
    it(`should return false for invalid URL: ${String(url)}`, () => {
      expect(isBaseURL(url)).toBe(false);
    });
  }
});

// ============================================================================
// isEthereumAddress
// ============================================================================

describe('isEthereumAddress', () => {
  const validAddresses = [
    '0x1234567890123456789012345678901234567890',
    '0xabcdef1234567890abcdef1234567890abcdef12',
    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  ];

  for (const address of validAddresses) {
    it(`should return true for valid address: ${address}`, () => {
      expect(isEthereumAddress(address)).toBe(true);
    });
  }

  const invalidAddresses = [
    '0x1234', // too short
    '0x123456789012345678901234567890123456789', // 39 chars
    '0x12345678901234567890123456789012345678901', // 41 chars
    '1234567890123456789012345678901234567890', // no 0x prefix
    '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // invalid hex
    '',
    123,
    undefined,
    undefined,
  ];

  for (const address of invalidAddresses) {
    it(`should return false for invalid address: ${String(address)}`, () => {
      expect(isEthereumAddress(address)).toBe(false);
    });
  }
});

// ============================================================================
// validateSolidityType
// ============================================================================

describe('validateSolidityType', () => {
  const validTypes = [
    'bool',
    'address',
    'string',
    'bytes',
    'uint256',
    'int128',
    'bytes32',
  ];

  for (const type of validTypes) {
    it(`should not throw for valid type: ${type}`, () => {
      expect(() => validateSolidityType(type)).not.toThrow();
    });
  }

  const invalidTypes = [
    'uint7',
    'int3',
    'bytes33',
    'boolean',
    'number',
    'uint',
    '',
  ];

  for (const type of invalidTypes) {
    it(`should throw TypeError for invalid type: ${type}`, () => {
      expect(() => validateSolidityType(type)).toThrow(TypeError);
      expect(() => validateSolidityType(type)).toThrow(
        `Invalid Solidity type: ${type}`
      );
    });
  }
});

// ============================================================================
// validateInputValue
// ============================================================================

describe('validateInputValue', () => {
  describe('bool type', () => {
    it('should accept boolean values', () => {
      expect(() => validateInputValue(true, 'bool')).not.toThrow();
      expect(() => validateInputValue(false, 'bool')).not.toThrow();
    });

    it('should reject non-boolean values', () => {
      expect(() => validateInputValue('true', 'bool')).toThrow(TypeError);
      expect(() => validateInputValue(1n, 'bool')).toThrow(TypeError);
    });
  });

  describe('string type', () => {
    it('should accept string values', () => {
      expect(() => validateInputValue('hello', 'string')).not.toThrow();
      expect(() => validateInputValue('', 'string')).not.toThrow();
    });

    it('should reject non-string values', () => {
      expect(() => validateInputValue(true, 'string')).toThrow(TypeError);
      expect(() => validateInputValue(123n, 'string')).toThrow(TypeError);
    });
  });

  describe('address type', () => {
    it('should accept valid addresses', () => {
      expect(() =>
        validateInputValue(
          '0x1234567890123456789012345678901234567890',
          'address'
        )
      ).not.toThrow();
    });

    it('should reject invalid addresses', () => {
      expect(() => validateInputValue('0x1234', 'address')).toThrow(TypeError);
      expect(() => validateInputValue('invalid', 'address')).toThrow(TypeError);
    });
  });

  describe('uint types', () => {
    it('should accept bigint values', () => {
      expect(() => validateInputValue(123n, 'uint256')).not.toThrow();
      expect(() => validateInputValue(0n, 'uint8')).not.toThrow();
    });

    it('should reject non-bigint values', () => {
      expect(() => validateInputValue('123', 'uint256')).toThrow(TypeError);
      expect(() => validateInputValue(123 as never, 'uint256')).toThrow(
        TypeError
      );
    });
  });
});

// ============================================================================
// validateHandle
// ============================================================================
// Helper to build a valid handle
// Handle structure: prehandle (26 bytes) + chainId (4 bytes) + type (1 byte) + version (1 byte)
function buildHandle(
  chainId: number,
  typeCode: number,
  version: number
): string {
  const prehandle = 'ab'.repeat(26); // 26 bytes = 52 hex chars
  const chainIdHex = chainId.toString(16).padStart(8, '0'); // 4 bytes = 8 hex chars
  const typeHex = typeCode.toString(16).padStart(2, '0'); // 1 byte = 2 hex chars
  const versionHex = version.toString(16).padStart(2, '0'); // 1 byte = 2 hex chars
  return `0x${prehandle}${chainIdHex}${typeHex}${versionHex}`;
}

describe('validateHandle', () => {
  describe('format validation', () => {
    it('should accept valid 32-byte handle', () => {
      const handle = buildHandle(1, 0, 0); // chainId=1, type=bool(0), version=0
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });

    it('should reject handle with wrong length', () => {
      expect(() =>
        validateHandle({
          handle: '0x1234',
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(TypeError);
      expect(() =>
        validateHandle({
          handle: '0x1234',
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Invalid handle format');
    });

    it('should reject handle with invalid hex characters', () => {
      const invalidHandle = '0x' + 'gg'.repeat(32);
      expect(() =>
        validateHandle({
          handle: invalidHandle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(TypeError);
    });
  });

  describe('chainId validation', () => {
    it('should accept matching chainId', () => {
      const handle = buildHandle(421_614, 0, 0); // Arbitrum Sepolia
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 421_614,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });

    it('should reject mismatched chainId', () => {
      const handle = buildHandle(1, 0, 0);
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 421_614, // wrong chainId
          expectedSolidityType: 'bool',
        })
      ).toThrow('Handle chainId mismatch: expected 421614, got 1');
    });
  });

  describe('type validation', () => {
    const typeCases: Array<{
      type: Parameters<typeof validateHandle>[0]['expectedSolidityType'];
      code: number;
    }> = [
      { type: 'bool', code: 0 },
      { type: 'address', code: 1 },
      { type: 'bytes', code: 2 },
      { type: 'string', code: 3 },
      { type: 'uint8', code: 4 },
      { type: 'uint256', code: 35 },
      { type: 'int256', code: 67 },
      { type: 'bytes32', code: 99 },
    ];

    for (const { type, code } of typeCases) {
      it(`should accept matching type ${type} (code ${code})`, () => {
        const handle = buildHandle(1, code, 0);
        expect(() =>
          validateHandle({
            handle,
            expectedChainId: 1,
            expectedSolidityType: type,
          })
        ).not.toThrow();
      });
    }

    it('should reject mismatched type', () => {
      const handle = buildHandle(1, 0, 0); // bool = 0
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'uint256', // expects 35
        })
      ).toThrow('Handle type mismatch: expected 35 (uint256), got 0');
    });
  });

  describe('version validation', () => {
    it('should accept version 0', () => {
      const handle = buildHandle(1, 0, 0);
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });

    it('should reject non-zero version', () => {
      const handle = buildHandle(1, 0, 1); // version = 1
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Handle version mismatch: expected 0, got 1');
    });
  });
});

// ============================================================================
// validateInputProof
// ============================================================================

describe('validateInputProof', () => {
  it('should accept valid 117-byte inputProof', () => {
    const validProof = '0x' + 'ab'.repeat(117);
    expect(() => validateInputProof(validProof)).not.toThrow();
  });

  it('should reject inputProof with wrong length', () => {
    const shortProof = '0x' + 'ab'.repeat(100);
    expect(() => validateInputProof(shortProof)).toThrow(TypeError);
    expect(() => validateInputProof(shortProof)).toThrow(
      'Invalid inputProof: expected 0x + 234 hex chars (117 bytes)'
    );

    const longProof = '0x' + 'ab'.repeat(120);
    expect(() => validateInputProof(longProof)).toThrow(TypeError);
  });

  it('should reject inputProof with invalid hex characters', () => {
    const invalidProof = '0x' + 'gg'.repeat(117);
    expect(() => validateInputProof(invalidProof)).toThrow(TypeError);
  });

  it('should reject inputProof without 0x prefix', () => {
    const noPrefix = 'ab'.repeat(117);
    expect(() => validateInputProof(noPrefix)).toThrow(TypeError);
  });
});
