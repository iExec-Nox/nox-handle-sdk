import { describe, expect, it } from 'vitest';
import { eciesDecrypt } from '../../../src/utils/eciesDecrypt.js';

describe('eciesDecrypt', () => {
  it('should decrypt the ciphertext correctly', async () => {
    const ciphertext =
      'a39dd14f92c1e4172b07abbde2608b06c6d231d66146626ff8872c699945ec48cbb7573d164a2ce606fde095e2e127c4c91719c815532411fab17c27';
    const iv = '31325f627974657321212121';
    const sharedSecretPoint =
      '02be9a93b92278142c7a9c82d45d81f4dea995d4446c3a439a1204b8fe15d9c807';
    const plaintext =
      '48656c6c6f2c2045434945532077697468205253412d77726170706564207368617265642073656372657421';
    const result = await eciesDecrypt(ciphertext, iv, sharedSecretPoint);
    expect(result).toBe(plaintext);
  });
});
