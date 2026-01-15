import { describe, expect, it } from 'vitest';
import { hexToBytes } from '../../../src/utils/hexToBytes.js';

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
        const result = hexToBytes(hex);
        expect(result).toStrictEqual(Uint8Array.from(expected));
      });
    }
  });

  describe('with invalid hex strings', () => {
    const invalidHexStrings = [
      {
        hex: '0x0', // Odd length
        error: 'Invalid hex string: length must be even',
      },
      {
        hex: '0x0g', // Non-hex characters
        error: 'Invalid hex string: contains non-hexadecimal characters',
      },
      {
        hex: '1234', // Missing 0x prefix
        error: 'Invalid hex string: missing "0x" prefix',
      },
      {
        hex: '0x12 34', // Space in string
        error: 'Invalid hex string: contains non-hexadecimal characters',
      },
    ];

    for (const { hex, error } of invalidHexStrings) {
      it(`should throw an error for invalid hex string: ${hex}`, () => {
        expect(() => hexToBytes(hex)).toThrowError(new TypeError(error));
      });
    }
  });
});
