import { describe, expect, it, vi } from 'vitest';

import { Wallet, BrowserProvider, type JsonRpcProvider } from 'ethers';
import {
  createMockEIP1193Provider,
  createMockProvider,
  EIP712_TYPED_DATA_MOCK,
  TEST_ADDRESS,
  TEST_PRIVATE_KEY,
} from '../../../helpers/mocks.js';
import { EthersBlockchainService } from '../../../../src/services/blockchain/EthersBlockchainService.js';

describe('EthersBlockchainService', () => {
  const testCases = [
    {
      name: 'AbstractSigner',
      client: new Wallet(TEST_PRIVATE_KEY, createMockProvider(1)),
    },
    {
      name: 'BrowserProvider',
      client: new BrowserProvider(createMockEIP1193Provider(1)),
    },
  ];

  for (const { name, client } of testCases) {
    describe(`with ${name}`, () => {
      const blockchainService = new EthersBlockchainService(client);

      describe('getChainId', () => {
        it('should return the correct chainId', async () => {
          const chainId = await blockchainService.getChainId();
          expect(chainId).toBe(1);
        });
      });

      describe('getAddress', () => {
        it('should return the correct address', async () => {
          const address = await blockchainService.getAddress();
          expect(address).toBe(TEST_ADDRESS);
        });
      });

      describe('signTypedData', () => {
        it('should sign typed data correctly', async () => {
          const signature = await blockchainService.signTypedData(
            EIP712_TYPED_DATA_MOCK
          );
          expect(signature).toMatch(/0x[a-fA-F0-9]{130}/);
        });
      });
    });
  }

  describe('error handling', () => {
    describe('getChainId', () => {
      it('should throw wrapped error when provider fails', async () => {
        const failingProvider = {
          getNetwork: vi.fn().mockRejectedValue(new Error('Network error')),
        } as unknown as JsonRpcProvider;
        const signer = new Wallet(TEST_PRIVATE_KEY, failingProvider);
        const service = new EthersBlockchainService(signer);

        await expect(service.getChainId()).rejects.toThrow(
          'Failed to get chain ID'
        );
      });
    });

    describe('getAddress', () => {
      it('should throw wrapped error when signer fails', async () => {
        const browserProvider = new BrowserProvider({
          request: vi.fn().mockRejectedValue(new Error('No accounts')),
        });
        const service = new EthersBlockchainService(browserProvider);

        await expect(service.getAddress()).rejects.toThrow(
          'Failed to get address'
        );
      });
    });

    describe('signTypedData', () => {
      it('should throw wrapped error when signing fails', async () => {
        const browserProvider = new BrowserProvider({
          request: vi.fn().mockImplementation(({ method }) => {
            if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
              return Promise.resolve([TEST_ADDRESS]);
            }
            if (method === 'eth_signTypedData_v4') {
              return Promise.reject(new Error('User rejected'));
            }
            throw new Error(`Unexpected method: ${method}`);
          }),
        });
        const service = new EthersBlockchainService(browserProvider);

        await expect(
          service.signTypedData(EIP712_TYPED_DATA_MOCK)
        ).rejects.toThrow('Failed to sign typed data');
      });
    });
  });
});
