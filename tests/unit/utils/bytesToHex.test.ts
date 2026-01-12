import { describe, it, expect } from 'vitest';
import { bytesToHex } from '../../../src/utils/bytesToHex.js';

describe('bytesToHex', () => {
  describe('with valid Uint8Array inputs', () => {
    const testCases: { bytes: Uint8Array; expected: string }[] = [
      { bytes: new Uint8Array([]), expected: '' },
      { bytes: new Uint8Array([0]), expected: '00' },
      { bytes: new Uint8Array([15]), expected: '0f' },
      { bytes: new Uint8Array([18, 52]), expected: '1234' },
      { bytes: new Uint8Array([171, 205, 239]), expected: 'abcdef' },
      { bytes: new Uint8Array([222, 173, 190, 239]), expected: 'deadbeef' },
    ];

    for (const { bytes, expected } of testCases) {
      it(`should convert [${[...bytes].join(', ')}] to ${expected}`, () => {
        const result = bytesToHex(bytes);
        expect(result).toBe(expected);
      });
    }
  });
});
