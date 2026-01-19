import { describe, it, expect } from 'vitest';
import { bytesToHex, hexToBytes, isHexString } from '../../../src/utils/hex.js';

describe('bytesToHex', () => {
  describe('with valid Uint8Array inputs', () => {
    const testCases: { bytes: Uint8Array; expected: string }[] = [
      { bytes: new Uint8Array([]), expected: '0x' },
      { bytes: new Uint8Array([0]), expected: '0x00' },
      { bytes: new Uint8Array([15]), expected: '0x0f' },
      { bytes: new Uint8Array([18, 52]), expected: '0x1234' },
      { bytes: new Uint8Array([171, 205, 239]), expected: '0xabcdef' },
      { bytes: new Uint8Array([222, 173, 190, 239]), expected: '0xdeadbeef' },
    ];

    for (const { bytes, expected } of testCases) {
      it(`should convert [${[...bytes].join(', ')}] to ${expected}`, () => {
        const result = bytesToHex(bytes);
        expect(result).toBe(expected);
      });
    }
  });
});

describe('hexToBytes', () => {
  describe('with valid hex strings', () => {
    const testCases: { hex: string; expected: number[] }[] = [
      { hex: '0x', expected: [] },
      { hex: '0x00', expected: [0] },
      { hex: '0x0f', expected: [15] },
      { hex: '0x1234', expected: [18, 52] },
      { hex: '0xabcdef', expected: [171, 205, 239] },
      { hex: '0xdeadbeef', expected: [222, 173, 190, 239] },
      { hex: '0xDEADBEEF', expected: [222, 173, 190, 239] },
    ];

    for (const { hex, expected } of testCases) {
      it(`should convert ${hex} to [${expected.join(', ')}]`, () => {
        const result = hexToBytes(hex as `0x${string}`);
        expect(result).toStrictEqual(Uint8Array.from(expected));
      });
    }
  });

  describe('with invalid hex strings', () => {
    const invalidHexStrings = [
      {
        hex: {}, // not a string
        error:
          'Invalid hex string: expected even length string with "0x" prefix, got object [object Object]',
      },
      {
        hex: '0x0', // Odd length
        error:
          'Invalid hex string: expected even length string with "0x" prefix, got string 0x0',
      },
      {
        hex: '0x0g', // Non-hex characters
        error:
          'Invalid hex string: expected even length string with "0x" prefix, got string 0x0g',
      },
      {
        hex: '1234', // Missing 0x prefix
        error:
          'Invalid hex string: expected even length string with "0x" prefix, got string 1234',
      },
      {
        hex: '0x12 34', // Space in string
        error:
          'Invalid hex string: expected even length string with "0x" prefix, got string 0x12 34',
      },
    ];

    for (const { hex, error } of invalidHexStrings) {
      it(`should throw an error for invalid hex string: ${hex}`, () => {
        expect(() => hexToBytes(hex as `0x${string}`)).toThrowError(
          new TypeError(error)
        );
      });
    }
  });
});

describe('isHexString', () => {
  const validHexStrings = [
    '0x',
    '0x00',
    '0x0f',
    '0x1234',
    '0xabcdef',
    '0xDEADBEEF',
  ];

  for (const hex of validHexStrings) {
    it(`should return true for valid hex string: ${hex}`, () => {
      const result = isHexString(hex as `0x${string}`);
      expect(result).toBe(true);
    });
  }

  const invalidHexStrings = [
    undefined,
    // eslint-disable-next-line unicorn/no-null
    null,
    {},
    '0x0',
    '0x0g',
    '1234',
    '0x12 34',
    1234,
    true,
  ];

  for (const hex of invalidHexStrings) {
    it(`should return false for invalid hex string: ${String(hex)}`, () => {
      const result = isHexString(hex);
      expect(result).toBe(false);
    });
  }
});
