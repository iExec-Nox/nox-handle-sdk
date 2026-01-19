import type { EthereumAddress } from '../types/internalTypes.js';

/**
 * Checks url is a base URL
 *
 * if starts with http:// or https:// and has no path segment (/) nor query parameters (?).
 */
export function isBaseURL(url: string): boolean {
  return /^https?:\/\/[^/?]+\/?$/.test(url);
}

/**
 * Checks address is a valid Ethereum address
 *
 * if starts with 0x and is 40 characters long.
 */
export function isEthereumAddress(address: string): address is EthereumAddress {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}
