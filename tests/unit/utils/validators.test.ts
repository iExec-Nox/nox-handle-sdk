import { describe, it, expect } from 'vitest';
import { SOLIDITY_TYPE_TO_CODE } from '../../../src/utils/types.js';
import {
  isBaseURL,
  isEthereumAddress,
  isSubgraphURL,
  validateHandle,
  validateHandleProof,
} from '../../../src/utils/validators.js';
import { buildHandle } from '../../helpers/mocks.js';

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

describe('isSubgraphURL', () => {
  const validUrls = [
    'http://example.com',
    'https://example.com',
    'https://api.example.com',
    'http://localhost',
    'https://gateway.testnet.nox.com',
    'https://example.com/',
    'https://gateway.thegraph.com/api/subgraphs/id/abc123',
    'https://example.com/subgraphs/id/xyz',
    'https://example.com/path/to/subgraph',
    'https://example.com/path?query=1',
  ];

  for (const url of validUrls) {
    it(`should return true for valid URL: ${url}`, () => {
      expect(isSubgraphURL(url)).toBe(true);
    });
  }

  const invalidUrls = ['not-a-url', 'ftp://example.com', '', 123, undefined];

  for (const url of invalidUrls) {
    it(`should return false for invalid URL: ${String(url)}`, () => {
      expect(isSubgraphURL(url)).toBe(false);
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

describe('validateHandle', () => {
  describe('format validation', () => {
    it('accepts valid 32-byte handle', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
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
      ).toThrow('Invalid handle format: expected 0x + 64 hex chars (32 bytes)');
    });

    it('should reject handle with wrong length', () => {
      const longHandle = '0x' + 'ab'.repeat(33);
      expect(() =>
        validateHandle({
          handle: longHandle,
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

    it('rejects non-string handle', () => {
      expect(() =>
        validateHandle({
          handle: 12345,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(TypeError);
    });
  });

  describe('chain ID validation (bytes 26-29)', () => {
    it('accepts matching chain ID', () => {
      const handle = buildHandle({ chainId: 421_614, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 421_614,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });

    it('rejects mismatched chain ID', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 421_614,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Handle chainId mismatch: expected 421614, got 1');
    });

    it('should accept handle with max uint32 chain ID (0xFFFFFFFF)', () => {
      const maxChainId = 0xff_ff_ff_ff;
      const handle = buildHandle({
        chainId: maxChainId,
        typeCode: 0,
        version: 0,
      });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: maxChainId,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });
  });

  describe('type code validation (byte 30)', () => {
    for (const [type, code] of SOLIDITY_TYPE_TO_CODE.entries()) {
      it(`should accept handle with matching type ${type} (code ${code})`, () => {
        const handle = buildHandle({ chainId: 1, typeCode: code, version: 0 });
        expect(() =>
          validateHandle({
            handle,
            expectedChainId: 1,
            expectedSolidityType: type,
          })
        ).not.toThrow();
      });
    }

    it('should reject handle with mismatched type', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 }); // bool
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'uint256',
        })
      ).toThrow('Handle type mismatch: expected uint256, got bool');
    });

    it('should reject handle with reserved type code (100)', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 100, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Unknown handle type code: 100');
    });

    it('throws for reserved type code (255)', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 255, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Unknown handle type code: 255');
    });
  });

  describe('version validation (byte 31)', () => {
    it('accepts version 0', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });

    const SUPPORTED_VERSIONS = [0];
    it(`should reject handle with version other than ${SUPPORTED_VERSIONS}`, () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 1 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(
        `Unsupported handle version: 1. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
      );
    });

    it('should reject handle with version 255', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 255 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(
        `Unsupported handle version: 255. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
      );
    });
  });

  describe('cross-chain isolation', () => {
    it('should reject handle with same prehandle but different chain IDs', () => {
      const handle1 = buildHandle({
        prehandle: 'aa'.repeat(26),
        chainId: 1,
        typeCode: 0,
        version: 0,
      });
      const handle2 = buildHandle({
        prehandle: 'aa'.repeat(26),
        chainId: 2,
        typeCode: 0,
        version: 0,
      });

      expect(() =>
        validateHandle({
          handle: handle1,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();

      expect(() =>
        validateHandle({
          handle: handle2,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Handle chainId mismatch');
    });
  });
});

describe('validateHandleProof', () => {
  it('should accept valid 137-byte handleProof', () => {
    const validProof = '0x' + 'ab'.repeat(137);
    expect(() => validateHandleProof(validProof)).not.toThrow();
  });

  it('should reject handleProof with wrong length', () => {
    const shortProof = '0x' + 'ab'.repeat(100);
    expect(() => validateHandleProof(shortProof)).toThrow(TypeError);
    expect(() => validateHandleProof(shortProof)).toThrow(
      'Invalid handleProof: expected 0x + 274 hex chars (137 bytes)'
    );
  });

  it('should reject handleProof with wrong length', () => {
    const longProof = '0x' + 'ab'.repeat(150);
    expect(() => validateHandleProof(longProof)).toThrow(TypeError);
  });

  it('should reject handleProof with invalid hex characters', () => {
    const invalidProof = '0x' + 'gg'.repeat(137);
    expect(() => validateHandleProof(invalidProof)).toThrow(TypeError);
  });

  it('should reject handleProof without 0x prefix', () => {
    const noPrefix = 'ab'.repeat(137);
    expect(() => validateHandleProof(noPrefix)).toThrow(TypeError);
  });
});
