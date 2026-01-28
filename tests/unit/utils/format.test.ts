import { describe, expect, it } from 'vitest';
import { safeJsonStringify } from '../../../src/utils/format.js';

describe('safeJsonStringify', () => {
  it('should serialize bigints as strings', () => {
    const input = {
      a: 1,
      b: 9_007_199_254_741_991n,
      c: 'test',
      d: [12_345_678_901_234_567_890n, 42],
      e: {
        nestedBigInt: -9_876_543_210_987_654_321n,
      },
    };

    const result = safeJsonStringify(input);
    const expected =
      '{"a":1,"b":"9007199254741991","c":"test","d":["12345678901234567890",42],"e":{"nestedBigInt":"-9876543210987654321"}}';
    expect(result).toBe(expected);
  });
});
