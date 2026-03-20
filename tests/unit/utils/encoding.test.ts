import { describe, it, expect } from 'vitest';
import type { SolidityType, HexString } from '../../../src/index.js';
import { unpack } from '../../../src/utils/encoding.js';

describe('unpack', () => {
  describe('valid inputs', () => {
    const testCases: {
      solidityType: SolidityType;
      packed: HexString;
      unpacked: HexString;
    }[] = [
      {
        solidityType: 'bool',
        packed:
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        unpacked: '0x01',
      },
      {
        solidityType: 'address',
        packed:
          '0x0000000000000000000000001234567890abcdef1234567890abcdef12345678',
        unpacked: '0x1234567890abcdef1234567890abcdef12345678',
      },
      {
        solidityType: 'uint8',
        packed:
          '0x0000000000000000000000000000000000000000000000000000000000000042',
        unpacked: '0x42',
      },
      {
        solidityType: 'uint256',
        packed:
          '0x0000000000000000000000000000000000000000000000000000000000000042',
        unpacked:
          '0x0000000000000000000000000000000000000000000000000000000000000042',
      },
      {
        solidityType: 'int8',
        packed:
          '0x0000000000000000000000000000000000000000000000000000000000000042',
        unpacked: '0x42',
      },
      {
        solidityType: 'int16',
        packed:
          '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa',
        // negative int16 value
        unpacked: '0xfffa',
      },
      {
        solidityType: 'int256',
        packed:
          '0x0000000000000000000000000000000000000000000000000000000000000042',
        unpacked:
          '0x0000000000000000000000000000000000000000000000000000000000000042',
      },
      {
        solidityType: 'bytes1',
        packed:
          '0x4200000000000000000000000000000000000000000000000000000000000000',
        unpacked: '0x42',
      },
      {
        solidityType: 'bytes32',
        packed:
          '0x0000000000000000000000000000000000000000000000000000000000000042',
        unpacked:
          '0x0000000000000000000000000000000000000000000000000000000000000042',
      },
      {
        solidityType: 'bytes',
        packed:
          '0x000000000000000000000000000000000000000000000000000000000000000f00abcd0000000000000000000000000000000000000000000000000000000000',
        unpacked: '0x00abcd000000000000000000000000',
      },
      {
        solidityType: 'string',
        packed:
          '0x000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000',
        unpacked: '0x68656c6c6f',
      },
    ];

    for (const { solidityType, packed, unpacked } of testCases) {
      it(`should unpack ${solidityType} correctly`, () => {
        const result = unpack(packed, solidityType);
        expect(result).toBe(unpacked);
      });
    }
  });

  describe('invalid inputs', () => {
    const testCases: {
      solidityType: SolidityType;
      packed: HexString;
      error: string;
    }[] = [
      {
        solidityType: 'address',
        packed:
          '0x000000000000000000000001234567890abcdef1234567890abcdef1234567', // 19 bytes instead of 20
        error: 'Invalid hex string format',
      },
      {
        solidityType: 'bytes',
        packed: '0X' as unknown as HexString,
        error: 'Invalid hex string format',
      },
      {
        solidityType: 'bytes',
        packed:
          '0x00000000000000000000000001234567890abcdef1234567890abcdef123456700',
        error: 'Invalid hex string format',
      },
      {
        solidityType: 'address',
        packed:
          '0x10000000000000000000000001234567890abcdef1234567890abcdef1234567', // non-zero-padded 20-byte value
        error: 'Invalid padding',
      },
      {
        solidityType: 'bytes',
        packed:
          '0x000000000000000000000000000000000000000000000000000000000000000f00abcd0000000000000000000000000000000000000000000000000000000001',
        error: 'Invalid padding',
      },
      {
        solidityType: 'bytes1',
        packed:
          '0x1000000000000000000000000000000000000000000000000000000000000001',
        error: 'Invalid padding',
      },
      {
        solidityType: 'string',
        packed:
          '0x0000000000000000000000000000000000000000000000000000000000000023546869732061206e65772073656e74656e636520746f20626520656e63727970',
        error: 'Invalid value length',
      },
      {
        solidityType: 'bytes',
        packed:
          '0x0000000000000000000000000000000000000000000000000000000000000023546869732061206e65772073656e74656e636520746f20626520656e63727970',
        error: 'Invalid value length',
      },
    ];

    for (const { solidityType, packed, error } of testCases) {
      it(`should throw for invalid packed ${solidityType} (${error}) input`, () => {
        expect(() => unpack(packed, solidityType)).toThrow(
          new TypeError(error)
        );
      });
    }
  });
});
