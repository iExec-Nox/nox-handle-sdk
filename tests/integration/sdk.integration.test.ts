import { describe, it, expect } from 'vitest';
import { version } from '../../src/index.js';

describe('SDK Integration', () => {
  it('should import and use the SDK', async () => {
    // Test that the SDK can be imported
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version).toBe('0.0.1');
  });

  it('should have correct version format', () => {
    // Test version format (semver-like)
    const versionPattern = /^\d+\.\d+\.\d+$/;
    expect(version).toMatch(versionPattern);
  });
});
