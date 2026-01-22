import { describe, expect, it } from 'vitest';
import {
  SOLIDITY_TYPES_SET,
  SOLIDITY_TYPE_TO_CODE,
  handleToSolidityType,
  handleToChainId,
  handleToVersion,
} from '../../../src/utils/types.js';
import { buildHandle, DUMMY_TYPED_HANDLES } from '../../helpers/mocks.js';

describe('SOLIDITY_TYPES_SET', () => {
  it('contains exactly 100 types (0-99)', () => {
    expect(SOLIDITY_TYPES_SET.size).toBe(100);
  });

  it('contains special types at correct indices', () => {
    expect(SOLIDITY_TYPES_SET.has('bool')).toBe(true);
    expect(SOLIDITY_TYPES_SET.has('address')).toBe(true);
    expect(SOLIDITY_TYPES_SET.has('bytes')).toBe(true);
    expect(SOLIDITY_TYPES_SET.has('string')).toBe(true);
  });
});

describe('SOLIDITY_TYPE_TO_CODE', () => {
  it('maps special types to codes 0-3', () => {
    expect(SOLIDITY_TYPE_TO_CODE.get('bool')).toBe(0);
    expect(SOLIDITY_TYPE_TO_CODE.get('address')).toBe(1);
    expect(SOLIDITY_TYPE_TO_CODE.get('bytes')).toBe(2);
    expect(SOLIDITY_TYPE_TO_CODE.get('string')).toBe(3);
  });

  it('maps uint types to codes 4-35', () => {
    expect(SOLIDITY_TYPE_TO_CODE.get('uint8')).toBe(4);
    expect(SOLIDITY_TYPE_TO_CODE.get('uint256')).toBe(35);
  });

  it('maps int types to codes 36-67', () => {
    expect(SOLIDITY_TYPE_TO_CODE.get('int8')).toBe(36);
    expect(SOLIDITY_TYPE_TO_CODE.get('int256')).toBe(67);
  });

  it('maps bytesN types to codes 68-99', () => {
    expect(SOLIDITY_TYPE_TO_CODE.get('bytes1')).toBe(68);
    expect(SOLIDITY_TYPE_TO_CODE.get('bytes32')).toBe(99);
  });
});

describe('handleToSolidityType', () => {
  describe('valid type codes (0-99)', () => {
    for (const solidityType of SOLIDITY_TYPES_SET.values()) {
      const handle =
        DUMMY_TYPED_HANDLES[solidityType as keyof typeof DUMMY_TYPED_HANDLES];
      it(`extracts type ${solidityType} from hex code [${handle.slice(62, 64)}]`, () => {
        expect(handleToSolidityType(handle)).toBe(solidityType);
      });
    }
  });

  describe('reserved type codes (100-255)', () => {
    it('throws for type code 100', () => {
      const handle = buildHandle({ typeCode: 100 });
      expect(() => handleToSolidityType(handle)).toThrow(
        'Unknown handle type code: 100'
      );
    });

    it('throws for type code 255', () => {
      const handle = buildHandle({ typeCode: 255 });
      expect(() => handleToSolidityType(handle)).toThrow(
        'Unknown handle type code: 255'
      );
    });
  });

  describe('invalid handle format', () => {
    it('throws for handle too short', () => {
      expect(() => handleToSolidityType('0x1234' as never)).toThrow(
        'Invalid handle: 0x1234'
      );
    });

    it('throws for handle too long', () => {
      const longHandle = '0x' + 'aa'.repeat(33);
      expect(() => handleToSolidityType(longHandle as never)).toThrow(
        `Invalid handle: ${longHandle}`
      );
    });
  });
});

describe('handleToChainId', () => {
  describe('chain ID extraction (bytes 26-29, 4 bytes)', () => {
    it('extracts chain ID 1 (Ethereum mainnet)', () => {
      const handle = buildHandle({ chainId: 1 });
      expect(handleToChainId(handle)).toBe(1);
    });

    it('extracts chain ID 421614 (Arbitrum Sepolia)', () => {
      const handle = buildHandle({ chainId: 421_614 });
      expect(handleToChainId(handle)).toBe(421_614);
    });

    it('extracts max uint32 chain ID (0xFFFFFFFF)', () => {
      const maxUint32 = 0xff_ff_ff_ff;
      const handle = buildHandle({ chainId: maxUint32 });
      expect(handleToChainId(handle)).toBe(maxUint32);
    });

    it('extracts chain ID 0', () => {
      const handle = buildHandle({ chainId: 0 });
      expect(handleToChainId(handle)).toBe(0);
    });
  });

  describe('invalid handle format', () => {
    it('throws for invalid handle', () => {
      expect(() => handleToChainId('0x1234' as never)).toThrow(
        'Invalid handle: 0x1234'
      );
    });
  });
});

describe('handleToVersion', () => {
  describe('version extraction (byte 31)', () => {
    it('extracts version 0', () => {
      const handle = buildHandle({ version: 0 });
      expect(handleToVersion(handle)).toBe(0);
    });

    it('extracts version 1', () => {
      const handle = buildHandle({ version: 1 });
      expect(handleToVersion(handle)).toBe(1);
    });

    it('extracts max version 255', () => {
      const handle = buildHandle({ version: 255 });
      expect(handleToVersion(handle)).toBe(255);
    });
  });

  describe('invalid handle format', () => {
    it('throws for invalid handle', () => {
      expect(() => handleToVersion('0x1234' as never)).toThrow(
        'Invalid handle: 0x1234'
      );
    });
  });
});

describe('handle structure integrity', () => {
  it('correctly isolates each field without overlap', () => {
    const handle = buildHandle({
      prehandle: 'ff'.repeat(26),
      chainId: 0x12_34_56_78,
      typeCode: 0x23,
      version: 0x01,
    });

    expect(handleToChainId(handle)).toBe(0x12_34_56_78);
    expect(handleToSolidityType(handle)).toBe('uint256');
    expect(handleToVersion(handle)).toBe(0x01);
  });

  it('different prehandles do not affect metadata extraction', () => {
    const handle1 = buildHandle({
      prehandle: '00'.repeat(26),
      chainId: 1,
      typeCode: 0,
      version: 0,
    });
    const handle2 = buildHandle({
      prehandle: 'ff'.repeat(26),
      chainId: 1,
      typeCode: 0,
      version: 0,
    });

    expect(handleToChainId(handle1)).toBe(handleToChainId(handle2));
    expect(handleToSolidityType(handle1)).toBe(handleToSolidityType(handle2));
    expect(handleToVersion(handle1)).toBe(handleToVersion(handle2));
  });
});
