import { describe, expect, it } from 'vitest';
import { eciesDecrypt } from '../../../src/utils/ecies.js';

const CIPHERTEXT =
  '0xd1e5de769d8f80db8133530c6fecb493c1154b7012239a573e59a708bf3610e3f18c00b7d4672f5fea8f71d5439d7a428b7ccfe480e9479495a7662b';
const IV = '0x31325f627974657321212121';
const SHARED_SECRET =
  '0x2a1681c049f82db31a3e2a982f00bfb1d5249a51fb260f4d67b0555c75b28d7f';
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
