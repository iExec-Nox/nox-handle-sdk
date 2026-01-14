/**
 * Converts hex string with "0x" prefix to Uint8Array<ArrayBuffer>
 */
export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  // Validate hex encoding: must have leading 0x, even length and only contain hex characters
  if (!hex.startsWith('0x')) {
    throw new TypeError('Invalid hex string: missing "0x" prefix');
  }
  const hexWithoutPrefix = hex.slice(2);
  if (hexWithoutPrefix.length % 2 !== 0) {
    throw new TypeError('Invalid hex string: length must be even');
  }
  if (!/^[0-9a-fA-F]*$/.test(hexWithoutPrefix)) {
    throw new TypeError(
      'Invalid hex string: contains non-hexadecimal characters'
    );
  }
  const bytes = new Uint8Array(hexWithoutPrefix.length / 2);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(
      hexWithoutPrefix.slice(index * 2, index * 2 + 2),
      16
    );
  }
  return bytes;
}
