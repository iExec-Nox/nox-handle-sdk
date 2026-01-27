import { describe, expect, it, vi } from 'vitest';

import { Wallet, BrowserProvider, type JsonRpcProvider } from 'ethers';
import {
  createMockEIP1193Provider,
  createMockProvider,
} from '../../../helpers/mocks.js';
import { EthersBlockchainService } from '../../../../src/services/blockchain/EthersBlockchainService.js';
import {
  SUPPORTED_CHAIN_ID,
  TEST_ADDRESS,
  TEST_EIP712_TYPED_DATA,
  TEST_PRIVATE_KEY,
} from '../../../helpers/testData.js';

describe('EthersBlockchainService', () => {
  const testCases = [
    {
      name: 'AbstractSigner',
      client: new Wallet(
        TEST_PRIVATE_KEY,
        createMockProvider(SUPPORTED_CHAIN_ID)
      ),
    },
    {
      name: 'BrowserProvider',
      client: new BrowserProvider(
        createMockEIP1193Provider(SUPPORTED_CHAIN_ID, TEST_PRIVATE_KEY)
      ),
    },
  ];

  for (const { name, client } of testCases) {
    describe(`with ${name}`, () => {
      const blockchainService = new EthersBlockchainService(client);

      describe('getChainId', () => {
        it('should return the correct chainId', async () => {
          const chainId = await blockchainService.getChainId();
          expect(chainId).toBe(SUPPORTED_CHAIN_ID);
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
            TEST_EIP712_TYPED_DATA
          );
          expect(signature).toMatch(/0x[a-fA-F0-9]{130}/);
        });
      });

      describe('verifyTypedData', () => {
        it('should verify typed data correctly', async () => {
          const signature = await blockchainService.signTypedData(
            TEST_EIP712_TYPED_DATA
          );
          const recoveredAddress = await blockchainService.verifyTypedData(
            TEST_EIP712_TYPED_DATA.domain,
            TEST_EIP712_TYPED_DATA.types,
            TEST_EIP712_TYPED_DATA.message,
            signature
          );
          expect(recoveredAddress).toBe(TEST_ADDRESS);
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

        try {
          await service.getChainId();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to get chain ID');

          const cause = (error as Error).cause as Error;
          expect(cause).toBeInstanceOf(Error);
          expect(cause.message).toBe('Network error');
        }
      });
    });

    describe('getAddress', () => {
      it('should throw wrapped error when signer fails', async () => {
        const browserProvider = new BrowserProvider({
          request: vi.fn().mockRejectedValue(new Error('No accounts')),
        });
        const service = new EthersBlockchainService(browserProvider);

        try {
          await service.getAddress();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to get address');

          const cause1 = (error as Error).cause as Error;
          expect(cause1).toBeInstanceOf(Error);
          expect(cause1.message).toBe(
            'Failed to get signer from BrowserProvider'
          );

          const cause2 = cause1.cause as Error & {
            error?: { message: string };
          };
          expect(cause2).toBeDefined();
          expect(cause2.error?.message).toBe('No accounts');
        }
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

        try {
          await service.signTypedData(TEST_EIP712_TYPED_DATA);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to sign typed data');

          const cause = (error as Error).cause as Error & {
            error?: { message: string };
          };
          expect(cause).toBeDefined();
          expect(cause.error?.message).toBe('User rejected');
        }
      });
    });
  });
});
