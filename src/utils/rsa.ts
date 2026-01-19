import { bytesToHex, hexToBytes } from './hex.js';

/**
 * Generate RSA key pair
 *
 * @returns An object containing the public and private keys in PEM format
 */
export async function generateRsaKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
  return keyPair;
}

/**
 * Export RSA public key to spki (DER) hex encoded format
 *
 * @param keyPair
 * @returns spki (DER) hex encoded string public key
 */
export async function exportRsaPublicKey({
  publicKey,
}: {
  publicKey: CryptoKey;
}): Promise<`0x${string}`> {
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', publicKey);
  return bytesToHex(new Uint8Array(publicKeyBuffer));
}

/**
 * Decrypts ciphertext using RSA-OAEP
 *
 * @param privateKey - The RSA private key
 * @param ciphertextHex - The hex encoded ciphertext to decrypt
 * @returns Hex encoded decrypted plaintext
 */
export async function rsaDecrypt({
  privateKey,
  ciphertext,
}: {
  privateKey: CryptoKey;
  ciphertext: `0x${string}`;
}): Promise<`0x${string}`> {
  const ciphertextBytes = hexToBytes(ciphertext);
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    ciphertextBytes
  );
  return bytesToHex(new Uint8Array(decryptedBuffer));
}
