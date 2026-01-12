import { describe, expect, it } from 'vitest';
import { hexToBytes } from '../../../src/utils/hexToBytes.js';

describe('hexToBytes', () => {
  describe('with valid hex strings', () => {
    const testCases: { hex: string; expected: number[] }[] = [
      { hex: '', expected: [] },
      { hex: '00', expected: [0] },
      { hex: '0f', expected: [15] },
      { hex: '1234', expected: [18, 52] },
      { hex: 'abcdef', expected: [171, 205, 239] },
      { hex: 'deadbeef', expected: [222, 173, 190, 239] },
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
      '0', // Odd length
      '0g', // Non-hex characters
      '0x1234', // 0x prefix
      '12 34', // Space in string
    ];

    for (const hex of invalidHexStrings) {
      it(`should throw an error for invalid hex string: ${hex}`, () => {
        expect(() => hexToBytes(hex)).toThrowError(TypeError);
      });
    }
  });
});
