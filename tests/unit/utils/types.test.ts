import { describe, expect, it } from 'vitest';
import {
  SOLIDITY_TYPES_SET,
  SOLIDITY_TYPE_TO_CODE,
  handleToSolidityType,
  solidityTypeToJsType,
} from '../../../src/utils/types.js';
import { DUMMY_TYPED_HANDLES } from '../../helpers/mocks.js';

describe('SOLIDITY_TYPES_SET', () => {
  it('should contain all Solidity types', () => {
    expect(SOLIDITY_TYPES_SET.size).toBe(100);
  });
});

describe('SOLIDITY_TYPE_TO_CODE', () => {
  it('should contain all Solidity types', () => {
    expect(SOLIDITY_TYPE_TO_CODE.size).toBe(100);
  });
});

describe('solidityTypeToJsType', () => {
  const testCases: [string, string][] = [
    ['bool', 'boolean'],
    ['address', 'string'],
    ['string', 'string'],
    ['bytes', 'string'],
    ['bytes1', 'string'],
    ['bytes2', 'string'],
    ['bytes3', 'string'],
    ['bytes4', 'string'],
    ['bytes5', 'string'],
    ['bytes6', 'string'],
    ['bytes7', 'string'],
    ['bytes8', 'string'],
    ['bytes9', 'string'],
    ['bytes10', 'string'],
    ['bytes11', 'string'],
    ['bytes12', 'string'],
    ['bytes13', 'string'],
    ['bytes14', 'string'],
    ['bytes15', 'string'],
    ['bytes16', 'string'],
    ['bytes17', 'string'],
    ['bytes18', 'string'],
    ['bytes19', 'string'],
    ['bytes20', 'string'],
    ['bytes21', 'string'],
    ['bytes22', 'string'],
    ['bytes23', 'string'],
    ['bytes24', 'string'],
    ['bytes25', 'string'],
    ['bytes26', 'string'],
    ['bytes27', 'string'],
    ['bytes28', 'string'],
    ['bytes29', 'string'],
    ['bytes30', 'string'],
    ['bytes31', 'string'],
    ['bytes32', 'string'],
    ['uint8', 'bigint'],
    ['uint16', 'bigint'],
    ['uint24', 'bigint'],
    ['uint32', 'bigint'],
    ['uint40', 'bigint'],
    ['uint48', 'bigint'],
    ['uint56', 'bigint'],
    ['uint64', 'bigint'],
    ['uint72', 'bigint'],
    ['uint80', 'bigint'],
    ['uint88', 'bigint'],
    ['uint96', 'bigint'],
    ['uint104', 'bigint'],
    ['uint112', 'bigint'],
    ['uint120', 'bigint'],
    ['uint128', 'bigint'],
    ['uint136', 'bigint'],
    ['uint144', 'bigint'],
    ['uint152', 'bigint'],
    ['uint160', 'bigint'],
    ['uint168', 'bigint'],
    ['uint176', 'bigint'],
    ['uint184', 'bigint'],
    ['uint192', 'bigint'],
    ['uint200', 'bigint'],
    ['uint208', 'bigint'],
    ['uint216', 'bigint'],
    ['uint224', 'bigint'],
    ['uint232', 'bigint'],
    ['uint240', 'bigint'],
    ['uint248', 'bigint'],
    ['uint256', 'bigint'],
    ['int8', 'bigint'],
    ['int16', 'bigint'],
    ['int24', 'bigint'],
    ['int32', 'bigint'],
    ['int40', 'bigint'],
    ['int48', 'bigint'],
    ['int56', 'bigint'],
    ['int64', 'bigint'],
    ['int72', 'bigint'],
    ['int80', 'bigint'],
    ['int88', 'bigint'],
    ['int96', 'bigint'],
    ['int104', 'bigint'],
    ['int112', 'bigint'],
    ['int120', 'bigint'],
    ['int128', 'bigint'],
    ['int136', 'bigint'],
    ['int144', 'bigint'],
    ['int152', 'bigint'],
    ['int160', 'bigint'],
    ['int168', 'bigint'],
    ['int176', 'bigint'],
    ['int184', 'bigint'],
    ['int192', 'bigint'],
    ['int200', 'bigint'],
    ['int208', 'bigint'],
    ['int216', 'bigint'],
    ['int224', 'bigint'],
    ['int232', 'bigint'],
    ['int240', 'bigint'],
    ['int248', 'bigint'],
    ['int256', 'bigint'],
  ];

  for (const [solidityType, expectedJsType] of testCases) {
    it(`should map Solidity type "${solidityType}" to JavaScript type "${expectedJsType}"`, () => {
      const jsType = solidityTypeToJsType(solidityType as any);
      expect(jsType).toBe(expectedJsType);
    });
  }

  it('should throw an error for invalid Solidity type', () => {
    expect(() => solidityTypeToJsType('invalidType' as never)).toThrowError(
      'Invalid Solidity type: invalidType'
    );
  });
});

describe('handleToSolidityType', () => {
  for (const solidityType of SOLIDITY_TYPES_SET.values()) {
    const handle =
      DUMMY_TYPED_HANDLES[solidityType as keyof typeof DUMMY_TYPED_HANDLES];

    it(`should map handle "${handle}" to Solidity type "${solidityType}"`, () => {
      const solidityTypeResult = handleToSolidityType(handle as `0x${string}`);
      expect(solidityTypeResult).toBe(solidityType);
    });
  }

  it('should throw an error for invalid handle', () => {
    expect(() => handleToSolidityType('0x1234' as never)).toThrowError(
      'Invalid handle: 0x1234'
    );
  });

  it('should throw an error for handle with unknown type code', () => {
    // Construct a handle with an invalid type code (e.g., 0xff)
    const invalidTypeCodeHandle =
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaffaa';
    expect(() =>
      handleToSolidityType(invalidTypeCodeHandle as `0x${string}`)
    ).toThrowError('Unknown handle type code: 255');
  });
});
