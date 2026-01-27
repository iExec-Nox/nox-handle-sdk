import { vi } from 'vitest';
import {
  type JsonRpcProvider,
  type Eip1193Provider as EthersEip1193Provider,
  Wallet,
} from 'ethers';
import type { EIP1193Provider as ViemEIP1193Provider } from 'viem';
import { NETWORK_CONFIGS } from '../../src/config/networks.js';
import type { EIP712TypedData } from '../../src/services/blockchain/IBlockchainService.js';
import type { SolidityType } from '../../src/utils/types.js';
import type { HexString } from '../../src/types/internalTypes.js';

// Test constants
export const TEST_PRIVATE_KEY =
  '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1';
export const TEST_ADDRESS = '0x668417616f1502D13EA1f9528F83072A133e8E01';
export const SUPPORTED_CHAIN_ID = Number(Object.keys(NETWORK_CONFIGS)[0]);
export const UNSUPPORTED_CHAIN_ID = 999_999;

/**
 * Creates a mock JsonRpcProvider that returns the specified chainId
 */
export function createMockProvider(chainId: number): JsonRpcProvider {
  return {
    getNetwork: vi.fn().mockResolvedValue({ chainId: BigInt(chainId) }),
  } as unknown as JsonRpcProvider;
}

type EIP1193Provider = EthersEip1193Provider & ViemEIP1193Provider;
/**
 * creates a mock EIP1193 provider that returns the specified chainId and hardcoded responses for accounts and signing
 */
export function createMockEIP1193Provider(chainId: number): EIP1193Provider {
  const wallet = new Wallet(TEST_PRIVATE_KEY);
  return {
    async request({ method, params }: { method: string; params?: string[] }) {
      if (method === 'eth_chainId') {
        return `0x${chainId.toString(16)}`;
      }
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        return [wallet.address];
      }
      if (method === 'eth_signTypedData_v4') {
        const typedData = JSON.parse(params![1] as string) as EIP712TypedData;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { EIP712Domain, ...types } = typedData.types; // Exclude EIP712Domain not needed for ethers
        return await wallet.signTypedData(
          typedData.domain,
          types,
          typedData.message
        );
      }
      throw new Error(
        `Unsupported method: ${method} called with params: ${JSON.stringify(params)}`
      );
    },
  } as unknown as EIP1193Provider;
}

/**
 * Handle Structure (32 bytes) per spec:
 * [0-25]     Prehandle (26 bytes)
 * [26-29]    Chain ID (4 bytes, uint32)
 * [30]       Type code (1 byte)
 * [31]       Version (1 byte)
 */
export function buildHandle(options: {
  prehandle?: string;
  chainId?: number;
  typeCode?: number;
  version?: number;
}): HexString {
  const prehandle = options.prehandle ?? 'ab'.repeat(26);
  const chainIdHex = (options.chainId ?? 1).toString(16).padStart(8, '0');
  const typeHex = (options.typeCode ?? 0).toString(16).padStart(2, '0');
  const versionHex = (options.version ?? 0).toString(16).padStart(2, '0');
  return `0x${prehandle}${chainIdHex}${typeHex}${versionHex}`;
}

/**
 * Handle Proof Structure (137 bytes = 274 hex chars) per spec:
 * [0-19]    Owner (20 bytes = 40 hex chars)
 * [20-39]   SmartContractAddress (20 bytes = 40 hex chars)
 * [40-71]   Created At (32 bytes = 64 hex chars, uint256 timestamp)
 * [72-136]  Signature (65 bytes = 130 hex chars)
 */
export function buildHandleProof(options?: {
  owner?: string;
  createdAt?: string;
  signature?: string;
  smartContractAddress?: string;
}): HexString {
  const owner = options?.owner?.slice(2, 42) ?? 'ab'.repeat(20);
  const smartContractAddress =
    options?.smartContractAddress?.slice(2, 42) ?? 'ab'.repeat(20);
  // Default to current timestamp
  const defaultTimestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(64, '0');
  const createdAt = options?.createdAt ?? defaultTimestamp;
  const signature = options?.signature ?? 'ab'.repeat(65);
  return `0x${owner}${smartContractAddress}${createdAt}${signature}`;
}

