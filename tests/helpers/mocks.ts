import { vi } from 'vitest';
import { BrowserProvider, JsonRpcProvider } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORK_ENDPOINTS } from '../../src/config/networks.js';
import type { ViemClient } from '../../src/services/blockchain/ViemBlockchainService.js';

// Test constants
export const TEST_PRIVATE_KEY =
  '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1';
export const SUPPORTED_CHAIN_ID = Number(Object.keys(NETWORK_ENDPOINTS)[0]);
export const UNSUPPORTED_CHAIN_ID = 999_999;

/**
 * Creates a mock JsonRpcProvider that returns the specified chainId
 */
export function createMockProvider(chainId: number): JsonRpcProvider {
  return {
    getNetwork: vi.fn().mockResolvedValue({ chainId: BigInt(chainId) }),
  } as unknown as JsonRpcProvider;
}

/**
 * Creates a mock BrowserProvider with EIP-1193 interface
 */
export function createMockBrowserProvider(chainId: number): BrowserProvider {
  return new BrowserProvider({
    async request({ method }: { method: string }) {
      if (method === 'eth_chainId') {
        return `0x${chainId.toString(16)}`;
      }
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        return ['0x1234567890123456789012345678901234567890'];
      }
      throw new Error(`Unsupported method: ${method}`);
    },
  });
}

/**
 * Creates a mock Viem WalletClient
 */
export function createMockViemClient(chainId: number): ViemClient {
  const account = privateKeyToAccount(TEST_PRIVATE_KEY);

  return {
    account,
    getChainId: vi.fn().mockResolvedValue(chainId),
  } as unknown as ViemClient;
}
