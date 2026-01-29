import {
  type BaseUrl,
  type EthereumAddress,
  type HexString,
} from '../types/internalTypes.js';
import {
  handleToChainId,
  handleToSolidityType,
  handleToVersion,
  type SolidityType,
} from './types.js';
import { hexToUintX } from './hex.js';

export function isBaseURL(url: unknown): url is BaseUrl {
  return typeof url === 'string' && /^https?:\/\/[^/?]+\/?$/.test(url);
}

export function isEthereumAddress(
  address: unknown
): address is EthereumAddress {
  return typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address);
}

function isHandleProof(handleProof: unknown): handleProof is HexString {
  return (
    typeof handleProof === 'string' && INPUT_PROOF_PATTERN.test(handleProof)
  );
}

const HANDLE_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const INPUT_PROOF_PATTERN = /^0x[0-9a-fA-F]{274}$/;
const SUPPORTED_VERSIONS = [0];

// Timestamp validation constants
const MAX_FUTURE_DRIFT_SECONDS = 300n; // 5 minutes tolerance for clock drift
const MIN_VALID_TIMESTAMP = 1_767_225_600n; // Jan 1, 2026 00:00:00 UTC

export function validateHandle({
  handle,
  expectedChainId,
  expectedSolidityType,
}: {
  handle: unknown;
  expectedChainId: number;
  expectedSolidityType: SolidityType;
}): void {
  if (typeof handle !== 'string' || !HANDLE_PATTERN.test(handle)) {
    throw new TypeError(
      `Invalid handle format: expected 0x + 64 hex chars (32 bytes), got ${handle}`
    );
  }
  const chainId = handleToChainId(handle as HexString);
  if (chainId !== expectedChainId) {
    throw new Error(
      `Handle chainId mismatch: expected ${expectedChainId}, got ${chainId}`
    );
  }

  const solidityType = handleToSolidityType(handle as HexString);
  if (solidityType !== expectedSolidityType) {
    throw new Error(
      `Handle type mismatch: expected ${expectedSolidityType}, got ${solidityType}`
    );
  }

  const version = handleToVersion(handle as HexString);

  if (!SUPPORTED_VERSIONS.includes(version)) {
    throw new Error(
      `Unsupported handle version: ${version}. Supported versions: ${SUPPORTED_VERSIONS}`
    );
  }
}

/**
 * Validates handle proof structure (137 bytes):
 * [0-19] owner, [20-39] smartContractAddress, [40-71] createdAt, [72-136] signature
 */
export function validateHandleProof({
  handleProof,
  expectedOwner,
  expectedSmartContractAddress,
}: {
  handleProof: string;
  expectedOwner: string;
  expectedSmartContractAddress: string;
}): void {
  if (!isHandleProof(handleProof)) {
    throw new TypeError(
      `Invalid handleProof: expected 0x + 274 hex chars (137 bytes), got ${handleProof}`
    );
  }
  // Remove the prefix '0x'
  const handleProofWithoutPrefix = handleProof.slice(2);

  // Extract and validate owner (bytes 0-19)
  const ownerHex = ('0x' +
    handleProofWithoutPrefix.slice(0, 40)) as EthereumAddress;
  validateOwner(ownerHex, expectedOwner as EthereumAddress);

  // Extract and validate smartContractAddress (bytes 20-39)
  const smartContractAddressHex = ('0x' +
    handleProofWithoutPrefix.slice(40, 80)) as HexString;
  validateSmartContractAddress(
    smartContractAddressHex,
    expectedSmartContractAddress as EthereumAddress
  );

  // Extract and validate timestamp (bytes 40-71)
  const createdAtHex = ('0x' +
    handleProofWithoutPrefix.slice(80, 144)) as HexString;
  validateTimestamp(createdAtHex);

  // Signature (bytes 72-136, 65 bytes) length is implicitly validated by INPUT_PROOF_PATTERN
}

function validateOwner(ownerHex: string, expectedOwner: EthereumAddress) {
  if (ownerHex !== expectedOwner) {
    throw new Error(
      `Invalid owner: expected ${expectedOwner}, got ${ownerHex}`
    );
  }
}
function validateSmartContractAddress(
  smartContractAddressHex: HexString,
  expectedSmartContractAddress: EthereumAddress
) {
  if (smartContractAddressHex !== expectedSmartContractAddress) {
    throw new Error(
      `Invalid smartContractAddress: expected ${expectedSmartContractAddress}, got ${smartContractAddressHex}`
    );
  }
}
function validateTimestamp(createdAtHex: HexString): void {
  const createdAt = hexToUintX(createdAtHex, 256);
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));

  if (createdAt === 0n) {
    throw new TypeError('Invalid createdAt: timestamp cannot be zero');
  }
  if (createdAt < MIN_VALID_TIMESTAMP) {
    throw new TypeError(
      `Invalid createdAt: timestamp ${createdAt} is before minimum valid timestamp ${MIN_VALID_TIMESTAMP}`
    );
  }
  if (createdAt > nowSeconds + MAX_FUTURE_DRIFT_SECONDS) {
    throw new TypeError(
      `Invalid createdAt: timestamp ${createdAt} is too far in the future (max drift: ${MAX_FUTURE_DRIFT_SECONDS}s)`
    );
  }
}
