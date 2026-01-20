import { describe, it, expect } from 'vitest';
import {
  bytesToHex,
  hexToBytes,
  hexToIntX,
  hexToUintX,
  intXToHex,
  isHexString,
  uintXToHex,
} from '../../../src/utils/hex.js';

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

  describe('with byteSize specified', () => {
    const testCases: { hex: string; byteSize: number; expected: boolean }[] = [
      { hex: '0x00', byteSize: 1, expected: true },
      { hex: '0x1234', byteSize: 1, expected: false },
      {
        hex: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        byteSize: 32,
        expected: true,
      },
    ];
    for (const { hex, byteSize, expected } of testCases) {
      it(`should return ${expected} for hex string ${hex} with byteSize ${byteSize}`, () => {
        const result = isHexString(hex as `0x${string}`, byteSize);
        expect(result).toBe(expected);
      });
    }
  });
});

describe('uintXToHex', () => {
  const testCases: { value: bigint; bitSize: number; expected: string }[] = [
    { value: 0n, bitSize: 8, expected: '0x00' },
    { value: 255n, bitSize: 8, expected: '0xff' },
    { value: 255n, bitSize: 16, expected: '0x00ff' },
    { value: 4660n, bitSize: 16, expected: '0x1234' },
    { value: 305_419_896n, bitSize: 32, expected: '0x12345678' },
    {
      value: 18_446_744_073_709_551_615n,
      bitSize: 64,
      expected: '0xffffffffffffffff',
    },
    {
      value: 0n,
      bitSize: 256,
      expected:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    {
      value:
        115_792_089_237_316_195_423_570_985_008_687_907_853_269_984_665_640_564_039_457_584_007_913_129_639_935n,
      bitSize: 256,
      expected:
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    },
  ];

  for (const { value, bitSize, expected } of testCases) {
    it(`should convert ${value} to hex string ${expected} for uint${bitSize}`, () => {
      const result = uintXToHex(value, bitSize);
      expect(result).toBe(expected);
    });
  }

  describe('out of range values', () => {
    const outOfRangeCases: { value: bigint; bitSize: number }[] = [
      { value: 256n, bitSize: 8 },
      { value: 65_536n, bitSize: 16 },
      { value: 4_294_967_296n, bitSize: 32 },
      { value: 18_446_744_073_709_551_616n, bitSize: 64 },
      {
        value:
          115_792_089_237_316_195_423_570_985_008_687_907_853_269_984_665_640_564_039_457_584_007_913_129_639_936n,
        bitSize: 256,
      },
    ];

    for (const { value, bitSize } of outOfRangeCases) {
      it(`should throw RangeError for out of range value ${value} for uint${bitSize}`, () => {
        expect(() => uintXToHex(value, bitSize)).toThrowError(RangeError);
      });
    }
  });

  describe('invalid bitSizes', () => {
    const invalidBitSizes = [
      {
        bitSize: 0,
        reason: 'zero',
      },
      {
        bitSize: -8,
        reason: 'negative',
      },
      {
        bitSize: 7,
        reason: 'not a multiple of 8',
      },
      {
        bitSize: 8.1,
        reason: 'not an integer',
      },
      {
        bitSize: 264,
        reason: 'greater than 256',
      },
    ];

    for (const { bitSize, reason } of invalidBitSizes) {
      it(`should throw RangeError when bitSize is ${reason}`, () => {
        expect(() => uintXToHex(0n, bitSize)).toThrowError(RangeError);
      });
    }
  });
});

describe('hexToUintX', () => {
  const testCases: { hex: string; bitSize: number; expected: bigint }[] = [
    { hex: '0x00', bitSize: 8, expected: 0n },
    { hex: '0xff', bitSize: 8, expected: 255n },
    { hex: '0x00ff', bitSize: 16, expected: 255n },
    { hex: '0x1234', bitSize: 16, expected: 4660n },
    { hex: '0x12345678', bitSize: 32, expected: 305_419_896n },
    {
      hex: '0xffffffffffffffff',
      bitSize: 64,
      expected: 18_446_744_073_709_551_615n,
    },
    {
      hex: '0x0000000000000000000000000000000000000000000000000000000000000000',
      bitSize: 256,
      expected: 0n,
    },
  ];

  for (const { hex, bitSize, expected } of testCases) {
    it(`should convert hex string ${hex} to ${expected} for uint${bitSize}`, () => {
      const result = hexToUintX(hex as `0x${string}`, bitSize);
      expect(result).toBe(expected);
    });
  }

  describe('invalid bitSizes', () => {
    const invalidBitSizes = [
      {
        bitSize: 0,
        reason: 'zero',
      },
      {
        bitSize: -8,
        reason: 'negative',
      },
      {
        bitSize: 7,
        reason: 'not a multiple of 8',
      },
      {
        bitSize: 8.1,
        reason: 'not an integer',
      },
      {
        bitSize: 264,
        reason: 'greater than 256',
      },
    ];

    for (const { bitSize, reason } of invalidBitSizes) {
      it(`should throw RangeError when bitSize is ${reason}`, () => {
        expect(() => hexToUintX('0x00' as `0x${string}`, bitSize)).toThrowError(
          RangeError
        );
      });
    }
  });

  describe('hex length mismatch', () => {
    const mismatchCases: { hex: string; bitSize: number }[] = [
      { hex: '0x0000', bitSize: 8 },
      { hex: '0x00', bitSize: 16 },
      { hex: '0x0', bitSize: 8 },
    ];
    for (const { hex, bitSize } of mismatchCases) {
      it(`should throw TypeError for hex string ${hex} with bitSize ${bitSize}`, () => {
        expect(() => hexToUintX(hex as `0x${string}`, bitSize)).toThrowError(
          TypeError
        );
      });
    }
  });
});

describe('intXToHex', () => {
  const testCases: { value: bigint; bitSize: number; expected: string }[] = [
    { value: 0n, bitSize: 8, expected: '0x00' },
    { value: 127n, bitSize: 8, expected: '0x7f' },
    { value: -128n, bitSize: 8, expected: '0x80' },
    { value: -1n, bitSize: 8, expected: '0xff' },
    { value: 32_767n, bitSize: 16, expected: '0x7fff' },
    { value: -32_768n, bitSize: 16, expected: '0x8000' },
    { value: -1n, bitSize: 16, expected: '0xffff' },
    { value: 2_147_483_647n, bitSize: 32, expected: '0x7fffffff' },
    { value: -2_147_483_648n, bitSize: 32, expected: '0x80000000' },
    { value: -1n, bitSize: 32, expected: '0xffffffff' },
    {
      value: 9_223_372_036_854_775_807n,
      bitSize: 64,
      expected: '0x7fffffffffffffff',
    },
    {
      value: -9_223_372_036_854_775_808n,
      bitSize: 64,
      expected: '0x8000000000000000',
    },
    {
      value: -1n,
      bitSize: 64,
      expected: '0xffffffffffffffff',
    },
    {
      value: 0n,
      bitSize: 256,
      expected:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    {
      value:
        57_896_044_618_658_097_711_785_492_504_343_953_926_634_992_332_820_282_019_728_792_003_956_564_819_967n,
      bitSize: 256,
      expected:
        '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    },
    {
      value:
        -57_896_044_618_658_097_711_785_492_504_343_953_926_634_992_332_820_282_019_728_792_003_956_564_819_968n,
      bitSize: 256,
      expected:
        '0x8000000000000000000000000000000000000000000000000000000000000000',
    },
  ];

  for (const { value, bitSize, expected } of testCases) {
    it(`should convert ${value} to hex string ${expected} for int${bitSize}`, () => {
      const result = intXToHex(value, bitSize);
      expect(result).toBe(expected);
    });
  }

  describe('out of range values', () => {
    const outOfRangeCases: { value: bigint; bitSize: number }[] = [
      { value: 128n, bitSize: 8 },
      { value: -129n, bitSize: 8 },
      { value: 32_768n, bitSize: 16 },
      { value: -32_769n, bitSize: 16 },
      { value: 2_147_483_648n, bitSize: 32 },
      { value: -2_147_483_649n, bitSize: 32 },
      { value: 9_223_372_036_854_775_808n, bitSize: 64 },
      { value: -9_223_372_036_854_775_809n, bitSize: 64 },
    ];

    for (const { value, bitSize } of outOfRangeCases) {
      it(`should throw RangeError for out of range value ${value} for int${bitSize}`, () => {
        expect(() => intXToHex(value, bitSize)).toThrowError(RangeError);
      });
    }
  });

  describe('invalid bitSizes', () => {
    const invalidBitSizes = [
      {
        bitSize: 0,
        reason: 'zero',
      },
      {
        bitSize: -8,
        reason: 'negative',
      },
      {
        bitSize: 7,
        reason: 'not a multiple of 8',
      },
      {
        bitSize: 8.1,
        reason: 'not an integer',
      },
      {
        bitSize: 264,
        reason: 'greater than 256',
      },
    ];

    for (const { bitSize, reason } of invalidBitSizes) {
      it(`should throw RangeError when bitSize is ${reason}`, () => {
        expect(() => intXToHex(0n, bitSize)).toThrowError(RangeError);
      });
    }
  });
});

describe('hexToIntX', () => {
  const testCases: { hex: string; bitSize: number; expected: bigint }[] = [
    { hex: '0x00', bitSize: 8, expected: 0n },
    { hex: '0x7f', bitSize: 8, expected: 127n },
    { hex: '0x80', bitSize: 8, expected: -128n },
    { hex: '0xff', bitSize: 8, expected: -1n },
    { hex: '0x7fff', bitSize: 16, expected: 32_767n },
    { hex: '0x8000', bitSize: 16, expected: -32_768n },
    { hex: '0xffff', bitSize: 16, expected: -1n },
    { hex: '0x7fffffff', bitSize: 32, expected: 2_147_483_647n },
    { hex: '0x80000000', bitSize: 32, expected: -2_147_483_648n },
    { hex: '0xffffffff', bitSize: 32, expected: -1n },
    {
      hex: '0x7fffffffffffffff',
      bitSize: 64,
      expected: 9_223_372_036_854_775_807n,
    },
    {
      hex: '0x8000000000000000',
      bitSize: 64,
      expected: -9_223_372_036_854_775_808n,
    },
    {
      hex: '0xffffffffffffffff',
      bitSize: 64,
      expected: -1n,
    },
    {
      hex: '0x0000000000000000000000000000000000000000000000000000000000000000',
      bitSize: 256,
      expected: 0n,
    },
    {
      hex: '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      bitSize: 256,
      expected:
        57_896_044_618_658_097_711_785_492_504_343_953_926_634_992_332_820_282_019_728_792_003_956_564_819_967n,
    },
    {
      hex: '0x8000000000000000000000000000000000000000000000000000000000000000',
      bitSize: 256,
      expected:
        -57_896_044_618_658_097_711_785_492_504_343_953_926_634_992_332_820_282_019_728_792_003_956_564_819_968n,
    },
  ];

  for (const { hex, bitSize, expected } of testCases) {
    it(`should convert hex string ${hex} to ${expected} for int${bitSize}`, () => {
      const result = hexToIntX(hex as `0x${string}`, bitSize);
      expect(result).toBe(expected);
    });
  }

  describe('invalid bitSizes', () => {
    const invalidBitSizes = [
      {
        bitSize: 0,
        reason: 'zero',
      },
      {
        bitSize: -8,
        reason: 'negative',
      },
      {
        bitSize: 7,
        reason: 'not a multiple of 8',
      },
      {
        bitSize: 8.1,
        reason: 'not an integer',
      },
      {
        bitSize: 264,
        reason: 'greater than 256',
      },
    ];

    for (const { bitSize, reason } of invalidBitSizes) {
      it(`should throw RangeError when bitSize is ${reason}`, () => {
        expect(() => hexToIntX('0x00' as `0x${string}`, bitSize)).toThrowError(
          RangeError
        );
      });
    }
  });

  describe('hex length mismatch', () => {
    const mismatchCases: { hex: string; bitSize: number }[] = [
      { hex: '0x0000', bitSize: 8 },
      { hex: '0x00', bitSize: 16 },
      { hex: '0x0', bitSize: 8 },
    ];

    for (const { hex, bitSize } of mismatchCases) {
      it(`should throw TypeError for hex string ${hex} with bitSize ${bitSize}`, () => {
        expect(() => hexToIntX(hex as `0x${string}`, bitSize)).toThrowError(
          TypeError
        );
      });
    }
  });
});
