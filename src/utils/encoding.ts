import type { HexString } from '../types/internalTypes.js';
import {
  hexToBool,
  hexToIntX,
  hexToString,
  hexToUintX,
  isHexString,
} from './hex.js';
import type { JsValue, SolidityType } from './types.js';

/**
 * Decodes a hex string (with "0x" prefix) to a JavaScript value of the specified Solidity type.
 */
export function decodeValue<T extends SolidityType>(
  plaintext: HexString,
  solidityType: T
): JsValue<T> {
  let value: JsValue<T>;
  /* eslint unicorn/prefer-switch: ["error", {"minimumCases": 5}] */
  if (solidityType === 'bool') {
    value = hexToBool(plaintext) as JsValue<T>;
  } else if (solidityType === 'string') {
    value = hexToString(plaintext) as JsValue<T>;
  } else if (solidityType === 'bytes') {
    // no validation needed plaintext is always hex
    value = plaintext as JsValue<T>;
  } else if (solidityType === 'address') {
    if (!isHexString(plaintext, 20)) {
      throw new TypeError('Invalid address');
    }
    value = plaintext as JsValue<T>;
  } else if (solidityType.startsWith('uint')) {
    const bitSize = Number.parseInt(solidityType.slice(4), 10);
    value = hexToUintX(plaintext, bitSize) as JsValue<T>;
  } else if (solidityType.startsWith('int')) {
    const bitSize = Number.parseInt(solidityType.slice(3), 10);
    value = hexToIntX(plaintext, bitSize) as JsValue<T>;
  } else if (solidityType.startsWith('bytes')) {
    const byteSize = Number.parseInt(solidityType.slice(5), 10);
    if (!isHexString(plaintext, byteSize)) {
      throw new TypeError(`Invalid ${solidityType}`);
    }
    value = plaintext as JsValue<T>;
  } else {
    throw new Error(`Unsupported solidity type ${solidityType}`); // should never happen
  }
  return value;
}

const zeroPaddingRegExp = new RegExp(/^(?:00)*$/);
const fPaddingRegExp = new RegExp(/^(?:[fF]{2})*$/);

function assertPadding(padding: string, paddingRegExp: RegExp) {
  if (paddingRegExp.exec(padding) === null) {
    throw new TypeError('Invalid padding');
  }
}

function assertValueLength(value: string, byteSize: number) {
  if (value.length !== byteSize * 2) {
    throw new TypeError('Invalid value length');
  }
}

/**
 * Converts an onchain packed value (with bytes32 padding) to a regular hex string by removing the padding according to the Solidity type.
 */
export function unpack(hex: HexString, solidityType: SolidityType): HexString {
  // For dynamic types (bytes, string) first 32 bytes represents the value size, next bytes are the value right-padded to a multiple of 32 bytes.
  if (solidityType === 'string' || solidityType === 'bytes') {
    if (
      !isHexString(hex) ||
      hex.length < 2 + 32 * 2 || // must contain at least 32 bytes encoded size
      (hex.length - 2) % (32 * 2) !== 0 // total length must be a multiple of 32 bytes
    ) {
      throw new TypeError('Invalid hex string format');
    }
    const byteSize = Number.parseInt(hex.slice(0, 2 + 32 * 2), 16);
    const padding = hex.slice(2 + 32 * 2 + byteSize * 2);
    const value = hex.slice(2 + 32 * 2, 2 + 32 * 2 + byteSize * 2);
    assertPadding(padding, zeroPaddingRegExp);
    assertValueLength(value, byteSize);
    return `0x${value}`;
  }

  // static types are padded to 32 bytes
  if (!isHexString(hex, 32)) {
    throw new TypeError('Invalid hex string format');
  }
  // for bytesN types the value is right-padded to 32 bytes with zeros
  if (solidityType.startsWith('bytes')) {
    const byteSize = Number.parseInt(solidityType.slice(5), 10);
    const padding = hex.slice(2 + byteSize * 2);
    const value = hex.slice(2, 2 + byteSize * 2);
    assertPadding(padding, zeroPaddingRegExp);
    assertValueLength(value, byteSize);
    return `0x${value}`;
  }
  // For other types (bool, address, uintN, intN) value is left-padded to 32 bytes
  let byteSize = 0;
  let paddingRegExp = zeroPaddingRegExp;
  if (solidityType === 'bool') {
    byteSize = 1;
  } else if (solidityType === 'address') {
    byteSize = 20;
  } else if (solidityType.startsWith('uint')) {
    const bitSize = Number.parseInt(
      solidityType.split('uint')[1] as `${number}`,
      10
    );
    byteSize = bitSize / 8;
  } else if (solidityType.startsWith('int')) {
    const bitSize = Number.parseInt(
      solidityType.split('int')[1] as `${number}`,
      10
    );
    byteSize = bitSize / 8;
    if (hex[2] === 'f' || hex[2] === 'F') {
      paddingRegExp = fPaddingRegExp;
    }
  }
  const padding = hex.slice(2, -(byteSize * 2));
  const value = hex.slice(-byteSize * 2);
  assertPadding(padding, paddingRegExp);
  assertValueLength(value, byteSize);
  if (solidityType === 'bool' && value !== '00' && value !== '01') {
    throw new TypeError('Invalid boolean value');
  }
  return `0x${value}`;
}
