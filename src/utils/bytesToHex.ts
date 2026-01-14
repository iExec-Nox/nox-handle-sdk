/**
 * Converts Uint8Array to hex string with "0x" prefix
 */
export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
