import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as typesModule from '../../../src/utils/types.js';
import {
  assertValidHandleFormat,
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
