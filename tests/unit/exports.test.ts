import { describe, it, expect } from 'vitest';
import {
  createHandleClient,
  createEthersHandleClient,
  createViemHandleClient,
} from '../../src/index.js';

describe('SDK Exports', () => {
  it('should export createHandleClient', () => {
    expect(createHandleClient).toBeDefined();
    expect(typeof createHandleClient).toBe('function');
  });

  it('should export createEthersHandleClient', () => {
    expect(createEthersHandleClient).toBeDefined();
    expect(typeof createEthersHandleClient).toBe('function');
  });

  it('should export createViemHandleClient', () => {
    expect(createViemHandleClient).toBeDefined();
    expect(typeof createViemHandleClient).toBe('function');
  });
});
