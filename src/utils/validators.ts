import {
  type BaseUrl,
  type EthereumAddress,
  type HexString,
} from '../types/internalTypes.js';
import {
  handleToAttribute,
  handleToChainId,
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
const INPUT_PROOF_PATTERN = /^0x[0-9a-fA-F]{274}$/;
const SUPPORTED_VERSIONS = [0];
const SUPPORTED_ATTRIBUTES = [0, 1];

function assertValidHandleFormat(handle: unknown): asserts handle is HexString {
  if (typeof handle !== 'string' || !HANDLE_PATTERN.test(handle)) {
    throw new TypeError(
      `Invalid handle format: expected 0x + 64 hex chars (32 bytes), got ${handle}`
    );
  }
  const handleHex = handle as HexString;
  const attribute = handleToAttribute(handleHex);
  if (!SUPPORTED_ATTRIBUTES.includes(attribute)) {
    throw new Error(
      `Invalid handle format: Unsupported handle attribute: expected one of [${SUPPORTED_ATTRIBUTES.join(',')}], got ${attribute}`
    );
  }
  handleToSolidityType(handleHex); // throws "Unknown handle type code: X" if type code is not supported
  const version = handleToVersion(handleHex);
  if (!SUPPORTED_VERSIONS.includes(version)) {
    throw new Error(
      `Invalid handle format: Unsupported handle version: ${version}. Supported versions: ${SUPPORTED_VERSIONS}`
    );
  }
}

/**
 * Returns true if the handle has a valid format (correct byte length, supported version,
 * known type code, and valid attribute). Does not check the chain ID — use this as a
 * lightweight pre-check before passing the handle to {@link HandleClient} methods.
 */
export function isValidHandleFormat(handle: unknown): handle is HexString {
  try {
    assertValidHandleFormat(handle);
    return true;
  } catch {
    return false;
  }
}

export function validateHandle({
  handle,
  expectedChainId,
}: {
  handle: unknown;
  expectedChainId: number;
}): void {
  assertValidHandleFormat(handle);
  const chainId = handleToChainId(handle);
  if (chainId !== expectedChainId) {
    throw new Error(
      `Invalid handle format: Handle chainId mismatch: expected ${expectedChainId}, got ${chainId}`
    );
  }
}

export function validateHandleProof(handleProof: unknown): void {
  if (
    typeof handleProof !== 'string' ||
    !INPUT_PROOF_PATTERN.test(handleProof)
  ) {
    throw new TypeError(
      `Invalid handleProof: expected 0x + 274 hex chars (137 bytes), got ${handleProof}`
    );
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
