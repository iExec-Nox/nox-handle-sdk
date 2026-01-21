import { type BaseUrl, type EthereumAddress } from '../types/internalTypes.js';
import { SOLIDITY_TYPE_TO_CODE, type SolidityType } from './types.js';

export function isBaseURL(url: unknown): url is BaseUrl {
  return typeof url === 'string' && /^https?:\/\/[^/?]+\/?$/.test(url);
}

export function isEthereumAddress(
  address: unknown
): address is EthereumAddress {
  return typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address);
}

const HANDLE_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const INPUT_PROOF_PATTERN = /^0x[0-9a-fA-F]{274}$/;
const HANDLE_VERSION = 0;

interface ValidateHandleParameters {
  handle: unknown;
  expectedChainId: number;
  expectedSolidityType: SolidityType;
}

export function validateHandle({
  handle,
  expectedChainId,
  expectedSolidityType,
}: ValidateHandleParameters): void {
  if (typeof handle !== 'string' || !HANDLE_PATTERN.test(handle)) {
    throw new TypeError(
      `Invalid handle format: expected 0x + 64 hex chars (32 bytes), got ${handle}`
    );
  }

  const hexWithoutPrefix = handle.slice(2);

  const chainIdHex = hexWithoutPrefix.slice(52, 60);
  const chainId = Number.parseInt(chainIdHex, 16);
  if (chainId !== expectedChainId) {
    throw new Error(
      `Handle chainId mismatch: expected ${expectedChainId}, got ${chainId}`
    );
  }

  const typeCodeHex = hexWithoutPrefix.slice(60, 62);
  const typeCode = Number.parseInt(typeCodeHex, 16);
  const expectedTypeCode = SOLIDITY_TYPE_TO_CODE.get(expectedSolidityType);
  if (typeCode !== expectedTypeCode) {
    throw new Error(
      `Handle type mismatch: expected ${expectedTypeCode} (${expectedSolidityType}), got ${typeCode}`
    );
  }

  const versionHex = hexWithoutPrefix.slice(62, 64);
  const version = Number.parseInt(versionHex, 16);
  if (version !== HANDLE_VERSION) {
    throw new Error(
      `Handle version mismatch: expected ${HANDLE_VERSION}, got ${version}`
    );
  }
}

export function validateInputProof(inputProof: unknown): void {
  if (typeof inputProof !== 'string' || !INPUT_PROOF_PATTERN.test(inputProof)) {
    throw new TypeError(
      `Invalid inputProof: expected 0x + 274 hex chars (137 bytes), got ${inputProof}`
    );
  }
}
