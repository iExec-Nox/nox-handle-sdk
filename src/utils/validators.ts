import {
  type BaseUrl,
  type EthereumAddress,
  type HexString,
} from '../types/internalTypes.js';
import {
  handleToAttribute,
  handleToSolidityType,
  handleToVersion,
} from './types.js';

export function isBaseURL(url: unknown): url is BaseUrl {
  return typeof url === 'string' && /^https?:\/\/[^/?]+\/?$/.test(url);
}

export function isSubgraphURL(url: unknown): url is BaseUrl {
  return (
    typeof url === 'string' && /^https?:\/\/[^/?]+(\/[^?]*)?(\?.*)?$/.test(url)
  );
}

export function isEthereumAddress(
  address: unknown
): address is EthereumAddress {
  return typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address);
}

const HANDLE_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const SUPPORTED_VERSIONS = [0];
const SUPPORTED_ATTRIBUTES = [0, 1];
const ZERO_HASH = ('0x' + '0'.repeat(64)) as HexString;

export function assertValidHandleFormat(
  handle: unknown
): asserts handle is HexString {
  if (typeof handle !== 'string' || !HANDLE_PATTERN.test(handle)) {
    throw new TypeError(
      `Invalid handle format: expected 0x + 64 hex chars (32 bytes), got ${handle}`
    );
  }
  if (handle === ZERO_HASH) {
    throw new TypeError(
      `Invalid handle: received an uninitialized handle — ensure the handle has been stored on-chain before use`
    );
  }
  const attribute = handleToAttribute(handle as HexString);
  if (!SUPPORTED_ATTRIBUTES.includes(attribute)) {
    throw new TypeError(
      `Unsupported handle attribute: expected one of [${SUPPORTED_ATTRIBUTES.join(',')}], got ${attribute}`
    );
  }
  handleToSolidityType(handle as HexString); // throws if type code unknown
  const version = handleToVersion(handle as HexString);
  if (!SUPPORTED_VERSIONS.includes(version)) {
    throw new TypeError(
      `Unsupported handle version: ${version}. Supported versions: ${SUPPORTED_VERSIONS}`
    );
  }
}

/**
 * Returns `true` if `handle` is a structurally valid Handle string, `false` otherwise.
 *
 * Checks performed:
 * - format: `0x` + 64 hex characters (32 bytes)
 * - not the zero hash (uninitialized handle)
 * - known attribute byte (0 or 1)
 * - known Solidity type code (byte 5)
 * - supported version (byte 0)
 */
export function isValidHandleFormat(handle: unknown): handle is HexString {
  try {
    assertValidHandleFormat(handle);
    return true;
  } catch {
    return false;
  }
}

export function assertRequiredParams<
  T extends Record<string, unknown>,
  K extends keyof T,
>(params: T, requiredKeys: K[]): void {
  const missingKeys = requiredKeys.filter((key) => params[key] === undefined);

  if (missingKeys.length === 0) {
    return;
  }
  throw new Error(
    `Missing required parameters: ${missingKeys.map(String).join(', ')}`
  );
}
