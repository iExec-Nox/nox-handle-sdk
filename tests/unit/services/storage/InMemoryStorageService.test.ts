import { describe, expect, it } from 'vitest';
import { InMemoryStorageService } from '../../../../src/services/storage/InMemoryStorageService.js';

describe('InMemoryStorageService', () => {
  it('should store and retrieve items correctly', () => {
    const storage = new InMemoryStorageService();
    storage.setItem('key1', 'value1');
    expect(storage.getItem('key1')).toBe('value1');
  });
  it('should overwrite existing items correctly', () => {
    const storage = new InMemoryStorageService();
    storage.setItem('key1', 'value1');
    storage.setItem('key1', 'value2');
    expect(storage.getItem('key1')).toBe('value2');
  });
  it('should return null for non-existent keys', () => {
    const storage = new InMemoryStorageService();
    expect(storage.getItem('key1')).toBeNull();
  });
  it('should remove items correctly', () => {
    const storage = new InMemoryStorageService();
    storage.setItem('key1', 'value1');
    expect(Object.keys(storage['storage'])).toEqual(['key1']);
    storage.removeItem('key1');
    expect(storage.getItem('key1')).toBeNull();
    expect(Object.keys(storage['storage'])).toEqual([]);
  });
});
