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
      '0x0', // Odd length
      '0x0g', // Non-hex characters
      '1234', // Missing 0x prefix
      '0x12 34', // Space in string
    ];

    for (const hex of invalidHexStrings) {
      it(`should throw an error for invalid hex string: ${hex}`, () => {
        expect(() => hexToBytes(hex)).toThrowError(TypeError);
      });
    }
  });
});
