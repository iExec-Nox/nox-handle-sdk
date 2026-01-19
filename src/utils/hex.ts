/**
 * Converts Uint8Array to hex string with "0x" prefix
 */
export function bytesToHex(bytes: Uint8Array): `0x${string}` {
  let hex: `0x${string}` = '0x';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Converts hex string with "0x" prefix to Uint8Array<ArrayBuffer>
 */
export function hexToBytes(hex: `0x${string}`): Uint8Array<ArrayBuffer> {
  // Validate hex encoding: must have leading 0x, even length and only contain hex characters
  if (!isHexString(hex)) {
    throw new TypeError(
      `Invalid hex string: expected even length string with "0x" prefix, got ${typeof hex} ${hex}`
    );
  }
  const hexWithoutPrefix = hex.slice(2);
  const bytes = new Uint8Array(hexWithoutPrefix.length / 2);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(
      hexWithoutPrefix.slice(index * 2, index * 2 + 2),
      16
    );
  }
  return bytes;
}

/**
 * Checks if a value is a valid hex string with "0x" prefix
 */
export function isHexString(value: unknown): value is `0x${string}` {
  if (typeof value !== 'string') {
    return false;
  }
  if (!/^0x([0-9a-fA-F]{2})*$/.test(value)) {
    return false;
  }
  return true;
}
