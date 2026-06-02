import { describe, it, expect } from 'vitest';
import { SOLIDITY_TYPE_TO_CODE } from '../../../src/utils/types.js';
import {
  isBaseURL,
  isEthereumAddress,
  isSubgraphURL,
  isValidHandleFormat,
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
        })
      ).not.toThrow();
    });
  });

  describe('chain ID validation (bytes 1-4)', () => {
    it('rejects zero handle (chainId=0 ≠ expectedChainId)', () => {
      const zeroHandle = '0x' + '00'.repeat(32);
      expect(() =>
        validateHandle({
          handle: zeroHandle,
          expectedChainId: 1,
        })
      ).toThrow(
        'Invalid handle format: Handle chainId mismatch: expected 1, got 0'
      );
    });

    it('accepts matching chain ID', () => {
      const handle = buildHandle({ chainId: 421_614, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 421_614,
        })
      ).not.toThrow();
    });

    it('rejects mismatched chain ID', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 421_614,
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
        })
      ).not.toThrow();
    });
  });

  describe('type code validation (byte 5)', () => {
    for (const [type, code] of SOLIDITY_TYPE_TO_CODE.entries()) {
      it(`should accept handle with matching type ${type} (code ${code})`, () => {
        const handle = buildHandle({ chainId: 1, typeCode: code, version: 0 });
        expect(() =>
          validateHandle({
            handle,
            expectedChainId: 1,
          })
        ).not.toThrow();
      });
    }

    it('should reject handle with reserved type code (100)', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 100, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
        })
      ).toThrow('Unknown handle type code: 100');
    });

    it('throws for reserved type code (255)', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 255, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
        })
      ).toThrow('Unknown handle type code: 255');
    });
  });

  describe('attribute validation (byte 6)', () => {
    it('should accept handle with supported attribute (0)', () => {
      const handle = buildHandle({
        chainId: 1,
        typeCode: 0,
        version: 0,
        attribute: 0,
      });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
        })
      ).not.toThrow();
    });

    it('should accept handle with supported attribute (1)', () => {
      const handle = buildHandle({
        chainId: 1,
        typeCode: 0,
        version: 0,
        attribute: 1,
      });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
        })
      ).not.toThrow();
    });

    it('should reject handle with unsupported attribute', () => {
      const handle = buildHandle({
        chainId: 1,
        typeCode: 0,
        version: 0,
        attribute: 2 as any,
      });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
        })
      ).toThrow(`Unsupported handle attribute: expected one of [0,1], got 2`);
    });
  });

  describe('version validation (byte 0)', () => {
    it('accepts version 0', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
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
        })
      ).toThrow(
        `Unsupported handle version: 255. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
      );
    });
  });

  describe('cross-chain isolation', () => {
    it('should reject handle with same prehandle but different chain IDs', () => {
      const handle1 = buildHandle({
        prehandle: 'aa'.repeat(25),
        chainId: 1,
        typeCode: 0,
        version: 0,
      });
      const handle2 = buildHandle({
        prehandle: 'aa'.repeat(25),
        chainId: 2,
        typeCode: 0,
        version: 0,
      });

      expect(() =>
        validateHandle({
          handle: handle1,
          expectedChainId: 1,
        })
      ).not.toThrow();

      expect(() =>
        validateHandle({
          handle: handle2,
          expectedChainId: 1,
        })
      ).toThrow('Handle chainId mismatch');
    });
  });
});

describe('isValidHandleFormat', () => {
  describe('returns true for valid handles', () => {
    it('accepts a well-formed handle', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
      expect(isValidHandleFormat(handle)).toBe(true);
    });

    it('accepts handles for every supported Solidity type', () => {
      for (const [, code] of SOLIDITY_TYPE_TO_CODE.entries()) {
        const handle = buildHandle({ chainId: 1, typeCode: code, version: 0 });
        expect(isValidHandleFormat(handle)).toBe(true);
      }
    });

    it('accepts a zero handle (valid format — chainId=0 is only rejected at decrypt time)', () => {
      const zeroHandle = '0x' + '00'.repeat(32);
      expect(isValidHandleFormat(zeroHandle)).toBe(true);
    });

    it('accepts handle with attribute 0', () => {
      expect(
        isValidHandleFormat(
          buildHandle({ chainId: 1, typeCode: 0, version: 0, attribute: 0 })
        )
      ).toBe(true);
    });

    it('accepts handle with attribute 1', () => {
      expect(
        isValidHandleFormat(
          buildHandle({ chainId: 1, typeCode: 0, version: 0, attribute: 1 })
        )
      ).toBe(true);
    });
  });

  describe('returns false for bad input types', () => {
    it('rejects null', () => expect(isValidHandleFormat(null)).toBe(false));
    // @ts-expect-error - Testing runtime behavior with no argument
    it('rejects undefined', () => expect(isValidHandleFormat()).toBe(false));
    it('rejects a number', () =>
      expect(isValidHandleFormat(12_345)).toBe(false));
    it('rejects an object', () => expect(isValidHandleFormat({})).toBe(false));
  });

  describe('returns false for malformed hex strings', () => {
    it('rejects missing 0x prefix', () => {
      expect(isValidHandleFormat('ab'.repeat(32))).toBe(false);
    });

    it('rejects too-short handle', () => {
      expect(isValidHandleFormat('0x1234')).toBe(false);
    });

    it('rejects too-long handle', () => {
      expect(isValidHandleFormat('0x' + 'ab'.repeat(33))).toBe(false);
    });

    it('rejects non-hex characters', () => {
      expect(isValidHandleFormat('0x' + 'gg'.repeat(32))).toBe(false);
    });
  });

  describe('returns false for invalid handle fields', () => {
    it('rejects unsupported version (1)', () => {
      expect(
        isValidHandleFormat(
          buildHandle({ chainId: 1, typeCode: 0, version: 1 })
        )
      ).toBe(false);
    });

    it('rejects unsupported version (0xaa = 170)', () => {
      const handle =
        'aa' + buildHandle({ chainId: 1, typeCode: 0, version: 0 }).slice(4);
      expect(isValidHandleFormat(`0x${handle}`)).toBe(false);
    });

    it('rejects unsupported attribute (2)', () => {
      expect(
        isValidHandleFormat(
          buildHandle({
            chainId: 1,
            typeCode: 0,
            version: 0,
            attribute: 2 as never,
          })
        )
      ).toBe(false);
    });

    it('rejects reserved type code (100)', () => {
      expect(
        isValidHandleFormat(
          buildHandle({ chainId: 1, typeCode: 100, version: 0 })
        )
      ).toBe(false);
    });

    it('rejects reserved type code (255)', () => {
      expect(
        isValidHandleFormat(
          buildHandle({ chainId: 1, typeCode: 255, version: 0 })
        )
      ).toBe(false);
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
