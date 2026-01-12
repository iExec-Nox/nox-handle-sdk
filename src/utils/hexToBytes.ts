/**
 * Converts hex string to Uint8Array<ArrayBuffer>
 */
export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  // Validate hex encoding: must have even length and only contain hex characters
  if (hex.length % 2 !== 0) {
    throw new TypeError('Invalid hex string: length must be even');
  }
  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new TypeError(
      'Invalid hex string: contains non-hexadecimal characters'
    );
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
