import { describe, expect, it, vi } from 'vitest';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createMockEIP1193Provider } from '../../../helpers/mocks.js';
import { ViemBlockchainService } from '../../../../src/services/blockchain/ViemBlockchainService.js';
import {
  SUPPORTED_CHAIN_ID,
  TEST_ADDRESS,
  TEST_EIP712_TYPED_DATA,
  TEST_PRIVATE_KEY,
} from '../../../helpers/testData.js';

describe('ViemBlockchainService', () => {
  const testCases = [
    {
      name: 'EIP-1193 provider',
      client: createWalletClient({
        transport: custom(
          createMockEIP1193Provider(SUPPORTED_CHAIN_ID, TEST_PRIVATE_KEY)
        ),
      }),
    },
    {
      name: 'Local signer',
      client: createWalletClient({
        account: privateKeyToAccount(TEST_PRIVATE_KEY),
        transport: custom(
          createMockEIP1193Provider(SUPPORTED_CHAIN_ID, TEST_PRIVATE_KEY)
        ),
      }),
    },
  ];

  for (const { name, client } of testCases) {
    describe(`with ${name}`, () => {
      const blockchainService = new ViemBlockchainService(client);

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
        it('should verify typed data and recover signer address', async () => {
          const signature = await blockchainService.signTypedData(
            TEST_EIP712_TYPED_DATA
          );
          const recoveredAddress = await blockchainService.verifyTypedData(
            TEST_EIP712_TYPED_DATA.domain,
            TEST_EIP712_TYPED_DATA.types,
            TEST_EIP712_TYPED_DATA.message,
            signature
          );
          expect(recoveredAddress.toLowerCase()).toBe(
            TEST_ADDRESS.toLowerCase()
          );
        });
      });
    });
  }

  describe('error handling', () => {
    describe('getChainId', () => {
      it('should throw wrapped error when provider fails', async () => {
        const failingClient = createWalletClient({
          transport: custom({
            request: vi.fn().mockRejectedValue(new Error('RPC error')),
          }),
        });
        const service = new ViemBlockchainService(failingClient);

        try {
          await service.getChainId();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to get chain ID');

          const cause = (error as Error).cause as Error & { details?: string };
          expect(cause).toBeDefined();
          expect(cause.details).toBe('RPC error');
        }
      });
    });

    describe('getAddress', () => {
      it('should throw wrapped error when no accounts', async () => {
        const noAccountsClient = createWalletClient({
          transport: custom({
            request: vi.fn().mockImplementation(({ method }) => {
              if (
                method === 'eth_accounts' ||
                method === 'eth_requestAccounts'
              ) {
                return Promise.resolve([]);
              }
              throw new Error(`Unexpected method: ${method}`);
            }),
          }),
        });
        const service = new ViemBlockchainService(noAccountsClient);

        try {
          await service.getAddress();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to get address');

          const cause = (error as Error).cause as Error;
          expect(cause).toBeDefined();
          expect(cause.message).toBe('No connected account');
        }
      });
    });

    describe('signTypedData', () => {
      it('should throw wrapped error when signing fails', async () => {
        const failingClient = createWalletClient({
          transport: custom({
            request: vi.fn().mockImplementation(({ method }) => {
              if (
                method === 'eth_accounts' ||
                method === 'eth_requestAccounts'
              ) {
                return Promise.resolve([TEST_ADDRESS]);
              }
              if (method === 'eth_signTypedData_v4') {
                return Promise.reject(new Error('User rejected'));
              }
              throw new Error(`Unexpected method: ${method}`);
            }),
          }),
        });
        const service = new ViemBlockchainService(failingClient);

        try {
          await service.signTypedData(TEST_EIP712_TYPED_DATA);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to sign typed data');

          const cause = (error as Error).cause as Error & { details?: string };
          expect(cause).toBeDefined();
          expect(cause.details).toBe('User rejected');
        }
      });
    });
  });
});
