import { describe, it, expect } from 'vitest';
import { version } from '../../src/index.js';

describe('Version', () => {
  it('should export version', () => {
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version).toBe('0.0.1');
  });
});
