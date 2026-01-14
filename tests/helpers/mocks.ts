import { vi } from 'vitest';
import {
  type JsonRpcProvider,
  type Eip1193Provider as EthersEip1193Provider,
} from 'ethers';
import { NETWORK_CONFIGS } from '../../src/config/networks.js';
import type { EIP712TypedData } from '../../src/services/blockchain/IBlockchainService.js';
import type { EIP1193Provider as ViemEIP1193Provider } from 'viem';

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
  return {
    async request({ method }: { method: string }) {
      if (method === 'eth_chainId') {
        return `0x${chainId.toString(16)}`;
      }
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        return [TEST_ADDRESS];
      }
      if (method === 'eth_signTypedData_v4') {
        return '0x' + 'a'.repeat(130); // Mock signature
      }
      throw new Error(`Unsupported method: ${method}`);
    },
  } as unknown as EIP1193Provider;
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
