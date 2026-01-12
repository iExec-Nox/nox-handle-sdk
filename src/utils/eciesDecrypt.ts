import { bytesToHex } from './bytesToHex.js';
import { hexToBytes } from './hexToBytes.js';

const DERIVATION_INFO = hexToBytes(
  '69457865632d45434945533a7273615f777261707065643a76302e31' // hardcoded "iExec-ECIES:rsa_wrapped:v0.1" hex
);

/**
 * Decrypts ciphertext using ECIES HKDF with the provided ephemeral shared secret point.
 *
 * @param ciphertext hex encoded ciphertext to decrypt (format: encrypted_data + auth_tag[16])
 * @param iv hex encoded initialization vector (IV) used during encryption
 * @param ephemeralSharedSecretPoint hex encoded SEC1 ephemeral shared secret point for decryption (K*privateKey)
 * @returns Decrypted hex encoded plaintext
 */
export async function eciesDecrypt(
  ciphertext: string,
  iv: string,
  ephemeralSharedSecretPoint: string
): Promise<string> {
  // Convert hex strings to Uint8Array
  const ciphertextBytes = hexToBytes(ciphertext);
  const sharedSecretBytes = hexToBytes(ephemeralSharedSecretPoint);

  // Extract x-coordinate from shared secret point (SEC1 encoding)
  if (sharedSecretBytes.length !== 33) {
    throw new TypeError('Invalid shared secret point length');
  }
  const xCoordinate = sharedSecretBytes.slice(1, 33);

  // Import shared secret as key material for HKDF
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    xCoordinate,
    'HKDF',
    false,
    ['deriveKey']
  );

  // Derive AES-256-GCM key using HKDF with SHA-256
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32), // empty salt
      info: DERIVATION_INFO, // protocol-specific info
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt using AES-256-GCM
  const decryptedBytes = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: hexToBytes(iv),
      tagLength: 128,
    },
    aesKey,
    ciphertextBytes
  );

  // Convert decrypted bytes back to hex
  return bytesToHex(new Uint8Array(decryptedBytes));
}