/**
 * Converts a Unix timestamp (seconds) to a 32-byte hex string
 */
export function timestampToHex(timestamp: number | bigint): string {
  return BigInt(timestamp).toString(16).padStart(64, '0');
}

/**
 * Mock EIP-712 typed data for testing purposes.
 */
export const EIP712_TYPED_DATA_MOCK: EIP712TypedData = {
  domain: {
    name: 'MyApp',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  },
  primaryType: 'Person',
  message: {
    name: 'Alice',
    wallet: '0x1234567890123456789012345678901234567890',
  },
};

/**
 * Dummy typed handles for each Solidity type for testing purposes.
 */
export const DUMMY_TYPED_HANDLES: Record<SolidityType, `0x${string}`> = {
  bool: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00aa',
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01aa',
  bytes: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa02aa',
  string: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa03aa',
  uint8: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa04aa',
  uint16: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa05aa',
  uint24: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa06aa',
  uint32: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa07aa',
  uint40: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa08aa',
  uint48: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa09aa',
  uint56: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0aaa',
  uint64: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0baa',
  uint72: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0caa',
  uint80: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0daa',
  uint88: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0eaa',
  uint96: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0faa',
  uint104: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa10aa',
  uint112: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa11aa',
  uint120: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa12aa',
  uint128: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa13aa',
  uint136: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa14aa',
  uint144: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa15aa',
  uint152: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa16aa',
  uint160: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa17aa',
  uint168: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa18aa',
  uint176: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa19aa',
  uint184: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1aaa',
  uint192: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1baa',
  uint200: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1caa',
  uint208: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1daa',
  uint216: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1eaa',
  uint224: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1faa',
  uint232: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa20aa',
  uint240: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa21aa',
  uint248: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa22aa',
  uint256: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa23aa',
  int8: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa24aa',
  int16: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa25aa',
  int24: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa26aa',
  int32: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa27aa',
  int40: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa28aa',
  int48: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa29aa',
  int56: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2aaa',
  int64: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2baa',
  int72: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2caa',
  int80: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2daa',
  int88: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2eaa',
  int96: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2faa',
  int104: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa30aa',
  int112: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa31aa',
  int120: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa32aa',
  int128: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa33aa',
  int136: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa34aa',
  int144: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa35aa',
  int152: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa36aa',
  int160: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa37aa',
  int168: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa38aa',
  int176: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa39aa',
  int184: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa3aaa',
  int192: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa3baa',
  int200: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa3caa',
  int208: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa3daa',
  int216: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa3eaa',
  int224: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa3faa',
  int232: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa40aa',
  int240: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa41aa',
  int248: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa42aa',
  int256: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa43aa',
  bytes1: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44aa',
  bytes2: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa45aa',
  bytes3: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa46aa',
  bytes4: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa47aa',
  bytes5: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa48aa',
  bytes6: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa49aa',
  bytes7: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa4aaa',
  bytes8: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa4baa',
  bytes9: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa4caa',
  bytes10: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa4daa',
  bytes11: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa4eaa',
  bytes12: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa4faa',
  bytes13: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa50aa',
  bytes14: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa51aa',
  bytes15: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa52aa',
  bytes16: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa53aa',
  bytes17: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa54aa',
  bytes18: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55aa',
  bytes19: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa56aa',
  bytes20: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa57aa',
  bytes21: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa58aa',
  bytes22: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa59aa',
  bytes23: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5aaa',
  bytes24: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5baa',
  bytes25: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5caa',
  bytes26: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5daa',
  bytes27: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5eaa',
  bytes28: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5faa',
  bytes29: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa60aa',
  bytes30: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa61aa',
  bytes31: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa62aa',
  bytes32: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa63aa',
};
