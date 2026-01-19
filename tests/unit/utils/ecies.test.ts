import { describe, expect, it } from 'vitest';
import { eciesDecrypt } from '../../../src/utils/ecies.js';

const CIPHERTEXT =
  '0xa39dd14f92c1e4172b07abbde2608b06c6d231d66146626ff8872c699945ec48cbb7573d164a2ce606fde095e2e127c4c91719c815532411fab17c27';
const IV = '0x31325f627974657321212121';
const SHARED_SECRET =
  '0xbe9a93b92278142c7a9c82d45d81f4dea995d4446c3a439a1204b8fe15d9c807';
const PLAINTEXT =
  '0x48656c6c6f2c2045434945532077697468205253412d77726170706564207368617265642073656372657421';

describe('eciesDecrypt', () => {
  it('should decrypt the ciphertext correctly', async () => {
    const result = await eciesDecrypt({
      ciphertext: CIPHERTEXT,
      iv: IV,
      sharedSecret: SHARED_SECRET,
    });
    expect(result).toBe(PLAINTEXT);
  });

  it('should throw an error for invalid shared secret length', async () => {
    const sharedSecret = '0x1234'; // Invalid length
    await expect(
      eciesDecrypt({
        ciphertext: CIPHERTEXT,
        iv: IV,
        sharedSecret,
      })
    ).rejects.toThrowError(new TypeError('Invalid shared secret length'));
  });

  it('should throw an error for invalid IV length', async () => {
    const iv = '0x1234'; // Invalid length
    await expect(
      eciesDecrypt({
        ciphertext: CIPHERTEXT,
        iv,
        sharedSecret: SHARED_SECRET,
      })
    ).rejects.toThrowError(new TypeError('Invalid IV length'));
  });
});
