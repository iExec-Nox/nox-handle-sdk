import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as typesModule from '../../../src/utils/types.js';
import {
  assertValidHandleFormat,
  isBaseURL,
  isEthereumAddress,
  isSubgraphURL,
  isValidHandleFormat,
} from '../../../src/utils/validators.js';

vi.mock('../../../src/utils/types.js', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../../../src/utils/types.js')>();
  return {
    ...original,
    handleToAttribute: vi.fn(),
    handleToSolidityType: vi.fn(),
    handleToVersion: vi.fn(),
  };
});

const VALID_HANDLE = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
const ZERO_HASH = ('0x' + '00'.repeat(32)) as `0x${string}`;

beforeEach(() => {
  vi.mocked(typesModule.handleToAttribute).mockReturnValue(0);
  vi.mocked(typesModule.handleToSolidityType).mockReturnValue('bool');
  vi.mocked(typesModule.handleToVersion).mockReturnValue(0);
});

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

describe('assertValidHandleFormat', () => {
  describe('not a string', () => {
    it('throws for null', () => {
      expect(() => assertValidHandleFormat(null)).toThrow(TypeError);
    });

    it('throws for undefined', () => {
      expect(() => assertValidHandleFormat(undefined)).toThrow(TypeError);
    });

    it('throws for plain object', () => {
      expect(() => assertValidHandleFormat({})).toThrow(TypeError);
    });
  });

  describe('regex failure', () => {
    it('throws for empty string', () => {
      expect(() => assertValidHandleFormat('')).toThrow(
        'Invalid handle format: expected 0x + 64 hex chars (32 bytes)'
      );
    });

    it('throws for too-short hex string', () => {
      expect(() => assertValidHandleFormat('0x123')).toThrow(
        'Invalid handle format: expected 0x + 64 hex chars (32 bytes)'
      );
    });

    it('throws for invalid hex characters', () => {
      expect(() => assertValidHandleFormat('0x' + 'GG'.repeat(32))).toThrow(
        'Invalid handle format: expected 0x + 64 hex chars (32 bytes)'
      );
    });
  });

  it('throws for uninitialized handle', () => {
    expect(() => assertValidHandleFormat(ZERO_HASH)).toThrow(
      'Invalid handle: received an uninitialized handle — ensure the handle has been stored on-chain before use'
    );
  });

  it('throws for unsupported attribute', () => {
    vi.mocked(typesModule.handleToAttribute).mockReturnValue(2);

    expect(() => assertValidHandleFormat(VALID_HANDLE)).toThrow(
      'Unsupported handle attribute: expected one of [0,1], got 2'
    );
  });

  it('throws for unknown type code', () => {
    vi.mocked(typesModule.handleToSolidityType).mockImplementation(() => {
      throw new Error('Unknown handle type code: 100');
    });

    expect(() => assertValidHandleFormat(VALID_HANDLE)).toThrow(
      'Unknown handle type code: 100'
    );
  });

  it('throws for unsupported version', () => {
    vi.mocked(typesModule.handleToVersion).mockReturnValue(1);

    expect(() => assertValidHandleFormat(VALID_HANDLE)).toThrow(
      'Unsupported handle version: 1. Supported versions: 0'
    );
  });

  it('does not throw for a well-formed handle', () => {
    expect(() => assertValidHandleFormat(VALID_HANDLE)).not.toThrow();
  });
});

describe('isValidHandleFormat', () => {
  it('returns true for a well-formed handle', () => {
    expect(isValidHandleFormat(VALID_HANDLE)).toBe(true);
  });

  it('returns false when assertValidHandleFormat would throw', () => {
    expect(isValidHandleFormat(ZERO_HASH)).toBe(false);
  });
});
