import { describe, it, expect } from 'vitest';
import {
  isBaseURL,
  isEthereumAddress,
  validateHandle,
  validateInputProof,
} from '../../../src/utils/validators.js';

describe('isBaseURL', () => {
  const validUrls = [
    'http://example.com',
    'https://example.com',
    'https://api.example.com',
    'http://localhost',
    'https://gateway.testnet.nox.com',
    'https://example.com/',
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
  ];

  for (const url of invalidUrls) {
    it(`should return false for invalid URL: ${String(url)}`, () => {
      expect(isBaseURL(url)).toBe(false);
    });
  }
});

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
    '0x1234',
    '0x123456789012345678901234567890123456789',
    '0x12345678901234567890123456789012345678901',
    '1234567890123456789012345678901234567890',
    '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    '',
    123,
    undefined,
  ];

  for (const address of invalidAddresses) {
    it(`should return false for invalid address: ${String(address)}`, () => {
      expect(isEthereumAddress(address)).toBe(false);
    });
  }
});

function buildHandle(
  chainId: number,
  typeCode: number,
  version: number
): string {
  const prehandle = 'ab'.repeat(26);
  const chainIdHex = chainId.toString(16).padStart(8, '0');
  const typeHex = typeCode.toString(16).padStart(2, '0');
  const versionHex = version.toString(16).padStart(2, '0');
  return `0x${prehandle}${chainIdHex}${typeHex}${versionHex}`;
}

describe('validateHandle', () => {
  describe('format validation', () => {
    it('should accept valid 32-byte handle', () => {
      const handle = buildHandle(1, 0, 0);
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
      const handle = buildHandle(421_614, 0, 0);
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
          expectedChainId: 421_614,
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
      const handle = buildHandle(1, 0, 0);
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'uint256',
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
      const handle = buildHandle(1, 0, 1);
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

describe('validateInputProof', () => {
  it('should accept valid 137-byte inputProof', () => {
    const validProof = '0x' + 'ab'.repeat(137);
    expect(() => validateInputProof(validProof)).not.toThrow();
  });

  it('should reject inputProof with wrong length', () => {
    const shortProof = '0x' + 'ab'.repeat(100);
    expect(() => validateInputProof(shortProof)).toThrow(TypeError);
    expect(() => validateInputProof(shortProof)).toThrow(
      'Invalid inputProof: expected 0x + 274 hex chars (137 bytes)'
    );

    const longProof = '0x' + 'ab'.repeat(150);
    expect(() => validateInputProof(longProof)).toThrow(TypeError);
  });

  it('should reject inputProof with invalid hex characters', () => {
    const invalidProof = '0x' + 'gg'.repeat(137);
    expect(() => validateInputProof(invalidProof)).toThrow(TypeError);
  });

  it('should reject inputProof without 0x prefix', () => {
    const noPrefix = 'ab'.repeat(137);
    expect(() => validateInputProof(noPrefix)).toThrow(TypeError);
  });
});
