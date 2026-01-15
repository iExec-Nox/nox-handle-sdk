import { describe, expect, it } from 'vitest';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createMockEIP1193Provider,
  EIP712_TYPED_DATA_MOCK,
  TEST_ADDRESS,
  TEST_PRIVATE_KEY,
} from '../../../helpers/mocks.js';
import { ViemBlockchainService } from '../../../../src/services/blockchain/ViemBlockchainService.js';

describe('ViemBlockchainService', () => {
  const testCases = [
    {
      name: 'EIP-1193 provider',
      client: createWalletClient({
        transport: custom(createMockEIP1193Provider(1)),
      }),
    },
    {
      name: 'Local signer',
      client: createWalletClient({
        account: privateKeyToAccount(TEST_PRIVATE_KEY),
        transport: custom(createMockEIP1193Provider(1)),
      }),
    },
  ];

  for (const { name, client } of testCases) {
    describe(`with ${name}`, () => {
      const blockchainService = new ViemBlockchainService(client);

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
});
