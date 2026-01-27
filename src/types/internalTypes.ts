/**
 * Internal types - not exported to consumers
 */

export type BaseUrl = `http${'' | 's'}://${string}`;
export type EthereumAddress = `0x${string}`;

/** Hex-encoded string with "0x" prefix */
export type HexString = `0x${string}`;

/** Result of encrypting an input value */
export interface EncryptInputResult {
  /** The encrypted handle for the value */
  handle: HexString;
  /** The proof required for smart contract verification */
  handleProof: HexString;
}
